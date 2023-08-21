#  latest LTS (long term support) version of Node.js
FROM node:18.15.0-slim 

# Create app directory
WORKDIR /usr/src/app

# instal yarn that I used during app development
# This is supposed to be included in node:18.15.0-slim
# RUN npm install -g yarn

# Copy necessary files for the web
COPY ./package.json ./yarn.lock vite.config.ts ./webpack.config.ts ./tsconfig.node.json ./tsconfig.json .

# Install the dependencies
RUN yarn install

# Move all necessry files to create website
COPY ./src .

EXPOSE 3000

CMD ["yarn","run","--host"]

