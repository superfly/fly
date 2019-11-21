ARG BASE_IMAGE
FROM $BASE_IMAGE AS builder

RUN scripts/release/pack-bundle-server ./tmp/bundle-server
RUN node-prune ./tmp/bundle-server

FROM mhart/alpine-node:slim-10

COPY --from=builder /src/tmp/bundle-server /fly

RUN ln -s /fly/node_modules/.bin/fly-bundle-server /usr/local/bin

ENTRYPOINT [ "fly-bundle-server" ]
