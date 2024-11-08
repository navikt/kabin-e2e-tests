FROM mcr.microsoft.com/playwright:v1.48.2-focal

ENV NODE_ENV=test
ENV FORCE_COLOR=0

ARG CI
ENV CI=${CI}

# TODO Remove when tests are stable
ENV TAG_CHANNEL_ON_ERROR=false

WORKDIR /usr/src/app

COPY . .

CMD ["npm", "test"]
