export interface DatabaseConfig {
    readonly host: string;
    readonly port: number;
    readonly database: string;
    readonly user: string;
    readonly password?: string;
    toString(): string;
}
