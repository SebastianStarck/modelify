import "dotenv/config";
import DatabaseExplorer from "./src/database-explorer.js";
import RouteGenerator from "./src/route-generator.js";
import logService from "./src/log-service.js";
import mysqlService from "./src/mysql-service.js";

async function run(dbOptions, app) {
  const databaseExplorer = new DatabaseExplorer();
  const routeGenerator = new RouteGenerator(app);
  const port = process.env.PORT;

  await mysqlService.setDbOptions(dbOptions);

  app.get("/kill", (req, res) => {
    process.exit(0);
  });

  app.listen(port, () => {});
  app.use(function (err, req, res, next) {
    res.status(500).send(err.message);
  });

  databaseExplorer.explore().then((explorer) => {
    const models = explorer.models;

    logService.log("> Creating routes...");
    for (const [modelName, model] of models) {
      routeGenerator.generate(model);
    }
  });
}

export default { run };
