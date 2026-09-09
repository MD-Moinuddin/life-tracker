// frontend/ and backend/ each have their own ESLint/Prettier install, so
// each command below calls that app's local binary directly rather than
// `cd`-ing in (which needs a shell and broke on quoting previously).
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
