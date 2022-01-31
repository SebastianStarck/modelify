import pluralize from "pluralize";
import logService from "./log-service.js";
import mysqlService from "./mysql-service.js";

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

  async getAll() {
    // TODO: Add look for relationships
    // TODO: Ignore soft deletes
    const data = await mysqlService.runQuery(
      `SELECT * FROM ${this.pluralName}`
    );

    return data;
  }
}
