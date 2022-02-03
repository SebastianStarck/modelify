import pluralize from "pluralize";
import _ from "lodash";

export default class Relationship {
  name;
  capitalizedName;
  pluralName;

  fields = [];
  updateableFields = [];
  requiredFields = [];

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
}
