# match-uploader

Match Uploader is a tool to help upload FRC match videos to YouTube in a fast, consistent manner.

Data source attributions:
- [Powered by The Blue Alliance](https://www.thebluealliance.com)
- [Event Data provided by _FIRST_](https://frc-events.firstinspires.org/services/API)

## Production usage

To get started:

1. Clone this repo locally. You don't actually need the source code, but it's the easiest way to get the directory structure for the required Docker volumes.
2. Copy [`server/env/production.env.example`](server/env/production.env.example) to `server/env/production.env` and
   fill in the values using the descriptions in [Environment variables](#environment-variables) below.
3. Adjust `docker-compose.yaml` as needed (additional details in comments on the relevant lines):
   1. Set the port you want to access the web client on by editing the `port` property on the `web` container
   2. Adjust the path to your videos directory by editing the `volumes` property on the `web` and `worker` containers
      1. The default docker-compose.yaml file uses a YAML anchor to keep the volumes in sync between the `web` and `worker` containers. In that case, you only have to update the volumes for the `web` container, and the `worker` container will use those volumes as well.
4. Run `docker compose up` to start the containers.
   1. If there's a new version of Match Uploader available, you can pull the latest version by running `docker compose pull` before `docker compose up`.
   2. The first time you run Match Uploader, Docker containers are pulled and database migrations are run. This can take a few minutes.
   3. On a successful startup, everything should be ready to go once you see the `worker` container log `INFO: Worker connected and looking for jobs...`
   4. These `db` container log messages are safe to ignore:
      1. `database system is shut down` and `server stopped` as long as there is activity after.
      2. `ERROR: relation "graphile_worker.migrations" does not exist at character 93` (unsure why this is logged, but this is related to the worker library Match Uploader uses, Graphile Worker, and does not seem to be problematic)
      3. `could not receive data from client: Connection reset by peer`
   5. The `worker` container may log `Failed to read crontab file '/home/node/app/server/crontab'; cron is disabled`; you can ignore this.
5. Open the web client at [http://localhost](http://localhost) (or whatever port you set in step 3.1).
6. Once the web UI is open, you will see several errors and warnings to resolve prior to uploading your first video. Open the settings page from the left sidebar to complete setup:
   1. Enter or confirm defaults for `Event name`, `Event TBA code`, (event code from The Blue Alliance), 
      `Playoffs type`, `Sandbox mode` (enable to test uploads without actually uploading to YouTube), and `Video upload privacy`.
      1. The sandbox mode and video upload privacy settings are useful for testing your setup without making things public.
         1. To upload public videos, set `Sandbox mode` to `Off` and `Video upload privacy` to `Public`.
   2. Provide your API keys for The Blue Alliance.
      1. Read API key: This is the recommended way to retrieve match data for your events. However, you can instead set up the `FRC Events API` if data for your event is not available on The Blue Alliance.
      2. Trusted (write) API: Allows you to associate match videos with matches on The Blue Alliance.
   3. YouTube API setup:
      1. Scroll down to the bottom of the page to connect your YouTube channel. **Note:** This step can only be completed when the app is hosted on `localhost` or with a valid top-level domain due to Google OAuth2 app restrictions.
   4. YouTube playlist mappings: If you have playlists that you'd like match videos added to, follow the instructions in this section to set this up.
   5. Video description template: While no warning appears for this, you should double-check that the default video
      description template fits your needs and adjust it as needed.
   6. Read below on how to structure your `videos` directory, which is where you'll place the video files for matches.

### Video directory structure

Match Uploader expects a specific directory structure for your videos. When running Match Uploader in Docker, you can
mount any directory (such as one that your video production software writes recordings to) as the videos volume (for
specifics, see [Docker volumes](#docker-volumes), below).

The expected directory structure is as follows:
```
videos/
├─ unlabeled/
│  ├─ Qualification 1.mp4
├─ $LABEL/
│  ├─ Qualification 1.mp4
```

> [!TIP]
> The `.mp4` video extension is just an example. You can use any file type that YouTube supports.

A video label is an extra description for when you have multiple videos to upload for one match. Match Uploader will
include the video label in the middle of the video title, e.g., `Qualification Match 1 - $LABEL - Event Name`.

**What if I don't want a label in the video title?** A video with no label is labeled `unlabeled` (so you would put
videos that should be unlabeled in a directory called `unlabeled`). This will title the video like 
`Qualification Match 1 - Event Name`.

After being uploaded, videos are moved to a directory called `uploaded` within each label directory. (You don't need to
create the `uploaded` directories; they'll get created automatically when needed.) For instance:
```
videos/
├─ unlabeled/
│  ├─ uploaded/
│  │  ├─ Qualification 1.mp4
|  ├─ Qualification 2.mp4
├─ $LABEL/
│  ├─ uploaded/
│  │  ├─ Qualification 1.mp4
|  ├─ Qualification 2.mp4
```

> [!CAUTION]
> Don't mount your videos directory as a read-only Docker volume. Otherwise, the server won't be able to move videos to 
> the `uploaded` directories.

### Docker Compose setup in-depth

#### Docker containers

The Docker Compose file actually runs 3 containers. You'll need all of them running to use Match Uploader. The
containers should be started in this order (the default Docker Compose setup provided will handle this for you):

1. **db:** A Postgres database, primarily used for storing information about worker jobs
2. **web:** Includes the backend server as well as the frontend web client
3. **worker:** A worker that asynchronously handles jobs such as video uploads

#### Environment variables

For simplicity, and to keep secrets out of `docker-compose.yaml`, all 3 containers mentioned above will
pull environment variables from the `server/env/production.env` file. As a result, not all containers use all the environment variables,
and you need to provide values for database information in two different environment variables. There are some additional environment variables
defined in the file that are not specified below; please leave those intact.

> [!IMPORTANT]  
> You **must** define both the `POSTGRES_*` environment variables and the `DB_CONNECTION_STRING` environment variable.
> The `db` container uses the `POSTGRES_*` environment variables to set up the database configuration, while the `web` and
> `worker` containers use the `DB_CONNECTION_STRING` environment variable to connect to the database.

| Variable              | Description                                                                                                                                                                                                                                                          | Sample value                                                                                                                                                                                                                                                                                                                                |
|-----------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `PORT`                  | Determines the port the backend server runs on _inside of its container_. (To change the external container port, you'd want to edit the `port` property on the `web` container in `docker-compose.yaml`.)                                                            | Leave set to default: `8080`                                                                                                                                                                                                                                                                                                                |
| `POSTGRES_DB`           | Used by the `db` container. The name of the Postgres database to create.                                                                                                                                                                                             | Leave set to default: `match_uploader`                                                                                                                                                                                                                                                                                                      |
| `POSTGRES_USER`         | Used by the `db` container. Determines the username of the user created to access the Postgres server, so you can put anything here as long as you use the same value in `DB_CONNECTION_STRING`.                                                                     | Leave set to default: `match_uploader`                                                                                                                                                                                                                                                                                                      |
| `POSTGRES_PASSWORD`     | Used by the `db` container. Determines the password of the user created to access the Postgres server, so you can put anything here as long as you use the same value in `DB_CONNECTION_STRING`.                                                                     | Pick any random string to use as a password                                                                                                                                                                                                                                                                                                 |
| `DB_CONNECTION_STRING`  | Used by the `web` and `worker` containers. Connection string to connect to the PostgreSQL server.                                                                                                                                                                    | Recommended value: `postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}` (replace values with environment variables already defined; `POSTGRES_HOST` with the default Match Uploader Docker Compose configuration would be `db`; `POSTGRES_PORT` should be the default Postgres port, `5432`) |
| `WORKER_WEB_SERVER_URL` | Used by the `worker` container. The URL (include protocol, domain, and port) where the backend server can be reached from _inside_ the `worker` container. This value is provided to Socket.IO to connect to the WebSocket server hosted out of the `web` container. | Leave set to default: `http://web:8080`                                                                                                                                                                                                                                                                    |

#### Docker volumes

There are 3 required Docker volumes for the `web` and `worker` containers:
- **Videos:** Mount your local videos directory as a volume to `/home/node/app/server/videos`
    - The directory structure is described in [Video directory structure](#video-directory-structure)
- **Environment variables:** Server environment variables located in `/home/node/app/server/env`
  - Make a copy of [`server/env/production.env.example`](server/env/production.env.example) and fill in the values.
    Descriptions of what you need to fill in are described [above](#environment-variables).
- **Settings:** Mount a directory to persist settings files to `/home/node/app/server/settings`
  - You can leave the directory empty initially and Match Uploader will create settings files for you

Examples of how to provide these volumes are in [`docker-compose.yaml`](docker-compose.yaml).

The Postgres container requires a volume to persist the database in. The default Docker Compose setup is set up so
that Docker will create this volume for you.

### Worker

Prior to v2.0, Match Uploader uploaded videos synchronously in an HTTP client. To add flexibility, v2.0 added a worker
container that can asynchronously handle jobs such as video uploads.

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

| Status             | Description |
|--------------------| ----------- |
| Pending            | The job is waiting to be processed by the worker. (To ensure videos upload in the correct order, video uploads are processed serially in the order they are queued, one at a time.) |
| Started            | The worker is actively handling the job. Logs are visible via the worker container, e.g., `docker compose logs --follow worker` |
| Failed (retryable) | An error occurred while handling the job. The job still has at least one more attempt remaining and will be retried. |
| Completed          | The job has finished successfully. |
| Failed             | An error occurred while handling the job. The job has no more attempts remaining and will not be retried. |

A normal job lifecycle is to go from Pending to Started to Completed.

## Local development

Project organization:
 - [`server`](server) contains all backend code (nodejs, Express, TypeScript)
 - [`client`](client) contains all frontend code (Vue3, Typescript)

Install some baseline dependencies:
  - nodejs (version >= 20.0 required; Node 20 (LTS) is recommended)
  - yarn

- To run the server: `cd server && yarn run dev`
- In a separate terminal, run the client: `cd client && yarn run dev`

### Database migrations

The server uses Prisma to manage our database. Check out the [Prisma docs](https://www.prisma.io/docs/) and `server/prisma`
for more information.

Migrations are automatically run when the server starts in the production Docker Compose setup. If you change the database
as part of a change, be sure to include a migration that can run on startup to apply changes for existing users.

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
