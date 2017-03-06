FROM shortlyster/node:latest

COPY ./package.json /app
COPY ./yarn.lock /app
RUN $HOME/.yarn/bin/yarn install

RUN touch /app/.env
ADD . /app
