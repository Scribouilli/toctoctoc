module.exports =  {
  plugins: [
    "jsdoc"
  ],
  extends:  [
    "eslint:recommended",
  ],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module",
  },
  globals: {
    "process": "readonly",
    "require": "readonly",
    "module": "readonly",
    "console": "readonly",
  },
};
