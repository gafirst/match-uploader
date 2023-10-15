/**
 * @type {import('semantic-release').GlobalConfig}
 */
module.exports = {
    branches: ["main", "evan-docker"],
    plugins: [
        "@semantic-release/commit-analyzer",
        "@semantic-release/release-notes-generator",
        "@semantic-release/github",
        ["semantic-release-major-tag", {
            "customTags": ["v${major}-example", "example-${major}.${minor}"],
        }],
        ["@semantic-release-plus/docker",    {
            "name": "gafirst/my-repo:latest",
            "registry": "ghcr.io"
        }]
    ]
};
