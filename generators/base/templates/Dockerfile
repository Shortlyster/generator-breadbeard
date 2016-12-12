FROM node:6.9
ENV NPM_CONFIG_LOGLEVEL=warn
RUN npm install -g yarn

WORKDIR /app

COPY ./package.json /app

RUN NODE_ENV=null yarn install
RUN npm cache clean

ADD . /app
