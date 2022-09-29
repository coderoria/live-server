import * as mysql from "mysql";
export var pool: mysql.Pool = mysql.createPool(
  <string>process.env.DATABASE_URL
);
