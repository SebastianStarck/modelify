import "dotenv/config";
import DatabaseExplorer from "./src/database-explorer.js";
import RouteGenerator from "./src/route-generator.js";
import logService from "./src/log-service.js";
import mysqlService from "./src/mysql-service.js";
import generateDocJSON from "./src/doc-generator.js";
import swaggerUi from "swagger-ui-express";

async function run(port, dbOptions, app) {
  const databaseExplorer = new DatabaseExplorer();
  const routeGenerator = new RouteGenerator(app);

  await mysqlService.setDbOptions(dbOptions);

  app.get("/kill", (req, res) => {
    process.exit(0);
  });

  app.listen(port, () => {});
  app.use(function (err, req, res, next) {
    res.status(500).send(err.message);
  });

  await databaseExplorer.explore();

  logService.log("\n> Generating REST API endpoints...");
  for (const [modelName, model] of databaseExplorer.models) {
    routeGenerator.generate(model);
  }
  logService.success("Generated REST API endpoints successfully");

  logService.log("\n> Generating REST API documentation...");
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(generateDocJSON(databaseExplorer.models))
  );
  logService.success(`REST API hosted at http://localhost:${3100}/api-docs/`);
}

export default { run };
