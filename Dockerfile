FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build


FROM nginx:alpine

RUN apk add --no-cache libcap \
    && setcap 'cap_net_bind_service=+ep' /usr/sbin/nginx \
    && apk del libcap \
    && chown -R nginx:nginx /var/cache/nginx /var/run /etc/nginx/conf.d

COPY --chown=nginx:nginx nginx.conf.template /etc/nginx/templates/default.conf.template

COPY --chown=nginx:nginx --from=builder /app/dist /usr/share/nginx/html

USER nginx

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
