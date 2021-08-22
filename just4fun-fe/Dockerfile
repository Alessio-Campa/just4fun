FROM node:12 as builder
WORKDIR '/app'
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build --prod

FROM robertohuertasm/microserver
WORKDIR '/app'
COPY --from=builder /app/dist/just4fun-fe /app
EXPOSE 4200
CMD ["/microserver", "/app", "-p", "4200"]

