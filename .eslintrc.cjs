module.exports =  {
  plugins: [
    "@typescript-eslint/eslint-plugin",
    "eslint-plugin-tsdoc"
  ],
  extends:  [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  parser:  '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module",
  },
  rules: {
    "tsdoc/syntax": "warn",
  },
  globals: {
    "process": "readonly",
    "require": "readonly",
    "module": "readonly",
    "console": "readonly",
  },
};
