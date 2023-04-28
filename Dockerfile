FROM node:18

WORKDIR /usr/deminimbusapi
COPY package.json .
RUN N