import { StreamProvider, StreamStats } from "./interface";

export class Restreamer implements StreamProvider {
  private server: string;

  public streamKey?: string;

  constructor(server: string) {
    this.server = server;
  }
  setStreamKeyFromUrl(streamUrl: string) {
    this.streamKey = streamUrl.match(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/
    )?.[0];
  }
  async fetchStats() {
    const url = `${this.server}/api/v3/widget/process/restreamer-ui:ingest:${this.streamKey}`;
    const result = await fetch(url);
    const jsonResult = await result.json();
    const process: StreamStats = {
      viewers: jsonResult.current_sessions,
      uptime: jsonResult.uptime,
    };
    return process;
  }
}
