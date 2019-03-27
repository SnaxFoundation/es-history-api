FROM node:alpine

COPY . /usr/src/app

WORKDIR /usr/src/app

RUN apk --no-cache add --update --virtual .build-dependencies python gcc g++ make git bash \
    && yarn install \
    && yarn build \
    && npm cache clean --force \
    && apk del --purge .build-dependencies python gcc g++ make git bash \
    && npm rm -g yarn \
    && rm -rf /root/..?* \
              /root/.[!.]* \
              /root/* \
              /tmp/*

EXPOSE 3000

ENTRYPOINT ["/bin/sh", "docker-entrypoint.sh"]
