export interface Feed {
  id: number;
  title: string;
  url: string;
  icon_url: string | null;
}

export interface Entry {
  id: number;
  title: string;
  url: string;
  feed: Feed;
  summary: string;
  published: string;
  read?: boolean;
}
