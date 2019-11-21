FROM mhart/alpine-node:11 AS builder

RUN apk add python make build-base libexecinfo-dev libpng-dev bash

WORKDIR /src
COPY package.json yarn.lock lerna.json ./
COPY packages/build/package.json ./packages/build/package.json
COPY packages/bundle-server/package.json ./packages/bundle-server/package.json
COPY packages/cli/package.json ./packages/cli/package.json
COPY packages/core/package.json ./packages/core/package.json
COPY packages/examples/package.json ./packages/examples/package.json
COPY packages/fly/package.json ./packages/fly/package.json
COPY packages/test-environment/package.json ./packages/test-environment/package.json
COPY packages/v8env/package.json ./packages/v8env/package.json
COPY tests/edge-apps/package.json ./tests/edge-apps/package.json
COPY tests/v8env/package.json ./tests/v8env/package.json
RUN yarn install && yarn bootstrap

COPY . .
RUN yarn build && yarn bundle
