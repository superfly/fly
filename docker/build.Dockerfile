ARG BASE_IMAGE
FROM $BASE_IMAGE AS builder

FROM mhart/alpine-node:11

WORKDIR /fly

COPY --from=builder /src /fly
