# Global variables
ARG COMMIT=""
ARG APP_USER=clinical
ARG WORKDIR=/clinical-submission

######################
# Configure base image
######################
FROM node:20.12.2-alpine AS base

ARG APP_USER
ARG WORKDIR

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat

# install pnpm as root user, before updating node ownership
RUN npm i -g pnpm

# create our own user to run node, don't run node in production as root
ENV APP_UID=9999
ENV APP_GID=9999
RUN addgroup -S -g $APP_GID $APP_USER \
	&& adduser -S -u $APP_UID -g $APP_GID $APP_USER \
	&& mkdir -p ${WORKDIR}

WORKDIR ${WORKDIR}

RUN chown -R ${APP_USER}:${APP_USER} ${WORKDIR}

USER ${APP_USER}:${APP_USER}

######################
# Configure build image
######################

FROM base AS build

ARG APP_USER
ARG WORKDIR

COPY --chown=${APP_USER}:${APP_USER} . ./

RUN pnpm install --ignore-scripts
RUN pnpm build

######################
# Configure prod-deps image
######################
 
FROM build AS prod-deps

ARG APP_USER
ARG WORKDIR

WORKDIR ${WORKDIR}

USER ${APP_USER}:${APP_USER}

# pnpm will not install any package listed in devDependencies
RUN pnpm install --prod

######################
# Configure server image
######################
FROM base AS server

ARG APP_USER
ARG WORKDIR
ARG SUBMISSION_DIR=${WORKDIR}/apps/submission

USER ${APP_USER}

COPY --from=build ${WORKDIR}/node_modules ./node_modules

WORKDIR ${SUBMISSION_DIR}

COPY --from=prod-deps ${SUBMISSION_DIR}/node_modules ./node_modules
COPY --from=build ${SUBMISSION_DIR}/dist .

EXPOSE 3030

ENV COMMIT_SHA=${COMMIT}
ENV NODE_ENV=production

CMD [ "pnpm", "start:prod" ]

#######################################################
# UI Server
#######################################################

FROM nginx:1.27-alpine-slim AS data-dictionary-ui

ARG APP_USER
ARG WORKDIR
ARG DATA_DICTIONARY_UI_DIR=${WORKDIR}/apps/data-dictionary-ui

# Create non-root user
ENV APP_UID=9999
ENV APP_GID=9999
RUN addgroup -S -g $APP_GID ${APP_USER} \
	&& adduser -S -u $APP_UID -g $APP_GID ${APP_USER}

# Modify permissions on nginx for our new user
RUN	chown -R ${APP_USER}:${APP_USER} /var/cache/nginx && \
	chown -R ${APP_USER}:${APP_USER} /etc/nginx/ && \
	chmod -R 755 /etc/nginx/ && \
	chown -R ${APP_USER}:${APP_USER} /var/log/nginx

RUN mkdir -p /etc/nginx/ssl/ && \
	chown -R ${APP_USER}:${APP_USER} /etc/nginx/ssl/ && \
	chmod -R 755 /etc/nginx/ssl/

RUN touch /var/run/nginx.pid && \
	chown -R ${APP_USER}:${APP_USER} /var/run/nginx.pid /run/nginx.pid

# Switch to new user
USER ${APP_USER}

# Copy site and nginx config
COPY --from=build ${DATA_DICTIONARY_UI_DIR}/dist /usr/share/nginx/html
COPY --from=build ${DATA_DICTIONARY_UI_DIR}/docker/nginx.conf.template /etc/nginx/templates/nginx.conf.template
RUN rm -f /etc/nginx/conf.d/default.conf

EXPOSE 3001
CMD ["nginx", "-g", "daemon off;"]
