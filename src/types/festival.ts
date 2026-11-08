export type Festival = {
  id: string;
  year: number;
  name: string;
  targets: string[];
  postingStart: string;
  postingEnd: string;
  eventStart: string | null;
  eventEnd: string | null;
  detailUrl: string | null;
  officialUrl: string | null;
  organizer: string | null;
  organizerUrl: string | null;
  deleted: boolean;
};

export type FestivalStatus =
  | "upcoming"
  | "accepting"
  | "posting-ended"
  | "event-active"
  | "ended";
