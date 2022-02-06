"use strict";
import consts from "./consts.js";
import common from "./common.js";

export default class QueryBuilder {
  operation = {
    type: null,
    relations: null,
    id: null,
  };
  model;
  relations;

  constructor(model, relations) {
    this.model = model;
    this.operation.relations = relations || [...model.relations.values()];
  }

  get(id = null) {
    if (id && isNaN(id)) {
      throw new Error("Invalid model id provided");
    }

    return "SELECT".concat(
      this.parseSelectFields(),
      `\n FROM ${this.model.pluralName} M \n`,
      this.parseRelationsJoin(),
      this.parseTargetId(id),
      "\n GROUP BY M.id"
    );
  }

  parseTargetId(id) {
    if (!id) {
      return "";
    }

    return `\n WHERE M.id = ${id}`;
  }

  parseRelationsJoin() {
    const parsedRelations = this.operation.relations.reduce(
      (result, relation) => {
        const relatedModelTable = relation.childrenModel.pluralName;
        return result.concat(
          `JOIN \`${relation.pluralName}\` ON M.id = \`${relation.pluralName}\`.id_${this.model.name}`,
          `JOIN \`${relatedModelTable}\` ON \`${relatedModelTable}\`.id = \`${relation.pluralName}\`.id_${relation.childrenModel.name}`
        );
      },
      []
    );

    return common.serializeStringCollectionSpacing(parsedRelations, 0).join("\n");
  }

  parseSelectFields() {
    const fields = this.model.fields
      .map(({ Field }) => `M.${Field} as '${Field}'`)
      .concat(
        this.operation.relations.reduce((result, relationModel) => {
          return result.concat(relationModel.getFieldsForParentRelation());
        }, [])
      );

    return common
      .serializeStringCollectionSpacing(fields)
      .map((item) => `\n${consts.QUERY_SELECT_PADDING}${item}`);
  }
}
