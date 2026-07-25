// Flat config, loaded natively.
//
// This previously bridged eslint-config-next through FlatCompat, the legacy
// eslintrc adapter. eslint-config-next 16 already ships a flat config and
// requires ESLint 9, so routing it through the adapter produced a schema
// mismatch, and the adapter then crashed while formatting its own error message
// because eslint-plugin-react's config object is self-referential. The visible
// symptom was "Converting circular structure to JSON" on every build, which
// masked the real error underneath. Import the configs directly and both go away.
//
// The rules below came from .eslintrc.json, which ESLint 9 was silently
// ignoring: once eslint.config.mjs exists, flat config wins and the legacy file
// is never read. Every rule in it had been inert.
//
// Deliberately NOT carried over:
//   - quotes, semi, brace-style, comma-dangle, no-trailing-spaces,
//     no-multiple-empty-lines. Prettier owns formatting here, and it formats to
//     double quotes, so these would have fought it on every file.
//   - @typescript-eslint/no-floating-promises and await-thenable. Both need
//     type-aware linting, which needs a parser project and is a separate,
//     slower setup. Worth adding deliberately rather than smuggling in here.

import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "public/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "*.config.js",
      "*.config.mjs",
      "*.config.ts",
      "scripts/**",
    ],
  },

  ...nextCoreWebVitals,
  ...nextTypeScript,

  {
    rules: {
      // Correctness
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-non-null-assertion": "error",

      // Security
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-script-url": "error",

      // Practices
      "no-console": ["error", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      "no-alert": "error",
      "no-var": "error",
      "prefer-const": "error",
      "no-throw-literal": "error",
      "no-useless-catch": "error",
      "no-param-reassign": "error",
      eqeqeq: ["error", "always"],
      "prefer-template": "warn",
      "no-nested-ternary": "warn",
      "max-depth": ["warn", 4],
      complexity: ["warn", 10],
    },
  },

  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off",
    },
  },

  {
    files: ["src/lib/env.ts"],
    rules: { "no-console": "off" },
  },
];

export default eslintConfig;
