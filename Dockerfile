FROM node:alpine
COPY app.js index.js package.json package-lock.json /app/
COPY node_modules /app/node_modules/
WORKDIR /app
ENTRYPOINT ["/usr/bin/env", "node", "app.js"]
CMD []
