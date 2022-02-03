import mysql from "mysql2/promise";
import logService from "./log-service.js";
import "dotenv/config";

let dbConfig = {
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
};

function getConnection() {
  return mysql.createConnection(dbConfig);
}

async function runQuery(query, params = null) {
  const connection = await getConnection();

  try {
    const [rows, fields] = await connection.execute(query, params);
    return rows;
  } catch (err) {
    logService.error(err.message);
    throw err;
  }
}

async function setDbOptions(options) {
  const missingOptions = ["host", "database", "user"].filter(
    (option) => !Object.keys(options).includes(option)
  );

  if (missingOptions.length > 0) {
    logService.error(
      `Missing database configuration options: ${missingOptions.join(", ")}`
    );
    process.exit(0);
  }

  dbConfig = options;

  logService.log("Testing database connection...");
  await getTables();
  logService.success("Connected to the database successfully");
}

async function getTables() {
  try {
    return await runQuery(
      `SELECT table_name as 'table' FROM information_schema.tables where table_schema='${dbConfig.database}';`
    );
  } catch (err) {
    logService.error(err.message);
    logService.log(
      "Application failed to retrieve tables from database. Exiting now..."
    );
    process.exit(0);
  }
}

export default { runQuery, setDbOptions, getTables };
