# match-uploader

Match Uploader is a tool to help upload FRC match videos to YouTube in a fast, consistent manner.

Match team and score data is provided by [The Blue Alliance](https://www.thebluealliance.com).

## Production usage

Get started quickly using our Docker image:
```bash
docker compose up
```

Required volumes for the Docker image:
- **Videos:** Mount your local videos directory as a volume to `/home/node/app/server/videos`
- **Settings:** Mount a directory to persist settings files to `/home/node/app/server/settings`
  - You can leave the directory empty initially and Match Uploader will create settings files for you

Example of how to provide these volumes are in [`docker-compose.yml`](docker-compose.yml).

### Notes

- **Upload timeout:** The server response timeout is set to 15 minutes (900000ms). After this time, the client won't be
  notified of the response, but the upload should continue on the server. Browsers might timeout on the client side first,
  however.

## Local development

Project organization:
 - [`server`](server) contains all backend code (nodejs, Express, TypeScript)
 - [`client`](client) contains all frontend code (Vue3, Typescript)

Install some baseline dependencies:
  - nodejs (v18 recommended)
  - yarn

- To run the server: `cd server && yarn run dev`
- In a separate terminal, run the client: `cd client && yarn run dev`

## Releases

To trigger an automatic version increment and create releases, make sure the commit message when merging your PR starts
with a type and scope, followed by a colon and a description (it's easiest to do this if you set your PR title correctly
when you create it). For example:
```
type(scope): Brief description of changes
feat(youtube): Improve upload error handling
ci(github): Add automatic release workflow
docs(readme): Add release instructions
refactor(server): Move video upload to separate module
build(docker): Add docker-compose file
```

The exact format required is based on the Angular commit message format. See 
https://gist.github.com/brianclements/841ea7bffdb01346392c for more details. The `type` must be one of the Angular
commit message format types. No specific value is required for `scope`, though we may further define this as the project
matures.

The release process will trigger automatically once your PR is merged. A GitHub tag and release will be created, and a
new production image will be pushed to GitHub Container Registry.
