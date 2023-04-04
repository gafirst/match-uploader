module.exports = {
    root: true,
    env: {
        node: true,
    },
    extends: [
        "eslint:recommended",
    ],
    rules: {
        "comma-dangle": ["error", "always-multiline"],
        "comma-style": ["error", "last"],
        "quotes": ["error", "double"],
        "semi": ["error", "always"],
        "max-len": [
            "error",
            {
                "code": 120
            }
        ],
    },
}
