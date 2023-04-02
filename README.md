# match-uploader

## Local development

Project organization:
 - [`server`](server) contains all backend code (nodejs, Express, TypeScript)
 - [`client`](client) contains all frontend code (Vue3, Typescript)

Install some baseline dependencies:
  - nodejs (v16+)
  - yarn

- Copy `server/settings/settings.example.json` to `server/settings/settings.json`
- Copy `server/settings/secrets.example.json` to `server/settings/secrets.json`
- To run the server: `cd server && yarn run dev`
- In a separate terminal, run the client: `cd client && yarn run dev`
