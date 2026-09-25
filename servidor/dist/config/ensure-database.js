"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureDatabaseExists = ensureDatabaseExists;
const pg_1 = require("pg");
async function ensureDatabaseExists(config) {
    const adminClient = new pg_1.Client({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: 'postgres',
    });
    await adminClient.connect();
    try {
        const result = await adminClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [config.database]);
        if (result.rowCount === 0) {
            await adminClient.query(`CREATE DATABASE "${config.database}"`);
        }
    }
    finally {
        await adminClient.end();
    }
}
//# sourceMappingURL=ensure-database.js.map