import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import jasmine from 'eslint-plugin-jasmine';
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import globals from 'globals';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [{
    ignores: ["**/.eslintrc.*", "src/public/"],
}, ...compat.extends(
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
), jasmine.configs.recommended, {
    plugins: {
        "@typescript-eslint": typescriptEslint,
        jasmine,
    },

    languageOptions: {
        parser: tsParser,
        ecmaVersion: 5,
        sourceType: "script",
        globals: {
            ...globals.jasmine,
        },

        parserOptions: {
            project: "./tsconfig.json",
        },
    },

    settings: {
        node: {
            tryExtensions: [".js", ".json", ".node", ".ts"],
        },
    },

    rules: {
        "no-console": "error",

        "space-before-function-paren": ["error", {
            anonymous: "always",
            named: "never",
            asyncArrow: "always",
        }],

        "@typescript-eslint/comma-dangle": "off",
        "@typescript-eslint/explicit-member-accessibility": "off",
        "@typescript-eslint/key-spacing": "off",
        "@typescript-eslint/naming-convention": "off",
        "@typescript-eslint/no-confusing-void-expression": "off",
        "@typescript-eslint/quotes": "off",
        "@typescript-eslint/promise-function-async": "off",
        "@typescript-eslint/restrict-template-expressions": "off",
        "@typescript-eslint/semi": "off",
        "@typescript-eslint/space-before-function-paren": "off",
        "@typescript-eslint/strict-boolean-expressions": "off",
        "@typescript-eslint/member-delimiter-style": "off",
        "@typescript-eslint/indent": "off",

        "@/object-curly-spacing": ["error", "always", {
            arraysInObjects: false,
            objectsInObjects: true,
        }],

        "no-multiple-empty-lines": "error",

        quotes: ["error", "double", {
            avoidEscape: true,
            allowTemplateLiterals: true,
        }],

        "@typescript-eslint/no-misused-promises": "off",
        "no-extra-boolean-cast": "off",
        "no-unused-vars": "off",

        "comma-dangle": ["error", "always-multiline"],
        "comma-style": ["error", "last"],
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
}];
