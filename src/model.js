import pluralize from "pluralize";
import logService from "./log-service.js";
import mysqlService from "./mysql-service.js";
import _ from "lodash";

export default class Model {
  name;
  pluralName;

  fields = [];
  updateableFields = [];
  relations = [];
  attributes = new Map();

  constructor(name, fields) {
    this.name = pluralize.singular(name);
    this.pluralName = name;
    this.fields = fields;

    this.updateableFields = _.without(
      fields.map((field) => field.Field),
      "id",
      "created_at",
      "updated_at",
      "deleted_at"
    );
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

  async getLast() {
    // TODO: Add look for relationships
    // TODO: Ignore soft deletes
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

    const result = await mysqlService.runQuery(`
      UPDATE ${this.pluralName}
      SET 
        ${this.parseFieldsToSQLUpdate(fieldsToUpdate)}, 
        updated_at = NOW()
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

    return {};
  }

  async create(data = {}) {
    const fieldsToUpdate = this.getValidFields(data);
    const columns = Object.keys(fieldsToUpdate)
      .map((column) => `\`${column}\``)
      .concat("created_at", "updated_at")
      .join(", ");
    const values = Object.values(fieldsToUpdate)
      .map((value) => `'${value}'`)
      .concat("NOW()", "NOW()")
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
