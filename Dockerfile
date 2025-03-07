FROM node
EXPOSE 3000
RUN mkdir -m 777 -p /home/node/khdropbox /home/node/khdropbox/uploads
WORKDIR /home/node/khdropbox
ENTRYPOINT npm i && npm start