export interface StreamProvider {
  streamKey?: string;
  /**
   *
   */
  fetchStats: () => Promise<StreamStats>;

  getStreamUrl?: () => string;

  getRecordUrl?: () => string;

  getSnapshotUrl?: () => string;

  setStreamKeyFromUrl: (streamUrl: string) => void;
}

export interface StreamStats {
  /**
   *
   */
  viewers: number;

  /**
   *
   */
  uptime: number;

  /**
   *
   */
  totalViewers?: number;
}
