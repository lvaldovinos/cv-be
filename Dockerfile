FROM node:slim
MAINTAINER Luis Valdovinos "lastkiss115@gmail.com"
# create workdir folder
RUN mkdir /usr/src/cv-be
WORKDIR /usr/src/cv-be
# COPY DEPENDENCIES
COPY package.json .
RUN npm install
# COPY application
COPY . /usr/src/cv-be
# exe priv to index.js
RUN chmod 777 index.js
# expose port
EXPOSE 3000
# start application
CMD ["npm", "run", "dev"]
