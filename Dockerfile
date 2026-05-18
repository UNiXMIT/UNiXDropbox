FROM node
EXPOSE 3000
RUN mkdir -m 777 -p /home/node/dropbox 
RUN mkdir -m 777 -p /home/node/dropbox/uploads
WORKDIR /home/node/dropbox
ENTRYPOINT npm i && npm start