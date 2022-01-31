import mysqlService from "./mysql-service.js";
import logService from "./log-service.js";
import Model from "./model.js";

export default class DatabaseExplorer {
  tables = [];
  models = new Map();

  async explore() {
    logService.log("Scouting database...");
    await this.loadTables();
    await this.loadModels();
    this.loadRelationshipsAndAttributes();

    return this;
  }

  async loadTables() {
    const queryResponse = await mysqlService.runQuery(
      "SELECT table_name as 'table' FROM information_schema.tables where table_schema='modelify';"
    );

    this.tables = queryResponse.map((row) => row.table);

    logService.info(`Discovered ${this.tables.length} tables`);
  }

  async loadModels() {
    const models = await Promise.all(
      this.tables.filter((table) => !table.includes("_")).map(this.getModel)
    );

    models.forEach((model) => {
      this.models.set(model.name, model);
    });

    logService.info(`Discovered ${this.models.size} models`);
  }

  async getModel(modelName) {
    const tableMetadata = await mysqlService.runQuery(
      `DESCRIBE \`${modelName}\``
    );

    return new Model(modelName, tableMetadata);
  }

  /*
    Many-to-Many relationships comes from tables named: singularModel _ pluralModel
    Model attributes comes from tables named: singularModel _ attribute
   */
  loadRelationshipsAndAttributes() {
    const nonModelTables = this.tables.filter((table) => table.includes("_"));

    nonModelTables.forEach((tableName) => {
      const [modelName, modelOrAttribute] = tableName.split("_");
      const targetModel = this.models.get(modelName);
      const otherIsModel = this.tables.includes(modelOrAttribute);

      if (otherIsModel) {
        targetModel.addRelationship(modelOrAttribute);
      } else {
        targetModel.addAttribute(modelOrAttribute);
      }
    });
  }
}
