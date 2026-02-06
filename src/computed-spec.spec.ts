import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { computed } from "./computed-spec";
import { defineConfig } from "./define-config";
import { env } from "./env-spec";
import { ConfigValidationError } from "./errors";

describe("ComputedSpec", () => {
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = { ...originalEnv, NODE_ENV: "test" };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe("computed()", () => {
        it("should resolve factory return value", () => {
            const getConfig = defineConfig({
                projectRoot: computed(() => "/usr/local/app"),
            });

            expect(getConfig().projectRoot).toBe("/usr/local/app");
        });

        it("should collect factory errors in ConfigValidationError", () => {
            const getConfig = defineConfig({
                broken: computed(() => {
                    throw new Error("factory exploded");
                }),
            });

            expect(() => getConfig()).toThrow(ConfigValidationError);
            expect(() => getConfig()).toThrow("Computed value failed: factory exploded");
        });

        it("should work alongside env() and plain values", () => {
            process.env.API_KEY = "secret";

            const getConfig = defineConfig({
                apiKey: env("API_KEY"),
                appName: "my-app",
                projectRoot: computed(() => "/computed/path"),
            });

            const config = getConfig();
            expect(config.apiKey).toBe("secret");
            expect(config.appName).toBe("my-app");
            expect(config.projectRoot).toBe("/computed/path");
        });

        it("should infer correct return type", () => {
            const getConfig = defineConfig({
                count: computed(() => 42),
                flag: computed(() => true),
                path: computed(() => "/some/path"),
            });

            const config = getConfig();
            const _count: number = config.count;
            const _flag: boolean = config.flag;
            const _path: string = config.path;

            expect(_count).toBe(42);
            expect(_flag).toBe(true);
            expect(_path).toBe("/some/path");
        });
    });
});
