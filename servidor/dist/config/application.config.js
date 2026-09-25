"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApplicationConfig = getApplicationConfig;
exports.getDatabaseConfig = getDatabaseConfig;
const DEFAULT_SERVER_PORT = 5000;
const DEFAULT_CLIENT_URL = 'http://localhost:4000';
function parsePort(value, variableName) {
    const port = Number(value ?? DEFAULT_SERVER_PORT);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error(`${variableName} debe ser un puerto válido entre 1 y 65535`);
    }
    return port;
}
function parseUrl(value, variableName) {
    const url = value ?? DEFAULT_CLIENT_URL;
    try {
        new URL(url);
    }
    catch {
        throw new Error(`${variableName} debe ser una URL válida`);
    }
    return url;
}
function getApplicationConfig() {
    const clientUrl = process.env.CLIENT_URL;
    if (process.env.NODE_ENV === 'production' && !clientUrl) {
        throw new Error('CLIENT_URL es obligatoria en producción');
    }
    return {
        port: parsePort(process.env.PORT, 'PORT'),
        clientUrl: parseUrl(clientUrl, 'CLIENT_URL'),
    };
}
function getDatabaseConfig() {
    return {
        host: process.env.DB_HOST ?? 'localhost',
        port: parsePort(process.env.DB_PORT ?? '5432', 'DB_PORT'),
        user: process.env.DB_USER ?? 'postgres',
        password: process.env.DB_PASSWORD ?? 'postgres',
        database: process.env.DB_NAME ?? 'herramienta_case',
    };
}
//# sourceMappingURL=application.config.js.map