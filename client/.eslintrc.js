module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    "plugin:vue/vue3-essential",
    "plugin:vue/essential",
    "plugin:vue/vue3-strongly-recommended",
    "plugin:vue/strongly-recommended",
    "plugin:vue/vue3-recommended",
    "plugin:vue/recommended",
    "eslint:recommended",
    "@vue/eslint-config-typescript",
    "../.eslint/.eslintrc.js",
  ],
  rules: {
    "comma-dangle": ["error", "always-multiline"],
    "comma-style": ["error", "last"],
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "quotes": ["error", "double"],
    "vue/component-name-in-template-casing": ["error", "PascalCase"],
    "vue/first-attribute-linebreak": ["error", {
      multiline: "beside",
    }],
    "vue/html-self-closing": ["error", {
      "html": {
        "void": "always",
      },
    }],
    "vue/max-len": "off",
    "vue/max-attributes-per-line": ["error", {
      singleline: 2,
    }],
    "vue/multi-word-component-names": "off",
    "vue/no-multiple-template-root": "off",
    "vue/singleline-html-element-content-newline": "off",
    "vue/v-slot-style": "off",
    "vue/valid-v-slot": "off",
  },
};
