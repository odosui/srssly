import { Pool } from "pg";

import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  host: process.env["DB_HOST"],
  port: parseInt(process.env["DB_PORT"] || "5432", 10),
  database: process.env["DB_NAME"],
  user: process.env["DB_USERNAME"],
  password: process.env["DB_PASSWORD"],
});

(async () => {
  // check connection
  const client = await pool.connect();
  client.release();
  console.log("Database connected");
})();

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

export default pool;
