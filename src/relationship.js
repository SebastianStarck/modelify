import common from "./common.js";
import pluralize from "pluralize";
import _ from "lodash";
import mysqlService from "./mysql-service.js";
import InvalidRelationInputError from "./invalid-relation-input-error.js";

// TODO: Create common class with model shared behaviour
export default class Relationship {
  name;
  capitalizedName;
  tableName;

  fields = [];
  plainFields = [];
  updateableFields = [];
  requiredFields = [];
  hasCreatedAtTimestamp;
  hasUpdatedAtTimestamp;

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
    this.tableName = name;
    this.fields = fields;
    this.plainFields = fields.map(({ Field }) => Field);

    this.seniorModel = seniorModel;
    this.childrenModel = childrenModel;

    this.hasCreatedAtTimestamp = this.plainFields.includes("created_at");
    this.hasUpdatedAtTimestamp = this.plainFields.includes("updated_at");
    this.updateableFields = _.without(
      fields.map((field) => field.Field),
      "id",
      "created_at"
    );

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
        mysqlService.fieldToGroupConcantSelect(field, this.tableName)
      )
      .concat(
        this.childrenModel.fields.map((field) =>
          mysqlService.fieldToGroupConcantSelect(
            field,
            this.childrenModel.tableName,
            `${this.tableName}.${this.childrenModel.name}.${field.Field}`
          )
        )
      );
  }

  validateDataForCreate(relationCollection) {
    const collectionErrors = relationCollection.reduce(
      (collection, datum, index) => {
        const errors = this.requiredFields.filter(
          (field) => !Object.keys(datum).includes(field)
        );

        if (errors.length) {
          _.set(collection, index, errors);
        }

        return collection;
      },
      {}
    );

    if (Object.keys(collectionErrors).length > 0) {
      throw new InvalidRelationInputError(collectionErrors);
    }
  }
}
