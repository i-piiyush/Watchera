import js from "@eslint/js";
import unusedImports from "eslint-plugin-unused-imports";

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  // 🔕 Ignore build & generated files
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "dist/**",
      "build/**",
    ],
  },

  // Base JS rules
  js.configs.recommended,

  // Project language settings
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        React: "readonly",
      },
    },
  },

  // Unused imports enforcement
  {
    plugins: {
      "unused-imports": unusedImports,
    },
    rules: {
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          args: "after-used",
          varsIgnorePattern: "^_",
          argsIgnorePattern: "^_",
        },
      ],
    },
  },
];
