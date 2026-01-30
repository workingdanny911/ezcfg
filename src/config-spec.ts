export interface ConfigSpec<T> {
    readonly _type: string;
    resolve(errors: string[]): T | undefined;
}

export type InferSpecType<S> = S extends ConfigSpec<infer T> ? T : S;

export type InferConfigType<S extends Record<string, unknown>> = {
    readonly [K in keyof S]: InferSpecType<S[K]>;
};

export function isConfigSpec(value: unknown): value is ConfigSpec<unknown> {
    return (
        typeof value === "object" &&
        value !== null &&
        "resolve" in value &&
        typeof (value as ConfigSpec<unknown>).resolve === "function"
    );
}
