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

export type GiftGroupPayload = {
  name: string;
  description?: string;
};

export type GiftImageFit = "cover" | "contain";
export type GiftPurchaseStatus = "available" | "reserved" | "sold";
export type GiftOrderStatus =
  | "reserved"
  | "checkout_pending"
  | "approved"
  | "rejected"
  | "expired"
  | "cancelled";

export type GiftPayload = {
  groupId: number;
  name: string;
  imageUrl: string;
  imageFit: GiftImageFit;
  imagePosition: string;
  priceCents: number;
  purchaseStatus?: GiftPurchaseStatus;
};

export type GiftRecord = GiftPayload & {
  id: number;
  groupName?: string;
  purchaseStatus: GiftPurchaseStatus;
  reservedUntil: string | null;
  soldAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GiftCheckoutRecord = {
  order: GiftOrderRecord;
  checkoutUrl: string;
  message: string;
};

export type GiftPaymentSyncRecord = {
  order: GiftOrderRecord;
};

export type GiftOrderRecord = {
  id: number;
  giftId: number;
  giftName: string;
  groupName: string;
  status: GiftOrderStatus;
  amountCents: number;
  externalReference: string;
  preferenceId: string;
  initPoint: string;
  mpPaymentId: string;
  mpStatus: string;
  mpStatusDetail: string;
  reservedUntil: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GiftGroupRecord = GiftGroupPayload & {
  id: number;
  description: string;
  createdAt: string;
  updatedAt: string;
  gifts: GiftRecord[];
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
