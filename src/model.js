import pluralize from "pluralize";
import logService from "./log-service.js";
import mysqlService from "./mysql-service.js";
import _ from "lodash";

export default class Model {
  name;
  pluralName;

  fields = [];
  relations = [];
  attributes = new Map();

  constructor(name, fields) {
    this.name = pluralize.singular(name);
    this.pluralName = name;
    this.fields = fields;
  }

  addRelationship(relation) {
    this.relations.push(relation);
    logService.info(`Loaded relationship "${relation}" to ${this.name}`);
  }

  addAttribute(attributeName, values = []) {
    this.attributes.set(attributeName, values);
    logService.info(`Loaded attribute "${attributeName}" to ${this.name}`);
  }

  getValidFields(data) {
    const fields = this.fields.map((field) => field.Field);

    return _.pick(data, fields);
  }

  async getAll() {
    // TODO: Add look for relationships
    // TODO: Ignore soft deletes
    const data = await mysqlService.runQuery(
      `SELECT * FROM ${this.pluralName}`
    );

    return data;
  }

  async get(id) {
    // TODO: Add look for relationships
    // TODO: Ignore soft deletes
    const data = await mysqlService.runQuery(
      `SELECT * FROM ${this.pluralName}
       WHERE id = ${id}`
    );

    return data[0];
  }

  async update(id, data = {}) {
    delete data.id;
    const fieldsToUpdate = this.getValidFields(data);

    const result = await mysqlService.runQuery(`
      UPDATE ${this.pluralName}
      SET ${this.parseFieldsToSQLUpdate(fieldsToUpdate)}
      WHERE id = ${id}
    `);

    return this.get(id);
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
