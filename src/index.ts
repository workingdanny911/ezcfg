export {
    type ConfigSpec,
    type InferSpecType,
    type InferConfigType,
    isConfigSpec,
} from "./config-spec.js";

export { ConfigValidationError } from "./errors.js";

export { defineConfig, parseEnvFile, type ConfigOptions } from "./define-config.js";
export { loadEnvFiles } from "./load-env-files.js";

export {
    EnvSpec,
    env,
    envOptional,
    envNumber,
    envNumberOptional,
    envBoolean,
    envJson,
    envJsonOptional,
} from "./env-spec.js";

export { ComputedSpec, computed } from "./computed-spec.js";

export type { DatabaseConfig } from "./database-config.js";
