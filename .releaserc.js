/**
 * @type {import('semantic-release').GlobalConfig}
 */
module.exports = {
    branches: ["main", {name: "sentry", prerelease: true}],
    plugins: [
        "@semantic-release/commit-analyzer",
        "@semantic-release/release-notes-generator",
        "@semantic-release/github",
        ["semantic-release-major-tag", {
            "customTags": ["v${major}"],
        }],
        // ["@semantic-release-plus/docker",    {
        //     "name": "gafirst/match-uploader:latest",
        //     "registry": "ghcr.io"
        // }],
        ["@droidsolutions-oss/semantic-release-sentry", {
          packageName: "match-uploader-backend",
          uploadSourceMaps: true,
          sources: "server/dist"
        }],
        ["@droidsolutions-oss/semantic-release-sentry", {
          packageName: "match-uploader-frontend",
          uploadSourceMaps: true,
          sources: "client/dist"
        }]
    ]
};
