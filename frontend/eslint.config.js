// TODO(deps): eslint and @eslint/js are pinned to ^9, one major behind current (10).
// eslint-plugin-jsx-a11y@6.10.2 declares a peer dependency on eslint ^3..^9 and has
// not added ESLint 10 support yet. Bump this pin once that changes - check with:
//   npm info eslint-plugin-jsx-a11y peerDependencies
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    plugins: {
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
    },
  },
  // Must stay last: turns off any ESLint formatting rule that would
  // otherwise conflict with Prettier's own formatting.
  eslintConfigPrettier,
);
