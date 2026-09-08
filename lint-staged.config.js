// lint-staged runs from the repo root, but frontend/ and backend/ each have
// their own separate ESLint and Prettier install and config file. Rather than
// `cd`-ing into each app (which needs a shell and chained `&&`, and got tangled
// in fragile quoting), each command below calls that app's own local binary
// directly by path, with an explicit --config flag, and passes the staged file
// paths unchanged (they're already relative to the repo root, which is also
// lint-staged's own working directory).
function runInApp(appDir) {
  return (filenames) => {
    const files = filenames.map((f) => `"${f}"`).join(" ");
    return [
      `${appDir}/node_modules/.bin/eslint --fix --config ${appDir}/eslint.config.js ${files}`,
      `${appDir}/node_modules/.bin/prettier --write --ignore-path .prettierignore ${files}`,
    ];
  };
}

module.exports = {
  "frontend/**/*.{ts,tsx}": runInApp("frontend"),
  "backend/**/*.ts": runInApp("backend"),
};
