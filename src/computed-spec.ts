import type { ConfigSpec } from "./config-spec.js";

export class ComputedSpec<T> implements ConfigSpec<T> {
    readonly _type = "computed";

    constructor(private readonly factory: () => T) {}

    resolve(errors: string[], _envSource?: Record<string, string>): T | undefined {
        try {
            return this.factory();
        } catch (e) {
            errors.push(`Computed value failed: ${(e as Error).message}`);
            return undefined;
        }
    }
}

export function computed<T>(factory: () => T): ComputedSpec<T> {
    return new ComputedSpec(factory);
}
