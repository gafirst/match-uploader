import pluginVue from "eslint-plugin-vue";
import vueTsEslintConfig from "@vue/eslint-config-typescript";

import globals from "globals";
import typescriptEslint from "typescript-eslint";

export default typescriptEslint.config([
  { ignores: ["**/*.d.ts", "**/coverage", "**/dist"] },
  ...pluginVue.configs["flat/essential"],
  ...pluginVue.configs["flat/strongly-recommended"],
  ...pluginVue.configs["flat/recommended"],
  ...vueTsEslintConfig({
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.browser,
      parserOptions: {
        parser: typescriptEslint.parser,
      },
    },
    // Optional: extend additional configurations from `typescript-eslint`.
    // Supports all the configurations in
    // https://typescript-eslint.io/users/configs#recommended-configurations
    extends: [
      // By default, only the recommended rules are enabled.
      "recommended",
      // You can also manually enable the stylistic rules.
      // "stylistic",

      // Other utility configurations, such as `eslintRecommended`, (note that it's in camelCase)
      // are also extendable here. But we don't recommend using them directly.
    ],

    // <https://github.com/vuejs/eslint-plugin-vue/issues/1910#issuecomment-1819993961>
    // Optional: the root directory to resolve the `.vue` files, defaults to `process.cwd()`.
    // You may need to set this to the root directory of your project if you have a monorepo.
    // This is useful when you allow any other languages than `ts` in `.vue` files.
    // Our config helper would resolve and parse all the `.vue` files under `rootDir`,
    // and only apply the loosened rules to the files that do need them.
    rootDir: import.meta.dirname,
  }),
  {
    rules: {
      "vue/multi-word-component-names": "off",
      "comma-dangle": ["error", "always-multiline"],
      "comma-style": ["error", "last"],
      "quotes": ["error", "double"],
      "semi": ["error", "always"],
      "max-len": [
        "error",
        {
          "code": 120,
        },
      ],
      "no-warning-comments": ["warn", {
        "terms": ["fixme"],
        "location": "anywhere",
      }],
    },
  },
]);
