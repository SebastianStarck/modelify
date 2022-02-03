import pluralize from "pluralize";
import logService from "./log-service.js";
import mysqlService from "./mysql-service.js";
import InvalidModelInputError from "./invalid-model-input-error.js";
import Relationship from "./relationship.js";
import _ from "lodash";

export default class Model {
  name;
  capitalizedName;
  pluralName;

  fields = [];
  updateableFields = [];
  requiredFields = [];

  relations = new Map();
  attributes = new Map();

  constructor(name, fields) {
    this.name = pluralize.singular(name);
    this.capitalizedName = _.capitalize(this.name);
    this.pluralName = name;
    this.fields = fields;

    this.updateableFields = _.without(
      fields.map((field) => field.Field),
      "id",
      "created_at"
    );

    this.requiredFields = fields
      .filter(
        (field) => field.Null === "NO" && field.Extra !== "auto_increment"
      )
      .map((field) => field.Field);
  }

  async addRelationship(name) {
    const tableData = await mysqlService.runQuery(`DESCRIBE ${name}`);
    this.relations.set(name, new Relationship(name, tableData));
    logService.logAttributeOrRelationSet("relationship", name);
  }

  addAttribute(attributeName, values = []) {
    console.log("set attribute", attributeName);
    this.attributes.set(attributeName, values);
    logService.logAttributeOrRelationSet("attribute", attributeName, this.name);
  }

  getValidFields(data) {
    return _.pick(data, this.updateableFields);
  }

  getFieldsForDocumentation() {
    return this.fields.reduce((result, { Field, Type }) => {
      const isNumber = Type.includes("int");
      return {
        ...result,
        [Field]: {
          type: isNumber ? "integer" : "string",
          format: isNumber ? "int32" : null,
        },
      };
    }, {});
  }

  async get(id = null) {
    let query = `SELECT`;

    this.fields.forEach(({ Field }, index) => {
      if (index !== 0) {
        query += ",";
      }

      query += `\n M.${Field}`;
    });

    this.relations.forEach((relationModel, relation) => {
      relationModel.fields.forEach(({ Field }) => {
        query += `,\n GROUP_CONCAT(\`${relation}\`.${Field}) as '${relation}.${Field}'`;
      });
    });

    query += `\n FROM ${this.pluralName} M`;
    this.relations.forEach((relationModel, relation) => {
      query += `\n JOIN \`${relation}\` ON M.id = \`${relation}\`.id_${this.name}`;
      //query += `\n JOIN \`${relation}\` ON \`${relation}\`.id_${relationModel.name} = ${relation}.id`;
    });

    if (id) {
      query += `\n WHERE M.id = ${id}`;
    }

    query += "\n GROUP BY M.id";
    const data = await mysqlService.runQuery(query);
    const result = data.map(this.flattenModel);

    return id ? result[0] : result;
  }

  async getLast() {
    const data = await mysqlService.runQuery(
      `SELECT * FROM ${this.pluralName}
       ORDER BY id DESC
       LIMIT 1`
    );

    return data[0];
  }

  async update(id, data = {}) {
    delete data.id;
    const fieldsToUpdate = this.getValidFields(data);

    if (Object.keys(fieldsToUpdate).length === 0) {
      return this.get(id);
    }

    await mysqlService.runQuery(`
      UPDATE ${this.pluralName}
      SET ${this.parseFieldsToSQLUpdate(fieldsToUpdate)} 
      WHERE id = ${id}
    `);

    return this.get(id);
  }

  async delete(id) {
    await mysqlService.runQuery(`
      DELETE 
      FROM ${this.pluralName} 
      WHERE id = ${id}
    `);

    return {
      success: true,
    };
  }

  async create(data = {}) {
    const fieldsToUpdate = this.getValidFields(data);
    const missingRequiredFields = this.requiredFields.filter(
      (field) => !Object.keys(fieldsToUpdate).includes(field)
    );

    if (missingRequiredFields.length > 0) {
      throw new InvalidModelInputError(missingRequiredFields);
    }

    const columns = Object.keys(fieldsToUpdate)
      .map((column) => `\`${column}\``)
      .concat("created_at")
      .join(", ");

    const values = Object.values(fieldsToUpdate)
      .map((value) => `'${value}'`)
      .concat("NOW()")
      .join(", ");

    await mysqlService.runQuery(`
      INSERT INTO ${this.pluralName} (${columns})
      VALUES (${values})
    `);

    return this.getLast();
  }

  parseFieldsToSQLUpdate(fields) {
    const data = Object.entries(fields);

    return data.reduce((accumulator, [field, value], index) => {
      let result = accumulator + `\`${field}\` = '${value}'`;

      if (index !== data.length - 1) {
        result += ", \n";
      }

      return result;
    }, "");
  }

  getRelationTargetField(relationName, field) {
    const relation = this.relations.get(relationName);

    if (!relation) {
      throw new Error(`Relation "${relationName}" not found`);
    }

    // This assumes all relationships are an enum reference with an ID column followed of the desired column
    return relation.fields.slice(1, 2).Field;
  }

  // Separate the model data from its relations' data
  flattenModel = (model) => {
    const flattenModel = Object.entries(model).reduce(
      (result, [key, value]) => {
        const [relation, relationKey] = key.split(".");

        if (!relationKey) {
          result[key] = value;
        } else {
          result[relation] = { ...result[relation], [relationKey]: value };
        }

        return result;
      },
      {}
    );

    this.relations.forEach((relation) => {
      flattenModel[relation.pluralName] = this.parseRelationCollection(
        flattenModel[relation.pluralName]
      );
    });

    return flattenModel;
  };

  /*
    From "user_attributes": { "id": "1,2,3" ...},
    To   "user_attributes": [{ "id": "1"...}, { "id": "2" }...]
   */
  parseRelationCollection(relationship) {
    console.log(relationship);
    return Object.entries(relationship).reduce((result, [key, value]) => {
      (value || "").split(",").forEach((relationValueEntry, index) => {
        result[index] = {
          ...result[index],
          [key]: relationValueEntry || null,
        };
      });

      return result;
    }, []);
  }
}
