export type NavItem = {
  label: string;
  path: string;
  highlight?: boolean;
};

export type GiftOption = {
  title: string;
  description: string;
  url: string;
  buttonLabel: string;
  isPix?: boolean;
};

export type RsvpPayload = {
  name: string;
  phone: string;
  attending: boolean;
  partySize: number;
  inviteeNames?: string;
  notes?: string;
};

export type RsvpRecord = RsvpPayload & {
  id: number;
  createdAt: string;
  updatedAt: string;
};

export type RsvpStats = {
  totalResponses: number;
  totalAttending: number;
  totalNotAttending: number;
  totalGuests: number;
};
