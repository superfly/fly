ARG BASE_IMAGE
FROM $BASE_IMAGE AS builder

RUN scripts/release/pack-container-server ./tmp/container-server
RUN node-prune ./tmp/container-server

FROM mhart/alpine-node:slim-12

COPY --from=builder /src/tmp/container-server /fly

RUN ln -s /fly/node_modules/.bin/fly-container-server /usr/local/bin

ENTRYPOINT [ "fly-container-server" ]
