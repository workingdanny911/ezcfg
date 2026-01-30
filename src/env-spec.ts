import type { ConfigSpec } from "./config-spec";

export class EnvSpec<T> implements ConfigSpec<T> {
    readonly _type = "env";

    constructor(
        private readonly envKey: string,
        private readonly required: boolean,
        private readonly defaultValue?: T,
        private readonly transform?: (value: string) => T
    ) {}

    resolve(errors: string[]): T | undefined {
        const rawValue = process.env[this.envKey];

        if (!rawValue && this.required) {
            errors.push(`Missing required env: ${this.envKey}`);
            return undefined;
        }

        if (rawValue !== undefined) {
            try {
                return this.transform ? this.transform(rawValue) : (rawValue as T);
            } catch (e) {
                errors.push(`Failed to transform ${this.envKey}: ${(e as Error).message}`);
                return undefined;
            }
        }

        return this.defaultValue;
    }
}

export function env(key: string): EnvSpec<string> {
    return new EnvSpec(key, true);
}

export function envOptional(key: string, defaultValue?: string): EnvSpec<string | undefined> {
    return new EnvSpec(key, false, defaultValue);
}

export function envNumber(key: string): EnvSpec<number> {
    return new EnvSpec(key, true, undefined, Number);
}

export function envNumberOptional(key: string, defaultValue?: number): EnvSpec<number | undefined> {
    return new EnvSpec(key, false, defaultValue, (v) => (v ? Number(v) : undefined));
}

export function envBoolean(key: string, defaultValue = false): EnvSpec<boolean> {
    return new EnvSpec(key, false, defaultValue, (v) => v === "true" || v === "1");
}

export function envJson<T>(key: string): EnvSpec<T> {
    return new EnvSpec(key, true, undefined, JSON.parse);
}

export function envJsonOptional<T>(key: string, defaultValue?: T): EnvSpec<T | undefined> {
    return new EnvSpec(key, false, defaultValue, (v) => (v ? JSON.parse(v) : undefined));
}
