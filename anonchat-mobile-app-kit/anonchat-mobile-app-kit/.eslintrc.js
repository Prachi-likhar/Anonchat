module.exports = {
  extends: ["expo"],
  env: {
    node: true,
    jest: true,
  },
  rules: {
    "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/array-type": ["warn", { "default": "array" }]
  }
};
