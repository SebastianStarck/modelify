import express from "express";
import "dotenv/config";
import DatabaseExplorer from "./src/database-explorer.js";

const app = express();
const databaseExplorer = new DatabaseExplorer();
const port = process.env.PORT;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

try {
  getTables();
} catch (err) {
  process.exit(0);
}

async function getTables() {
  await databaseExplorer.explore();
  process.exit(0);
}
