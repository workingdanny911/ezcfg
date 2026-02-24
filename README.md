# ezcfg

[![npm version](https://img.shields.io/npm/v/ezcfg.svg)](https://www.npmjs.com/package/ezcfg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Lite and easy configuration management for Node.js with full TypeScript support.

## Features

- **Type-safe configuration** - Full TypeScript support with automatic type inference
- **Automatic .env file loading** - Loads environment files based on `NODE_ENV`
- **Direct .env file parsing** - Read from a specific `.env` file without modifying `process.env`
- **Validation with clear error messages** - Collects all validation errors at once
- **PostgreSQL config support** - Built-in `postgresConfig` spec via `ezcfg/postgres`
- **Extensible** - Implement `ConfigSpec` to add custom config types
- **Singleton pattern** - Config is lazily evaluated and cached (except in test environment)

## Installation

```bash
# npm
npm install ezcfg

# pnpm
pnpm add ezcfg

# yarn
yarn add ezcfg
```

## Quick Start

### Step 1: Define your configuration schema

```typescript
// config.ts
import path from 'node:path';
import { defineConfig, env, envNumber, envBoolean, envOptional, computed } from 'ezcfg';

export const getConfig = defineConfig({
  // Required string
  apiKey: env('API_KEY'),

  // Required number
  port: envNumber('PORT'),

  // Optional with default
  debug: envBoolean('DEBUG', false),

  // Optional string
  logLevel: envOptional('LOG_LEVEL', 'info'),

  // Computed at runtime
  projectRoot: computed(() => process.cwd()),
  promptsDir: computed(() => path.resolve(import.meta.dirname, './prompts')),
}, { loadEnv: true });
```

### Step 2: Use your config

```typescript
// app.ts
import { getConfig } from './config';

const config = getConfig();

console.log(config.port);     // number
console.log(config.apiKey);   // string
console.log(config.debug);    // boolean
console.log(config.logLevel); // string | undefined
```

That's it! TypeScript will infer all types automatically.

## API Reference

### `defineConfig(schema, options?)`

Creates a configuration factory function that validates and returns your config.

```typescript
import { defineConfig } from 'ezcfg';

const getConfig = defineConfig(schema, options);
const config = getConfig(); // Lazily evaluated and cached
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `schema` | `Record<string, unknown>` | Object defining your configuration shape |
| `options.loadEnv` | `boolean` | Whether to load .env files automatically (default: `false`) |
| `options.envLoader` | `() => void` | Custom function to load environment variables |
| `options.fromEnvFile` | `string` | Path to a `.env` file to parse directly (does not modify `process.env`) |

**Behavior:**

- Returns a factory function that lazily evaluates and caches the config
- In test environment (`NODE_ENV=test`), config is re-evaluated on each call
- Throws `ConfigValidationError` if any required values are missing
- When `fromEnvFile` is set, the file is parsed into a local object and passed to each spec's `resolve()` — `process.env` is never modified

---

### `parseEnvFile(filePath)`

Parses a `.env` file and returns its contents as a `Record<string, string>`. Does not modify `process.env`.

```typescript
import { parseEnvFile } from 'ezcfg';

const env = parseEnvFile('/path/to/.env');
// { DATABASE_URL: 'postgres://...', API_KEY: 'secret' }
```

Useful for injecting env vars into test runners:

```typescript
// vitest.config.ts
import { parseEnvFile } from 'ezcfg';

export default defineConfig({
  test: {
    env: parseEnvFile(resolve(__dirname, '.env')),
  },
});
```

---

### Environment Variable Helpers

#### `env(key)`

Reads a **required** string environment variable.

```typescript
env('API_KEY')  // Returns EnvSpec<string>
```

Throws an error if the environment variable is not set.

---

#### `envOptional(key, defaultValue?)`

Reads an **optional** string environment variable.

```typescript
envOptional('LOG_LEVEL')           // Returns EnvSpec<string | undefined>
envOptional('LOG_LEVEL', 'info')   // Returns EnvSpec<string | undefined>
```

Returns `undefined` if not set and no default is provided.

---

#### `envNumber(key)`

Reads a **required** environment variable and parses it as a number.

```typescript
envNumber('PORT')  // Returns EnvSpec<number>
```

Throws an error if the environment variable is not set.

---

#### `envNumberOptional(key, defaultValue?)`

Reads an **optional** environment variable and parses it as a number.

```typescript
envNumberOptional('TIMEOUT')        // Returns EnvSpec<number | undefined>
envNumberOptional('TIMEOUT', 5000)  // Returns EnvSpec<number | undefined>
```

---

#### `envBoolean(key, defaultValue?)`

Reads an environment variable and parses it as a boolean.

```typescript
envBoolean('DEBUG')        // Returns EnvSpec<boolean>, defaults to false
envBoolean('DEBUG', true)  // Returns EnvSpec<boolean>, defaults to true
```

**Truthy values:** `"true"`, `"1"`
**Falsy values:** Everything else (including `"false"`, `"0"`, empty string)

---

#### `envJson<T>(key)`

Reads a **required** environment variable and parses it as JSON.

```typescript
envJson<{ host: string; port: number }>('DB_CONFIG')  // Returns EnvSpec<T>
```

Throws an error if the environment variable is not set or contains invalid JSON.

---

#### `envJsonOptional<T>(key, defaultValue?)`

Reads an **optional** environment variable and parses it as JSON.

```typescript
envJsonOptional<string[]>('ALLOWED_ORIGINS')                  // Returns EnvSpec<T | undefined>
envJsonOptional<string[]>('ALLOWED_ORIGINS', ['localhost'])   // Returns EnvSpec<T | undefined>
```

---

### `computed(factory)`

Creates a **computed config value** that is lazily evaluated at resolve time. Use this for runtime values like paths, timestamps, or any value derived from a function call.

```typescript
import path from 'node:path';
import { computed } from 'ezcfg';

computed(() => process.cwd())                                    // ComputedSpec<string>
computed(() => path.resolve(import.meta.dirname, './prompts'))   // ComputedSpec<string>
computed(() => Date.now())                                       // ComputedSpec<number>
```

If the factory throws, the error is collected alongside other validation errors in `ConfigValidationError`.

---

### `loadEnvFiles(options?)`

Manually loads .env files. Usually not needed if using `{ loadEnv: true }` with `defineConfig`.

```typescript
import { loadEnvFiles } from 'ezcfg';

loadEnvFiles({
  basePath: '/path/to/project',  // Defaults to process.cwd()
  nodeEnv: 'production',         // Defaults to process.env.NODE_ENV or 'development'
});
```

---

## `ezcfg/postgres`

PostgreSQL configuration support, available as a subpath import.

```typescript
import { postgresConfig, PostgresConfig } from 'ezcfg/postgres';
```

### `postgresConfig(prefix, mode?)`

A `ConfigSpec` implementation for PostgreSQL database configuration. Use with `defineConfig`.

```typescript
import { defineConfig } from 'ezcfg';
import { postgresConfig } from 'ezcfg/postgres';

const getConfig = defineConfig({
  db: postgresConfig('ORDER_DB'),           // reads ORDER_DB_URL
  db2: postgresConfig('PG', 'fields'),      // reads PG_HOST, PG_PORT, etc.
});

getConfig().db.host;        // "localhost"
getConfig().db.toString();  // "postgres://..."
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `prefix` | `string` | — | Environment variable prefix |
| `mode` | `"url" \| "fields"` | `"url"` | `"url"` reads `{PREFIX}_URL`, `"fields"` reads individual fields |

**Fields mode** reads: `{PREFIX}_HOST`, `{PREFIX}_PORT`, `{PREFIX}_DATABASE`, `{PREFIX}_USER`, `{PREFIX}_PASSWORD`

### `PostgresConfig`

Immutable value object representing a PostgreSQL connection configuration.

```typescript
import { PostgresConfig } from 'ezcfg/postgres';

// From URL
const config = PostgresConfig.fromUrl('postgres://user:pass@localhost:5432/mydb');

// From environment variables
const config = PostgresConfig.fromEnv('DATABASE');       // reads DATABASE_URL
const config = PostgresConfig.fromEnv('PG', { mode: 'fields' });

// Builder methods (each returns a new instance)
config.withDatabase('other_db');
config.withHost('remote-host');
config.withPort(5433);
config.withUser('admin');
config.withPassword('secret');
config.withPoolSize(10);
config.withConnectionTimeout(5000);
config.withIdleTimeout(30000);

// Connection string
config.toString();  // "postgres://user:pass@localhost:5432/mydb"
```

### Using with `fromEnvFile`

`postgresConfig` works with `fromEnvFile` — the `.env` file is parsed locally without modifying `process.env`:

```typescript
import { defineConfig } from 'ezcfg';
import { postgresConfig } from 'ezcfg/postgres';

const getConfig = defineConfig(
  { db: postgresConfig('DATABASE') },
  { fromEnvFile: resolve(__dirname, '.env') }
);

// .env contains: DATABASE_URL=postgres://user@localhost/mydb
const config = getConfig();
config.db.database;  // "mydb"
```

---

## .env File Loading

When `loadEnv: true` is set, ezcfg automatically loads environment files in the following order (later files override earlier ones):

1. `.env` - Base environment variables
2. `.env.local` - Local overrides (gitignored)
3. `.env.{NODE_ENV}` - Environment-specific (e.g., `.env.production`)
4. `.env.{NODE_ENV}.local` - Environment-specific local overrides (gitignored)

**Example for `NODE_ENV=production`:**

```
.env                    → loaded first (lowest priority)
.env.local              → loaded second
.env.production         → loaded third
.env.production.local   → loaded last (highest priority)
```

## Error Handling

### `ConfigValidationError`

When validation fails, ezcfg throws a `ConfigValidationError` with all errors collected:

```typescript
import { defineConfig, env, envNumber, ConfigValidationError } from 'ezcfg';

const getConfig = defineConfig({
  apiKey: env('API_KEY'),
  dbHost: env('DB_HOST'),
  dbPort: envNumber('DB_PORT'),
});

try {
  getConfig();
} catch (error) {
  if (error instanceof ConfigValidationError) {
    console.log(error.message);
    // Config validation failed:
    //   - Missing required env: API_KEY
    //   - Missing required env: DB_HOST
    //   - Missing required env: DB_PORT

    console.log(error.errors);
    // ['Missing required env: API_KEY', 'Missing required env: DB_HOST', 'Missing required env: DB_PORT']
  }
}
```

## TypeScript Support

ezcfg provides full type inference out of the box:

```typescript
import { defineConfig, env, envNumber, envOptional, envBoolean, computed } from 'ezcfg';

const getConfig = defineConfig({
  apiKey: env('API_KEY'),
  port: envNumber('PORT'),
  debug: envBoolean('DEBUG'),
  optional: envOptional('OPTIONAL'),
  projectRoot: computed(() => process.cwd()),
});

const config = getConfig();

// TypeScript infers:
// {
//   readonly apiKey: string;
//   readonly port: number;
//   readonly debug: boolean;
//   readonly optional: string | undefined;
//   readonly projectRoot: string;
// }
```

### `InferConfigType<S>`

You can also extract the config type for use elsewhere:

```typescript
import { defineConfig, env, envNumber, type InferConfigType } from 'ezcfg';

const schema = {
  apiKey: env('API_KEY'),
  port: envNumber('PORT'),
};

const getConfig = defineConfig(schema);

// Extract the type
type AppConfig = InferConfigType<typeof schema>;

// Use the type
function initializeApp(config: AppConfig) {
  // ...
}
```

## Custom ConfigSpec

Implement the `ConfigSpec` interface to create your own config types:

```typescript
import type { ConfigSpec } from 'ezcfg';

class RedisConfigSpec implements ConfigSpec<RedisConfig> {
  readonly _type = 'redis';

  constructor(private readonly prefix: string) {}

  resolve(errors: string[], envSource?: Record<string, string>): RedisConfig | undefined {
    const source = envSource ?? process.env;
    const url = source[`${this.prefix}_URL`];

    if (!url) {
      errors.push(`Missing ${this.prefix}_URL`);
      return undefined;
    }

    return new RedisConfig(url);
  }
}
```

## License

[MIT](LICENSE)
