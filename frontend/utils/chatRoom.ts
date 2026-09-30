/**
 * Single source of truth for Firebase chat room ids.
 *
 * Mirrors the convention the backend enforces in backend/routes/chat.js:
 *   pur_<WastePurchase._id>            collector ↔ vendor
 *   req_<CollectorPurchaseRequest._id> user ↔ collector
 *
 * These prefixes are NOT interchangeable: a WastePurchase id behind `req_`
 * resolves against CollectorPurchaseRequest (a model with no vendor field) and
 * produces a room the counterparty never joins. Chat screens must derive their
 * room from here rather than concatenating a prefix themselves.
 */

export type ChatRoomKind = 'purchase' | 'request';

export interface ChatRoom {
  roomId: string;
  kind: ChatRoomKind;
}

export interface ChatRoomParams {
  /** WastePurchase._id — a collector↔vendor conversation. */
  purchaseId?: string | string[] | null;
  /** CollectorPurchaseRequest._id — a user↔collector conversation. */
  requestId?: string | string[] | null;
}

/** expo-router hands back string[] when a query param is repeated. */
function firstValue(value: string | string[] | null | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  // Guard the literal strings a missing param stringifies into
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return null;
  return trimmed;
}

/**
 * Resolves the room for a conversation, or null when no usable id was supplied.
 *
 * Returning null is deliberate: building a room from an absent id previously
 * produced the shared bucket "req_undefined", which every affected user joined
 * and could read.
 */
export function chatRoomId(params: ChatRoomParams): ChatRoom | null {
  const purchaseId = firstValue(params.purchaseId);
  if (purchaseId) return { roomId: `pur_${purchaseId}`, kind: 'purchase' };

  const requestId = firstValue(params.requestId);
  if (requestId) return { roomId: `req_${requestId}`, kind: 'request' };

  return null;
}

/** Short header label, e.g. "Purchase · #9fd71". */
export function chatRoomLabel(room: ChatRoom | null): string {
  if (!room) return '';
  const noun = room.kind === 'purchase' ? 'Purchase' : 'Request';
  return `${noun} · #${room.roomId.slice(-6)}`;
}
