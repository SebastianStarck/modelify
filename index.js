import express from "express";
import "dotenv/config";
import bodyParser from "body-parser";
import DatabaseExplorer from "./src/database-explorer.js";
import RouteGenerator from "./src/route-generator.js";

const app = express();
app.use(bodyParser.json());
const databaseExplorer = new DatabaseExplorer();
const routeGenerator = new RouteGenerator(app);
const port = process.env.PORT;

app.get("/kill", (req, res) => {
  process.exit(0);
});

app.listen(port, () => {
  // console.log(`Example app listening on port ${port}`);
});

databaseExplorer.explore().then((explorer) => {
  const models = explorer.models;

  for (const [modelName, model] of models) {
    routeGenerator.generate(model);
  }

  // process.exit(0);
});
