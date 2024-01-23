FROM node:18-bookworm-slim as base
# TODO(#76): update to Node 20
# References:
# - https://www.digitalocean.com/community/tutorials/how-to-build-a-node-js-application-with-docker
# - https://snyk.io/blog/choosing-the-best-node-js-docker-image/

RUN apt-get update -y &&  \
    apt-get install -y openssl &&  \
    mkdir -p /home/node/app/client/node_modules && \
    mkdir -p /home/node/app/server/node_modules && \
    chown -R node:node /home/node/app

FROM base as build_client_prod

WORKDIR /home/node/app/client

COPY client/package*.json .
COPY client/yarn.lock .

USER node
RUN yarn install --frozen-lockfile

COPY client/public ./public
COPY client/src ./src
COPY client/index.html .
COPY client/tsconfig*.json .
COPY client/vite.config.ts .

RUN yarn run build

FROM base as build_server_prod

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

FROM base as run_server_prod

WORKDIR /home/node/app/server

COPY server/package*.json .
COPY server/yarn.lock .
# Prisma generates the Prisma client in its post-install script, so we need this directory around before running yarn
# install
COPY server/prisma ./prisma

USER node
RUN yarn install --frozen-lockfile --prod

FROM base as prod

WORKDIR /home/node/app

USER node

COPY --from=build_client_prod /home/node/app/client/dist ./client/dist

COPY --from=build_server_prod /home/node/app/server/dist ./server/dist
COPY --from=build_server_prod /home/node/app/server/package.json ./server/package.json
COPY --from=run_server_prod /home/node/app/server/node_modules ./server/node_modules

WORKDIR /home/node/app/server/settings
COPY server/settings/*.example.json .

WORKDIR /home/node/app/server
EXPOSE 8080
CMD ["yarn", "start"]
