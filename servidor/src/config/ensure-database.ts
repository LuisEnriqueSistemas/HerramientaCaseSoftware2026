import { Client } from 'pg';

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export async function ensureDatabaseExists(
  config: DatabaseConfig,
): Promise<void> {
  const adminClient = new Client({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: 'postgres',
  });

  await adminClient.connect();
  try {
    const result = await adminClient.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [config.database],
    );
    if (result.rowCount === 0) {
      await adminClient.query(`CREATE DATABASE "${config.database}"`);
    }
  } finally {
    await adminClient.end();
  }
}
