FROM node:22-bookworm-slim AS base
# References:
# - https://www.digitalocean.com/community/tutorials/how-to-build-a-node-js-application-with-docker
# - https://snyk.io/blog/choosing-the-best-node-js-docker-image/

ARG RELEASE_VERSION
ENV VITE_RELEASE_VERSION=${RELEASE_VERSION}
ENV RELEASE_VERSION=${RELEASE_VERSION}

RUN apt-get update -y &&  \
    apt-get install -y ca-certificates curl openssl &&  \
    install -d /usr/share/postgresql-common/pgdg && \
    curl -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc --fail https://www.postgresql.org/media/keys/ACCC4CF8.asc && \
    . /etc/os-release && \
    sh -c "echo 'deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt $VERSION_CODENAME-pgdg main' > /etc/apt/sources.list.d/pgdg.list" && \
    apt-get update -y && \
    apt-get install -y postgresql-client-16 && \
    mkdir -p /home/node/app/client/node_modules && \
    mkdir -p /home/node/app/server/node_modules && \
    chown -R node:node /home/node/app

FROM base AS build_client_prod

WORKDIR /home/node/app/client

COPY client/package*.json .
COPY client/yarn.lock .

USER node
RUN yarn install --frozen-lockfile

COPY client/public ./public
COPY client/src ./src
COPY client/index.html .
COPY client/tsconfig*.json .
COPY client/vite.config.mts .

RUN yarn run build

FROM base AS build_server_prod

WORKDIR /home/node/app/server

COPY server/package*.json .
COPY server/yarn.lock .

# Prisma generates the Prisma client in its post-install script, so we need this directory around before running yarn
# install
COPY server/prisma ./prisma

USER node
RUN yarn install --frozen-lockfile

COPY server/src ./src
COPY server/tsconfig*.json .
COPY server/build.ts .

RUN yarn run build

COPY server/src/crontab.txt ./dist/crontab.txt

FROM base AS run_server_prod

WORKDIR /home/node/app/server

COPY server/package*.json .
COPY server/yarn.lock .
# Prisma generates the Prisma client in its post-install script, so we need this directory around before running yarn
# install
COPY server/prisma ./prisma

USER node
RUN yarn install --frozen-lockfile --prod

FROM base AS prod

WORKDIR /home/node/app

USER node

COPY --from=build_client_prod /home/node/app/client/dist ./client/dist

COPY --from=build_server_prod /home/node/app/server/dist ./server/dist
COPY --from=build_server_prod /home/node/app/server/prisma ./server/prisma
COPY --from=build_server_prod /home/node/app/server/package.json ./server/package.json
COPY --from=run_server_prod /home/node/app/server/node_modules ./server/node_modules

WORKDIR /home/node/app/server/settings
COPY --chown=node:node server/settings/*.example.json .
COPY --chown=node:node server/settings/*.example.txt .

WORKDIR /home/node/app/server/env
COPY --chown=node:node server/env/production.env.example .

WORKDIR /home/node/app/server
USER root
RUN chown -R node:node /home/node/app/server/settings && \
    chown -R node:node /home/node/app/server/env

USER node

# TODO: Allow customizing TZ
ENV TZ="America/New_York"
EXPOSE 8080
CMD ["yarn", "start"]
