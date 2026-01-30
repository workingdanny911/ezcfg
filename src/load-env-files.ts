import fs from "node:fs";
import path from "node:path";

import dotenv from "dotenv";

export function loadEnvFiles({
    basePath,
    nodeEnv,
}: {
    basePath?: string;
    nodeEnv?: string;
} = {}): void {
    const basePath_ = basePath ?? process.cwd();
    const nodeEnv_ = nodeEnv ?? process.env.NODE_ENV ?? "development";

    const envFiles = [
        ".env",
        ".env.local",
        `.env.${nodeEnv_}`,
        `.env.${nodeEnv_}.local`,
    ];

    const loadEnvFile = (filePath: string) => {
        if (fs.existsSync(filePath)) {
            dotenv.config({ path: filePath });
        }
    };

    envFiles.reverse().forEach((file) => {
        const filePath = path.resolve(basePath_, file);
        loadEnvFile(filePath);
    });
}
