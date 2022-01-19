import * as mysql from "mysql";
export var pool: mysql.Pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT as number | undefined,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    timeout: 60000,
});
