FROM mcr.microsoft.com/playwright:v1.55.0-noble

ENV TARGET=dev
ENV CONFIG=nais
ENV FORCE_COLOR=0

ARG CI
ENV CI=${CI}

WORKDIR /usr/src/app

COPY . .

CMD ["npm", "test"]
