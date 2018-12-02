#Phase 1: Builder
FROM node:alpine as builder
#Establish your docker PWD(Present Working Directory)
WORKDIR '/app'
#First we copy the Dockerrun.aws.json, as a technique to prevent docker build from
#busting the cache eveytime source code has changed
COPY ./package.json ./
# install node_modules
RUN npm install
# copy over everything else
COPY . .
# Build the minified reseources and assets
RUN npm run build

#Phase 2: NGINX
FROM nginx
EXPOSE 3000
#Copy builder phase into the nginx phase
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf
#Served up production build assets
COPY --from=builder /app/build /usr/share/nginx/html