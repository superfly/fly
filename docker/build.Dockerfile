ARG BASE_IMAGE
FROM $BASE_IMAGE AS builder

RUN node-prune

FROM mhart/alpine-node:10

WORKDIR /fly

COPY --from=builder /src /fly
