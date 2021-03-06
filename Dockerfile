FROM node:9.8.0

RUN mkdir -p /app
WORKDIR /app

# Install deps
ADD ./package.json ./yarn.lock /app/
RUN yarn install

# Load rest of files
ADD . /app/

# start app
CMD yarn start
