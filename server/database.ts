import * as mysql from "mysql2";
export var pool: mysql.Pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
});
