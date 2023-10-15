/**
 * @type {import('semantic-release').GlobalConfig}
 */
module.exports = {
    branches: ["main"],
    plugins: [
        "@semantic-release/commit-analyzer",
        "@semantic-release/release-notes-generator",
        "@semantic-release/github",
        ["semantic-release-major-tag", {
            "customTags": ["v${major}"],
        }],
        ["@semantic-release-plus/docker",    {
            "name": "gafirst/match-uploader:latest",
            "registry": "ghcr.io"
        }]
    ]
};
