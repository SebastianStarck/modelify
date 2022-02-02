import pluralize from "pluralize";
import logService from "./log-service.js";
import mysqlService from "./mysql-service.js";
import InvalidModelInputError from "./InvalidModelInputError.js";
import _ from "lodash";

export default class Model {
  name;
  capitalizedName;
  pluralName;

  fields = [];
  updateableFields = [];
  requiredFields = [];

  relations = [];
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

  addRelationship(relation) {
    this.relations.push(relation);
    logService.logAttributeOrRelationSet("relationship", relation, this.name);
  }

  addAttribute(attributeName, values = []) {
    this.attributes.set(attributeName, values);
    logService.logAttributeOrRelationSet("attribute", attributeName, this.name);
  }

  getValidFields(data) {
    return _.pick(data, this.updateableFields);
  }

  getFieldsForDocumentation() {
    return this.fields.map(({ Type }) => {
      const isNumber = Type.includes("int");
      return {
        type: isNumber ? "integer" : "string",
        format: isNumber ? "int32" : null,
      };
    });
  }

  async getAll() {
    const data = await mysqlService.runQuery(
      `SELECT * FROM ${this.pluralName}`
    );

    return data;
  }

  async get(id) {
    const data = await mysqlService.runQuery(
      `SELECT * FROM ${this.pluralName}
       WHERE id = ${id}`
    );

    return data[0];
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
}
