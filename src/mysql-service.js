import mysql from "mysql2/promise";
import "dotenv/config";

function getConnection() {
  return mysql.createConnection({
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });
}

async function runQuery(query, params = null) {
  const connection = await getConnection();

  try {
    const [rows, fields] = await connection.execute(query, params);
    return rows;
  } catch (err) {
    console.log(err);
    process.exit(0);
  }
}

export default { getConnection, runQuery };
