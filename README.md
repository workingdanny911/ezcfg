# ezcfg

[![npm version](https://img.shields.io/npm/v/ezcfg.svg)](https://www.npmjs.com/package/ezcfg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Lite and easy configuration management for Node.js with full TypeScript support.

## Features

- **Type-safe configuration** - Full TypeScript support with automatic type inference
- **Automatic .env file loading** - Loads environment files based on `NODE_ENV`
- **Validation with clear error messages** - Collects all validation errors at once
- **Zero runtime dependencies** - Only uses `dotenv` for .env file parsing
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
import { defineConfig, env, envNumber, envBoolean, envOptional } from 'ezcfg';

export const getConfig = defineConfig({
  // Required string
  apiKey: env('API_KEY'),

  // Required number
  port: envNumber('PORT'),

  // Optional with default
  debug: envBoolean('DEBUG', false),

  // Optional string
  logLevel: envOptional('LOG_LEVEL', 'info'),
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

**Behavior:**

- Returns a factory function that lazily evaluates and caches the config
- In test environment (`NODE_ENV=test`), config is re-evaluated on each call
- Throws `ConfigValidationError` if any required values are missing

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

### `loadEnvFiles(options?)`

Manually loads .env files. Usually not needed if using `{ loadEnv: true }` with `defineConfig`.

```typescript
import { loadEnvFiles } from 'ezcfg';

loadEnvFiles({
  basePath: '/path/to/project',  // Defaults to process.cwd()
  nodeEnv: 'production',         // Defaults to process.env.NODE_ENV or 'development'
});
```

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
import { defineConfig, env, ConfigValidationError } from 'ezcfg';

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
import { defineConfig, env, envNumber, envOptional, envBoolean } from 'ezcfg';

const getConfig = defineConfig({
  apiKey: env('API_KEY'),
  port: envNumber('PORT'),
  debug: envBoolean('DEBUG'),
  optional: envOptional('OPTIONAL'),
});

const config = getConfig();

// TypeScript infers:
// {
//   readonly apiKey: string;
//   readonly port: number;
//   readonly debug: boolean;
//   readonly optional: string | undefined;
// }
```

### `InferConfigType<S>`

You can also extract the config type for use elsewhere:

```typescript
import { defineConfig, env, type InferConfigType } from 'ezcfg';

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

## Examples

### Database Configuration

```typescript
import { defineConfig, env, envNumber, envOptional } from 'ezcfg';

export const getDbConfig = defineConfig({
  host: env('DB_HOST'),
  port: envNumber('DB_PORT'),
  database: env('DB_NAME'),
  user: env('DB_USER'),
  password: envOptional('DB_PASSWORD'),
}, { loadEnv: true });

// Usage
const db = getDbConfig();
const connectionString = `postgres://${db.user}:${db.password}@${db.host}:${db.port}/${db.database}`;
```

### API Service Configuration

```typescript
import { defineConfig, env, envNumber, envBoolean, envJsonOptional } from 'ezcfg';

export const getConfig = defineConfig({
  // Server
  port: envNumber('PORT'),
  host: envOptional('HOST', '0.0.0.0'),

  // API Keys
  apiKey: env('API_KEY'),
  secretKey: env('SECRET_KEY'),

  // Features
  debug: envBoolean('DEBUG', false),
  enableMetrics: envBoolean('ENABLE_METRICS', true),

  // CORS
  allowedOrigins: envJsonOptional<string[]>('ALLOWED_ORIGINS', ['http://localhost:3000']),
}, { loadEnv: true });
```

### Multi-environment Setup

```
project/
├── .env                 # Shared defaults
├── .env.local           # Local secrets (gitignored)
├── .env.development     # Development settings
├── .env.production      # Production settings
└── .env.test            # Test settings
```

```bash
# .env
LOG_LEVEL=info
API_TIMEOUT=5000

# .env.development
DEBUG=true
API_URL=http://localhost:3000

# .env.production
DEBUG=false
API_URL=https://api.example.com

# .env.local (gitignored)
API_KEY=your-secret-key
```

## License

[MIT](LICENSE)
