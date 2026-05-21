# Kabin E2E tests

This app uses [Playwright](https://playwright.dev/) to log in as a test user in development and test that the app behaves as expected.

## Running locally

```
export SAKSBEHANDLER_USERNAME=<email>
export SAKSBEHANDLER_PASSWORD=<password>
```

... or create an `.env` file with the following content:

```
SAKSBEHANDLER_USERNAME=<email>
SAKSBEHANDLER_PASSWORD=<password>
```

### Against `dev`

`bun dev` or `bun dev --headed`

Will run the tests against [kabin.intern.dev.nav.no](https://kabin.intern.dev.nav.no) with the local config.

### Against `localhost:8063`

`bun local` or `bun local --headed`

Will run the tests against [localhost:8063](http://localhost:8063) with local config.

### Just like in NAIS

`bun test` or `bun test --headed`

Will run the tests against [kabin.intern.dev.nav.no](https://kabin.intern.dev.nav.no) with the same config as in NAIS.

## GCP

```
kubectl create configmap slack-e2e-configmap \
--from-literal=klage_notifications_channel=klage-notifications

kubectl create secret generic slack-e2e-secrets \
--from-literal=slack_e2e_token=<token> \
--from-literal=slack_signing_secret=<secret>

kubectl create secret generic kabin-e2e-test-users \
--from-literal=SAKSBEHANDLER_USERNAME=<email> \
--from-literal=SAKSBEHANDLER_PASSWORD=<password>
```

As a one-time job, before the tests can run, we must apply the network policy:

```
kubectl apply -f nais/e2e-network-policy.yaml -n klage
```
