import NDK, { NDKEvent } from "@nostr-dev-kit/ndk";
import { StreamProvider, StreamStats } from "../providers/interface";
// import m3u8stream from "m3u8stream";
import fs from "fs";
import path from "path";
import https from "https";

const UPTIME_CHECK_MAX_ATTEMPS = 5;
const RECORDING_PATH = "./recording";
const SNAPSHOT_PATH = "./snapshot";
export class LiveEvent {
  event?: NDKEvent;
  ndk: NDK;
  timeoutHandler?: NodeJS.Timeout;
  started: boolean = false;
  uptimeCheckAttempts: number = 0;
  currentPaticipants?: string = "0";
  status: "live" | "ended" = "live";
  liveId?: string;
  streamProvider: StreamProvider;
  streamingUrl?: string;
  recordingUrl?: string;

  constructor(ndk: NDK, provider: StreamProvider) {
    this.ndk = ndk;
    this.streamProvider = provider;
  }

  setEvent(event: NDKEvent) {
    this.event = event;
    this.liveId = this.event.tagValue("d");
    this.currentPaticipants =
      this.event.tagValue("current_participants") || "0";
    this.liveId = this.event.tagValue("d");
    this.streamingUrl = this.event.tagValue("streaming") || "";
    this.streamProvider.setStreamKeyFromUrl(this.streamingUrl);
    this.log(this.currentPaticipants, "viewers");
  }

  start() {
    this.started = true;
    this.updateLiveStats();
    // this.updateSnapshot();
    // this.record();
  }
  stop() {
    this.started = false;
    clearTimeout(this.timeoutHandler);
  }

  // record() {
  //   if (!this.liveId || !this.streamingUrl) return;
  //   const recording = path.join(RECORDING_PATH, `${this.liveId}.mp4`);
  //   m3u8stream(this.streamingUrl).pipe(fs.createWriteStream(recording));
  // }

  // updateSnapshot() {
  //   if (!this.liveId || !this.streamingUrl) return;
  //   const snapshot = path.join(SNAPSHOT_PATH, `${this.liveId}.jpg`);
  //   const file = fs.createWriteStream(snapshot);
  //   const snapshotUrl = this.streamingUrl.replace(".m3u8", ".jpg");
  //   https
  //     .get(snapshotUrl, (response) => {
  //       response.pipe(file);
  //       file.on("finish", () => {
  //         file.close();
  //         console.log(`Image downloaded as ${snapshot}`);
  //       });
  //     })
  //     .on("error", (err) => {
  //       fs.unlink(snapshot, () => {});
  //       console.error(`Error downloading image: ${err.message}`);
  //     });
  // }

  async updateLiveStats() {
    try {
      if (!this.isReady()) return;
      const stats = await this.streamProvider.fetchStats();
      if (this.isOnline(stats)) {
        this.uptimeCheckAttempts = 0;
      } else {
        if (this.uptimeCheckAttempts === UPTIME_CHECK_MAX_ATTEMPS) {
          const ndkEvent = this.createEvent();
          ndkEvent.removeTag("current_participants");
          ndkEvent.removeTag("status");
          ndkEvent.tags.push(["status", "ended"]);
          // ndkEvent.removeTag("image");
          // ndkEvent.tags.push(["image", ndkEvent.content]);
          // ndkEvent.content = "";
          this.log("Update status ended");
          await ndkEvent.publish();
          this.stop();
          this.uptimeCheckAttempts = 0;
          return;
        }
        this.uptimeCheckAttempts += 1;
        this.log("Uptime check attempts:", this.uptimeCheckAttempts);
        return;
      }
      if (this.currentPaticipants === stats.viewers?.toString()) return;
      this.currentPaticipants = stats.viewers?.toString();
      const ndkEvent = this.createEvent();
      ndkEvent.removeTag("current_participants");
      ndkEvent.tags.push(["current_participants", this.currentPaticipants]);
      // ndkEvent.content = ndkEvent.content || ndkEvent.tagValue("image") || "";
      this.log("Update viewers");
      await ndkEvent.publish();
    } catch (err) {
    } finally {
      if (!this.started) return;
      this.timeoutHandler = setTimeout(() => {
        this.updateLiveStats();
      }, 5000);
    }
  }

  isReady() {
    if (!this.event || !this.started || !this.liveId || !this.streamProvider)
      return false;
    return true;
  }

  isOnline(process?: StreamStats) {
    if (!process) return false;
    if (process.uptime > 0) {
      return true;
    } else {
      return false;
    }
  }

  createEvent() {
    const ndkEvent = new NDKEvent(this.ndk);
    ndkEvent.content = this.event!.content;
    ndkEvent.kind = this.event!.kind;
    ndkEvent.author = this.event!.author;
    ndkEvent.tags = this.event!.tags;
    return ndkEvent;
  }

  log(...args: any[]) {
    console.log(`[Event]:`, this.liveId, ...args);
  }
}
