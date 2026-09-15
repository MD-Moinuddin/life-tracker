// TODO(deps): eslint and @eslint/js are pinned to ^9, matching the frontend's
// config. That pin exists because eslint-plugin-jsx-a11y@6.10.2 (a frontend-only
// dependency) does not yet support ESLint 10 - see frontend/eslint.config.js.
// Bump both once jsx-a11y's peer range covers ^10.
const js = require("@eslint/js");
const tseslint = require("typescript-eslint");
const eslintConfigPrettier = require("eslint-config-prettier");

module.exports = tseslint.config(
  { ignores: ["dist"] },
  {
    files: ["**/*.ts"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    rules: {
      // Express error-handling middleware needs a fixed 4-parameter shape
      // even when a param (like `next`) goes unused — underscore-prefixing
      // is the standard way to mark that as intentional.
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  // Must stay last: turns off any ESLint formatting rule that would
  // otherwise conflict with Prettier's own formatting.
  eslintConfigPrettier,
);
