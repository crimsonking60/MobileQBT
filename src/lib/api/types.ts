/** Subset of qBittorrent 5.x WebUI API v2 types used by the app. */

export type TorrentState =
  | 'error' | 'missingFiles' | 'uploading' | 'stoppedUP' | 'queuedUP' | 'stalledUP'
  | 'checkingUP' | 'forcedUP' | 'allocating' | 'downloading' | 'metaDL' | 'forcedMetaDL'
  | 'stoppedDL' | 'queuedDL' | 'stalledDL' | 'checkingDL' | 'forcedDL'
  | 'checkingResumeData' | 'moving' | 'unknown';

export interface Torrent {
  hash: string;
  name: string;
  state: TorrentState;
  progress: number;
  size: number;
  total_size: number;
  dlspeed: number;
  upspeed: number;
  eta: number;
  ratio: number;
  num_seeds: number;
  num_leechs: number;
  category: string;
  tags: string;
  tracker: string;
  save_path: string;
  added_on: number;
  completion_on: number;
  amount_left: number;
  downloaded: number;
  uploaded: number;
  priority: number;
  force_start: boolean;
}

export interface Category { name: string; savePath: string }

export interface ServerState {
  connection_status: 'connected' | 'firewalled' | 'disconnected';
  dl_info_speed: number;
  up_info_speed: number;
  dl_info_data: number;
  up_info_data: number;
  dl_rate_limit: number;
  up_rate_limit: number;
  free_space_on_disk: number;
  use_alt_speed_limits: boolean;
}

/** Raw response of sync/maindata; every map holds partial objects on incremental updates. */
export interface MainData {
  rid: number;
  full_update?: boolean;
  torrents?: Record<string, Partial<Torrent>>;
  torrents_removed?: string[];
  categories?: Record<string, Partial<Category>>;
  categories_removed?: string[];
  tags?: string[];
  tags_removed?: string[];
  trackers?: Record<string, string[]>;
  trackers_removed?: string[];
  server_state?: Partial<ServerState>;
}

export interface AddTorrentOptions {
  urls?: string;
  files?: File[];
  savepath?: string;
  category?: string;
  tags?: string;
  stopped?: boolean;
  sequentialDownload?: boolean;
  firstLastPiecePrio?: boolean;
}
