FROM node:12 as builder
WORKDIR '/app'
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build --prod

FROM python:3
ENV PYTHONUNBUFFERED 1
WORKDIR '/app'
COPY --from=builder /app/dist/just4fun-fe /app
EXPOSE 4200
CMD python -m http.server 4200
