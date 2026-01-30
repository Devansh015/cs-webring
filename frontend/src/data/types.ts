export type WebringSite = {
  id: string;
  name: string;
  url: string;
  description?: string;
  owner?: string;
  added?: string;
};

export type WebringData = {
  name: string;
  description: string;
  sites: WebringSite[];
};