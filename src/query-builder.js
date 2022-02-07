"use strict";
import consts from "./consts.js";
import common from "./common.js";

export default class QueryBuilder {
  model;
  relations;

  constructor(model) {
    this.model = model;
    this.relations = [...model.relations.values()];
  }

  get(id = null) {
    if (id && isNaN(id)) {
      throw new Error("Invalid model id provided");
    }

    return "SELECT".concat(
      this.parseSelectFields(),
      `\n FROM ${this.model.tableName} M \n`,
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
    const parsedRelations = this.relations.reduce((result, relation) => {
      const relatedModelTable = relation.childrenModel.tableName;
      return result.concat(
        `LEFT JOIN \`${relation.tableName}\` ON M.id = \`${relation.tableName}\`.id_${this.model.name}`,
        `LEFT JOIN \`${relatedModelTable}\` ON \`${relatedModelTable}\`.id = \`${relation.tableName}\`.id_${relation.childrenModel.name}`
      );
    }, []);

    return common
      .serializeStringCollectionSpacing(parsedRelations, 0)
      .join("\n");
  }

  parseSelectFields() {
    const fields = this.model.fields
      .map(({ Field }) => `M.${Field} as '${Field}'`)
      .concat(
        this.relations.reduce((result, relationModel) => {
          return result.concat(relationModel.getFieldsForParentRelation());
        }, [])
      );

    return common
      .serializeStringCollectionSpacing(fields)
      .map((item) => `\n${consts.QUERY_SUBSTATEMENT_PADDING}${item}`);
  }

  create(data) {
    const [columns, values] = this.getColumnsAndValues(data, true);

    return `INSERT INTO ${this.model.tableName}`.concat(
      `\n(${columns.join(", ")})`,
      `\nVALUES (${values.join(", ")})`
    );
  }

  update(id, data) {
    return `UPDATE ${this.model.tableName}`.concat(
      `SET ${this.parseUpdateFields(data)}`,
      `WHERE id = ${id}`
    );
  }

  getColumnsAndValues(data, isNew = false, entity = this.model) {
    const columns = Object.keys(data).map((column) => `\`${column}\``);

    const values = Object.values(data).map((value) => `'${value}'`);

    if (entity.hasCreatedAtTimestamp && isNew) {
      columns.push("created_at");
      values.push("NOW()");
    }

    if (entity.hasUpdatedAtTimestamp) {
      columns.push("updated_at");
      values.push("NOW()");
    }

    return [columns, values];
  }

  parseUpdateFields(fields) {
    return common
      .serializeStringCollectionSpacing(
        Object.entries(fields).map(
          ([field, value]) => `\`${field}\` = '${value}'`
        )
      )
      .map((item) => `\n${consts.QUERY_SUBSTATEMENT_PADDING}${item},`);
  }

  createRelationEntries(relation, data) {
    return data.map((datum) => {
      const [columns, values] = this.getColumnsAndValues(datum, true, relation);

      return `INSERT INTO \`${relation.tableName}\``.concat(
        `\n(${columns.join(", ")})`,
        `\nVALUES (${values.join(", ")})`
      );
    });
  }

  deleteExistingRelation(id, relation) {
    return `DELETE FROM \`${relation.tableName}\``.concat(
      `\nWHERE \`id_${this.model.name}\` = ${id}`
    );
  }
}
