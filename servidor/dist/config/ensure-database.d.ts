export interface DatabaseConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
}
export declare function ensureDatabaseExists(config: DatabaseConfig): Promise<void>;
