import { type InferConfigType, isConfigSpec } from "./config-spec";
import { ConfigValidationError } from "./errors";
import { loadEnvFiles } from "./load-env-files";

export interface ConfigOptions {
    loadEnv?: boolean;
    envLoader?: () => void;
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

        if (options?.loadEnv) {
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
                config[key] = value.resolve(errors);
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
