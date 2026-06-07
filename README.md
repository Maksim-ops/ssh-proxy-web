# ai-proxy-web

Vue SPA for `core-api`.

## Dev

```bash
env -u http_proxy -u https_proxy -u HTTP_PROXY -u HTTPS_PROXY -u ALL_PROXY -u all_proxy -u NO_PROXY -u no_proxy npm install --registry=https://registry.npmjs.org/
npm run dev
```

## Build

```bash
npm run build
```

## Docker

The image is built by `../ai-proxy/docker-compose.yml` as service `web` and exposes the UI on port `8081`.
