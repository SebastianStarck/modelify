import common from "./common.js";
import pluralize from "pluralize";
import _ from "lodash";
import mysqlService from "./mysql-service.js";

export default class Relationship {
  name;
  capitalizedName;
  pluralName;

  fields = [];
  updateableFields = [];
  requiredFields = [];

  seniorModel;
  childrenModel;
  attributes = new Map();

  constructor(name, fields, seniorModel, childrenModel) {
    if (!seniorModel) {
      common.stopAppWithError(`Missing senior model for relation ${name}`);
    }
    if (!childrenModel) {
      common.stopAppWithError(`Missing children model for relation ${name}`);
    }

    this.name = pluralize.singular(name);
    this.capitalizedName = _.capitalize(this.name);
    this.pluralName = name;
    this.fields = fields;
    this.seniorModel = seniorModel;
    this.childrenModel = childrenModel;

    this.updateableFields = _.without(
      fields.map((field) => field.Field),
      "id",
      "created_at"
    );

    this.requiredFields = fields
      .filter(mysqlService.columnIsRequired)
      .map(mysqlService.getColumnName);
  }

  getFieldsForParentRelation() {
    return this.fields
      .map((field) =>
        mysqlService.fieldToGroupConcantSelect(field, this.pluralName)
      )
      .concat(
        this.childrenModel.fields.map((field) =>
          mysqlService.fieldToGroupConcantSelect(
            field,
            this.childrenModel.pluralName,
            `${this.pluralName}.${this.childrenModel.name}.${field.Field}`
          )
        )
      );
  }
}
