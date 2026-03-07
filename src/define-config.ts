import fs from "node:fs";

import dotenv from "dotenv";

import { type InferConfigType, isConfigSpec } from "./config-spec.js";
import { ConfigValidationError } from "./errors.js";
import { loadEnvFiles } from "./load-env-files.js";

export interface ConfigOptions {
    loadEnv?: boolean;
    envLoader?: () => void;
    fromEnvFile?: string;
}

export function defineConfig<S extends Record<string, unknown>>(
    schema: S,
    options?: ConfigOptions
): () => InferConfigType<S> {
    let instance: InferConfigType<S> | null = null;

    return () => {
        if (instance && process.env.NODE_ENV !== "test") {
            return instance;
        }

        let envSource: Record<string, string> | undefined;

        if (options?.fromEnvFile) {
            envSource = parseEnvFile(options.fromEnvFile);
        } else if (options?.loadEnv) {
            if (options.envLoader) {
                options.envLoader();
            } else {
                loadEnvFiles();
            }
        }

        const config = {} as Record<string, unknown>;
        const errors: string[] = [];

        for (const [key, value] of Object.entries(schema)) {
            if (isConfigSpec(value)) {
                config[key] = value.resolve(errors, envSource);
            } else {
                config[key] = value;
            }
        }

        if (errors.length > 0) {
            throw new ConfigValidationError(errors);
        }

        instance = config as InferConfigType<S>;
        return instance;
    };
}

export function parseEnvFile(filePath: string): Record<string, string> {
    const content = fs.readFileSync(filePath, "utf-8");
    return dotenv.parse(content);
}
