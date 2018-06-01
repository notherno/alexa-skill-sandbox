FROM node:9.8.0

# Install deps to build ffmpeg
RUN apt-get update -y && \
    apt-get install -y \
    yasm nasm \
    build-essential automake autoconf \
    libtool pkg-config libcurl4-openssl-dev \
    intltool libxml2-dev libgtk2.0-dev \
    libnotify-dev libglib2.0-dev libevent-dev \
    checkinstall

# Build and install ffmpeg
RUN cd /usr/local/src && \
    wget https://www.ffmpeg.org/releases/ffmpeg-snapshot.tar.bz2 && \
    tar jxvf ffmpeg-snapshot.tar.bz2 && \
    cd ffmpeg && \
    ./configure --prefix=/usr/local && \
    time make -j 8 && \
    cat RELEASE && \
    checkinstall -y

RUN mkdir -p /app
WORKDIR /app

# Install deps
ADD ./package.json ./yarn.lock /app/
RUN yarn install

# Load rest of files
ADD . /app/

# start app
CMD yarn start
