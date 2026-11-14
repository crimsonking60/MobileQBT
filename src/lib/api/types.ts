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

/** torrents/properties */
export interface TorrentProperties {
  save_path: string;
  creation_date: number;
  piece_size: number;
  comment: string;
  total_wasted: number;
  total_uploaded: number;
  total_downloaded: number;
  up_limit: number;
  dl_limit: number;
  time_elapsed: number;
  seeding_time: number;
  nb_connections: number;
  nb_connections_limit: number;
  share_ratio: number;
  addition_date: number;
  completion_date: number;
  created_by: string;
  dl_speed_avg: number;
  up_speed_avg: number;
  eta: number;
  last_seen: number;
  peers: number;
  peers_total: number;
  pieces_have: number;
  pieces_num: number;
  seeds: number;
  seeds_total: number;
  total_size: number;
  is_private?: boolean;
  infohash_v1?: string;
}

/** torrents/trackers; status: 0 disabled, 1 not contacted, 2 working, 3 updating, 4 not working */
export interface Tracker {
  url: string;
  status: 0 | 1 | 2 | 3 | 4;
  tier: number;
  num_peers: number;
  num_seeds: number;
  num_leeches: number;
  num_downloaded: number;
  msg: string;
}

/** priority: 0 skip, 1 normal, 6 high, 7 maximal */
export type FilePriority = 0 | 1 | 6 | 7;

export interface TorrentFile {
  index: number;
  name: string;
  size: number;
  progress: number;
  priority: FilePriority;
  availability: number;
}

export interface Peer {
  client: string;
  connection: string;
  country: string;
  country_code: string;
  dl_speed: number;
  downloaded: number;
  files: string;
  flags: string;
  flags_desc: string;
  ip: string;
  port: number;
  progress: number;
  relevance: number;
  up_speed: number;
  uploaded: number;
}

export interface PeersResponse {
  rid: number;
  full_update?: boolean;
  peers?: Record<string, Peer>;
  show_flags?: boolean;
}

export interface RssArticle {
  id: string;
  title: string;
  description?: string;
  /** qBittorrent formats this as "14 Nov 2026 11:00:00 +0000" */
  date?: string;
  link?: string;
  torrentURL?: string;
  author?: string;
  /** only present once read */
  isRead?: boolean;
}

export interface RssFeedData {
  uid: string;
  url: string;
  title?: string;
  articles?: RssArticle[];
  hasError?: boolean;
  isLoading?: boolean;
  lastBuildDate?: string;
}

/** sync/rss tree: feeds are leaves, anything else is a folder of more nodes. */
export interface RssTree { [name: string]: RssFeedData | RssTree }

export interface RssRule {
  enabled: boolean;
  mustContain: string;
  mustNotContain: string;
  useRegex: boolean;
  episodeFilter: string;
  smartFilter: boolean;
  affectedFeeds: string[];
  ignoreDays: number;
  lastMatch: string;
  assignedCategory: string;
  savePath: string;
  addPaused: boolean | null;
  torrentParams?: Record<string, unknown>;
  [extra: string]: unknown;
}
