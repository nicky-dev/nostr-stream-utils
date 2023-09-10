## 1. docker-compose.yml

```yml
version: "3.5"

services:
  nostr-stream-utils:
    image: nickydev/nostr-stream-utils:latest
    restart: always
    environment:
      PRIVATE_KEY: <YOUR_NOSTR_PRIVATE_KEY>
      RESTREAMER_SERVER: <YOUR_RESTREAMER_SERVER>
      RESTREAMER_KEY: <YOUR_RESTREAMER_STREAM_KEY>
```

## 2. docker run

```sh
docker run -d \
    --restart always
    --name nostr-stream-utils \
    --env PRIVATE_KEY=<YOUR_NOSTR_PRIVATE_KEY> \
    --env RESTREAMER_SERVER=<YOUR_RESTREAMER_SERVER> \
    --env RESTREAMER_KEY=<YOUR_RESTREAMER_STREAM_KEY> \
    nickydev/nostr-stream-utils:latest
```

## 3. git clone

1. Clone repository

```sh
git clone https://github.com/nicky-dev/nostr-stream-utils.git
cd nostr-stream-utils
```

2. Create .env file

```ini
PRIVATE_KEY=<YOUR_NOSTR_PRIVATE_KEY>
RESTREAMER_SERVER=<YOUR_RESTREAMER_SERVER>
RESTREAMER_KEY=<YOUR_RESTREAMER_STREAM_KEY>
```

3. Start

```sh
npm run dev
```
