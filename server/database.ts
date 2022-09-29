import * as mysql from "mysql";
export var pool: mysql.Pool = mysql.createPool(process.env.DATABASE_URL);
