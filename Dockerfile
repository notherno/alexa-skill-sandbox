FROM node:9.11.1-stretch

# Install deps to build ffmpeg
RUN apt-get update -y && \
    apt-get install -y ffmpeg

RUN mkdir -p /app
WORKDIR /app

# Install deps
ADD ./package.json ./yarn.lock /app/
RUN yarn install

# Load rest of files
ADD . /app/

# start app
CMD yarn start
