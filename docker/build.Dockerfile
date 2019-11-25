ARG BASE_IMAGE
FROM $BASE_IMAGE AS builder

RUN node-prune

FROM mhart/alpine-node:12

WORKDIR /fly

COPY --from=builder /src /fly
