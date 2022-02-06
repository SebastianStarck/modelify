import pluralize from "pluralize";
import logService from "./log-service.js";
import mysqlService from "./mysql-service.js";
import InvalidModelInputError from "./invalid-model-input-error.js";
import Relationship from "./relationship.js";
import QueryBuilder from "./query-builder.js";
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

  async addRelationship(name, seniorModel, childrenModel) {
    const tableData = await mysqlService.runQuery(`DESCRIBE ${name}`);
    const relationship = new Relationship(
      name,
      tableData,
      seniorModel,
      childrenModel
    );

    this.relations.set(name, relationship);
    logService.logAttributeOrRelationSet("relationship", name, this.name);
  }

  addAttribute(attributeName, values = []) {
    this.attributes.set(attributeName, values);
    logService.logAttributeOrRelationSet("attribute", attributeName, this.name);
  }

  getValidFields(data) {
    return _.pick(data, this.updateableFields);
  }

  // TODO: Improve field type casting from sql to swagger-like type
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
    const query = new QueryBuilder(this).get(id);
    const data = await mysqlService.runQuery(query);
    const result = data.map(this.rawSQLToModel);

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

  rawSQLToModel = (rawOutput) => {
    const model = Object.entries(rawOutput).reduce((result, [key, value]) => {
      return _.set(result, key, value);
    }, {});

    this.relations.forEach((relation) => {
      model[relation.pluralName] = this.parseRelationCollection(
        model[relation.pluralName]
      );
    });

    return model;
  };

  /*
    From "user_attributes": { "id": "1,2,3" ...},
    To   "user_attributes": [{ "id": "1"...}, { "id": "2" }...]
   */
  parseRelationCollection(relationship) {
    return Object.entries(relationship).reduce((result, [key, value]) => {
      const parsedValue =
        value && typeof value === "object"
          ? this.parseRelationCollection(value)
          : (value || "").split(",");

      parsedValue.forEach((relationValueEntry, index) => {
        result[index] = _.set(
          result[index] || {},
          key,
          relationValueEntry || null
        );
      });

      return result;
    }, []);
  }
}
