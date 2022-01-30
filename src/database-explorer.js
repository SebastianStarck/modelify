import mysqlService from "./mysql-service.js";
import logService from "./log-service.js";

export default class DatabaseExplorer {
  tables = [];
  models = [];

  async explore() {
    logService.log("Scouting database...");
    await this.getTables();
    await this.getModels();
  }

  async getTables() {
    const queryResponse = await mysqlService.runQuery(
      "SELECT table_name as 'table' FROM information_schema.tables where table_schema='modelify';"
    );

    this.tables = queryResponse.map((row) => row.table);

    logService.info(`Discovered ${this.tables.length} tables`);
  }

  getModels() {
    this.models = this.tables.filter((table) => !table.includes("_"));

    logService.info(`Discovered ${this.models.length} models`);
  }
}
