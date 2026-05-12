export const LINKUP_CATEGORIES = [
  "Social",
  "Food & drink",
  "Sports",
  "Outdoors",
  "Study & work",
  "Other",
] as const;

export type LinkUpCategory = (typeof LINKUP_CATEGORIES)[number];

export type LinkUpAttendeeRow = {
  id: string;
  user_id: string;
  display_name: string;
  joined_at: string;
};

export type LinkUpRow = {
  id: string;
  title: string;
  category: string;
  location: string;
  starts_at: string;
  description: string;
  host_id: string;
  host_display_name: string;
  created_at: string;
  updated_at: string;
  linkup_attendees?: LinkUpAttendeeRow[] | null;
};

export type LinkUpView = {
  id: string;
  title: string;
  category: string;
  location: string;
  starts_at: string;
  description: string;
  host_id: string;
  host_display_name: string;
  created_at: string;
  attendee_count: number;
  active_attendees: LinkUpAttendeeRow[];
  you_joined: boolean;
  you_host: boolean;
};
