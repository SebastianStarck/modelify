import mysqlService from "./mysql-service.js";
import logService from "./log-service.js";
import Model from "./model.js";
import pluralize from "pluralize";

export default class DatabaseExplorer {
  tables = [];
  models = new Map();

  async explore() {
    logService.log("\n> Scouting database...");
    await this.loadTables();
    await this.loadModels();
    await this.loadRelationshipsAndAttributes();

    return this;
  }

  async loadTables() {
    const tables = await mysqlService.getTables();

    this.tables = tables.map((row) => row.table);

    logService.info(`Discovered ${this.tables.length} tables`);
  }

  async loadModels() {
    const modelsToLoad = this.tables.filter((table) => !table.includes("_"));
    logService.log(`\n> Loading models...`);
    const models = await Promise.all(modelsToLoad.map(this.getModel));

    models.forEach((model) => {
      this.models.set(model.name, model);
    });
  }

  async getModel(modelName) {
    const tableMetadata = await mysqlService.runQuery(
      `DESCRIBE \`${modelName}\``
    );

    logService.logModelLoaded(modelName);
    return new Model(modelName, tableMetadata);
  }

  async loadRelationshipsAndAttributes() {
    const nonModelTables = this.tables.filter((table) => table.includes("_"));

    logService.log(`\n> Loading attributes and relationships...`);
    await Promise.all(
      nonModelTables.map(async (tableName) => {
        const [modelName, modelOrAttribute] = tableName.split("_");
        const targetModel = this.models.get(modelName);
        const otherIsModel = this.tables.includes(modelOrAttribute);

        if (otherIsModel) {
          return targetModel.addRelationship(
            tableName,
            targetModel,
            this.models.get(pluralize.singular(modelOrAttribute))
          );
        } else {
          return targetModel.addAttribute(tableName, targetModel);
        }
      })
    );
  }
}
