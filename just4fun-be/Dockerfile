FROM node:12
WORKDIR '/app'
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run compile

ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]