FROM node:18

WORKDIR /usr/deminimbusapi
COPY package.json .
RUN npm install
COPY . .
CMD [ "npm", "start" ]