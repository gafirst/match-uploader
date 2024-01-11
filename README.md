# match-uploader

Match Uploader is a tool to help upload FRC match videos to YouTube in a fast, consistent manner.

Data source attributions:
- [Powered by The Blue Alliance](https://www.thebluealliance.com)
- [Event Data provided by _FIRST_](https://frc-events.firstinspires.org/services/API)

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

### Worker

Prior to v2.0, Match Uploader uploaded videos synchronously in an HTTP client. To add flexibility, v2.0 adds a worker
container that can asynchronously handle jobs such as video uploads. The worker container is intended to be running
anytime you are using Match Uploader; that is, it is important to use the Docker Compose setup to start all three
required containers together.

From the client, you will notice very few changes with the worker in use. However, there are some important
details to note:
- **Leave the worker running.** Jobs will stack up and videos won't upload otherwise.
- **The frontend receives job status updates in real-time.** Using WebSockets, the worker communicates job status
  updates to the frontend. The WebSocket is connected if you see a green dot next to the "Worker" label in the top-right
  corner of the frontend.
  - Note that the green dot only indicates the WebSocket status, and the WebSocket connection is brokered through the
    server. Thus, if the server is up but the worker is not running, the Worker status indicator will be green. Likewise,
    a red status indicates a problem with the client or server, not necessarily the worker.
- **Keep an eye out for failed jobs.** While you have the client open, failed jobs will be flagged with a badge on the
  Worker queue icon in the left sidebar. You can open the Worker page to view details of pending and recently failed jobs.

With the worker, a video upload will now create a new job. Here are the possible statuses a job can have:

| Status | Description |
| ------ | ----------- |
| Pending | The job is waiting to be processed by the worker. (To ensure videos upload in the correct order, video uploads are processed serially in the order they are queued, one at a time.) |
| Running | The worker is actively handling the job. Logs are visible via the worker container, e.g., `docker compose logs --follow worker` |
| Failed (retryable) | An error occurred while handling the job. The job still has at least one more attempt remaining and will be retried. |
| Completed | The job has finished successfully. |
| Failed | An error occurred while handling the job. The job has no more attempts remaining and will not be retried. |

A normal job lifecycle is to go from Pending to Running to Completed.

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
fix(client): Fix bug when uploading videos
```

The exact format required is based on the Angular commit message format. See 
https://gist.github.com/brianclements/841ea7bffdb01346392c for more details. The `type` must be one of the Angular
commit message format types. No specific value is required for `scope`, though we may further define this as the project
matures.

The release process will trigger automatically once your PR is merged. A GitHub tag and release will be created, and a
new production image will be pushed to GitHub Container Registry.
