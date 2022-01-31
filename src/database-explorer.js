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
    const tables = await mysqlService.getTables();

    this.tables = tables.map((row) => row.table);

    logService.info(`Discovered ${this.tables.length} tables`);
  }

  async loadModels() {
    const modelsToLoad = this.tables.filter((table) => !table.includes("_"));
    logService.log(`> Loading models...`);
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

  /*
    Many-to-Many relationships comes from tables named: singularModel _ pluralModel
    Model attributes comes from tables named: singularModel _ attribute
   */
  loadRelationshipsAndAttributes() {
    const nonModelTables = this.tables.filter((table) => table.includes("_"));

    logService.log(`> Loading attributes and relationships...`);
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
