FROM node:9.11

MAINTAINER vence2013

RUN mv /etc/apt/sources.list /etc/apt/sources.list.bak
COPY sources.list /etc/apt/sources.list

RUN apt-get update && \
    apt-get install -y aptitude && \
    aptitude install -y mysql-client

WORKDIR /web