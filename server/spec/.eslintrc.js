module.exports = {
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "project": "../tsconfig.json",
    "tsconfigRootDir": __dirname,
  },
  "plugins": [
    "@typescript-eslint"
  ],
  "extends": [
    "../.eslintrc.json"
  ],
  "env": {
    "jest": true,
    "jasmine": true
  },
  "rules": {
    "no-console": "off"
  },
  "overrides": [
    {
      "files": ["**/*.spec.ts"]
    }
  ]
}
