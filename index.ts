import "./utils/env";
import "./utils/ws-polyfill";
import NDK, {
  NDKEvent,
  NDKKind,
  NDKPrivateKeySigner,
} from "@nostr-dev-kit/ndk";
import { LiveEvent } from "./controllers/LiveEvent";
import { Restreamer } from "./providers/Restreamer";

if (!process.env.PRIVATE_KEY) {
  throw new Error("environment variable `PRIVATE_KEY` does not set");
}

if (!process.env.RESTREAMER_SERVER) {
  throw new Error("environment variable `RESTREAMER_SERVER` does not set");
}

const events: Record<string, LiveEvent> = {};
const privateKeySigner = new NDKPrivateKeySigner(process.env.PRIVATE_KEY);
const ndk = new NDK({
  explicitRelayUrls: process.env.RELAYS
    ? process.env.RELAYS.split(",")
        .map((d) => d.trim())
        .filter((d) => !!d)
    : ["wss://relay.nostr.band", "wss://relay.snort.social"],
  signer: privateKeySigner,
});

const liveStreamHandler = async () => {
  const ndkUser = await privateKeySigner.user();
  const subscription = ndk.subscribe(
    { kinds: [30311 as NDKKind], authors: [ndkUser.hexpubkey()] },
    { closeOnEose: false }
  );
  subscription.on("event", (event: NDKEvent) => {
    const streamId = event.tagValue("d");
    const status = event.tagValue("status");
    if (!streamId) return;
    if (status !== "live") return;
    let liveEvent = events[streamId];
    if (!liveEvent) {
      const streamProvider = new Restreamer(
        process.env.RESTREAMER_SERVER || ""
      );
      liveEvent = new LiveEvent(ndk, streamProvider);
      events[streamId] = liveEvent;
    }
    liveEvent.setEvent(event);
    if (!liveEvent.started) {
      liveEvent.start();
    }
  });
};

const run = async () => {
  await ndk.connect();
  liveStreamHandler();
};

run();
