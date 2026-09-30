import { chatRoomId, chatRoomLabel } from '@/utils/chatRoom';

const PURCHASE_ID = '6a0c4a3f434f740d9695fd71'; // real WastePurchase (Glass)
const REQUEST_ID = '6a0402a1def6f37802bfdba2'; // real CollectorPurchaseRequest

describe('chatRoomId', () => {
  describe('collector ↔ vendor (purchase)', () => {
    it('prefixes a purchase id with pur_', () => {
      expect(chatRoomId({ purchaseId: PURCHASE_ID })).toEqual({
        roomId: `pur_${PURCHASE_ID}`,
        kind: 'purchase',
      });
    });

    // The bug this helper exists to prevent: a WastePurchase id must never be
    // prefixed req_, or the vendor and collector end up in separate rooms.
    it('never produces a req_ room for a purchase id', () => {
      const room = chatRoomId({ purchaseId: PURCHASE_ID });

      expect(room!.roomId.startsWith('req_')).toBe(false);
    });
  });

  describe('user ↔ collector (request)', () => {
    it('prefixes a request id with req_', () => {
      expect(chatRoomId({ requestId: REQUEST_ID })).toEqual({
        roomId: `req_${REQUEST_ID}`,
        kind: 'request',
      });
    });
  });

  describe('precedence', () => {
    it('prefers the purchase id when both are supplied', () => {
      const room = chatRoomId({ purchaseId: PURCHASE_ID, requestId: REQUEST_ID });

      expect(room).toEqual({ roomId: `pur_${PURCHASE_ID}`, kind: 'purchase' });
    });
  });

  describe('unusable input', () => {
    it.each([
      ['no params at all', {}],
      ['undefined ids', { purchaseId: undefined, requestId: undefined }],
      ['null ids', { purchaseId: null, requestId: null }],
      ['empty strings', { purchaseId: '', requestId: '' }],
      ['whitespace only', { purchaseId: '   ' }],
      ['the literal string "undefined"', { requestId: 'undefined' }],
      ['the literal string "null"', { requestId: 'null' }],
    ])('returns null for %s', (_label, params) => {
      expect(chatRoomId(params)).toBeNull();
    });

    // Regression guard for the shared "req_undefined" bucket that every user
    // with a missing route param used to join.
    it('never builds a room containing the word undefined', () => {
      const room = chatRoomId({ requestId: undefined });

      expect(room).toBeNull();
    });

    it('falls through to the request id when the purchase id is unusable', () => {
      const room = chatRoomId({ purchaseId: '', requestId: REQUEST_ID });

      expect(room).toEqual({ roomId: `req_${REQUEST_ID}`, kind: 'request' });
    });
  });

  describe('repeated query params', () => {
    it('uses the first value of an array-valued purchase id', () => {
      const room = chatRoomId({ purchaseId: [PURCHASE_ID, 'second'] });

      expect(room).toEqual({ roomId: `pur_${PURCHASE_ID}`, kind: 'purchase' });
    });

    it('returns null for an empty array', () => {
      expect(chatRoomId({ requestId: [] })).toBeNull();
    });
  });

  describe('trimming', () => {
    it('strips surrounding whitespace from an id', () => {
      expect(chatRoomId({ purchaseId: `  ${PURCHASE_ID}  ` })!.roomId).toBe(`pur_${PURCHASE_ID}`);
    });
  });
});

describe('chatRoomLabel', () => {
  it('labels a purchase room', () => {
    expect(chatRoomLabel(chatRoomId({ purchaseId: PURCHASE_ID }))).toBe('Purchase · #95fd71');
  });

  it('labels a request room', () => {
    expect(chatRoomLabel(chatRoomId({ requestId: REQUEST_ID }))).toBe('Request · #bfdba2');
  });

  it('distinguishes the two kinds so threads are not confused', () => {
    const purchase = chatRoomLabel(chatRoomId({ purchaseId: PURCHASE_ID }));
    const request = chatRoomLabel(chatRoomId({ requestId: REQUEST_ID }));

    expect(purchase).toMatch(/^Purchase/);
    expect(request).toMatch(/^Request/);
  });

  it('returns an empty label when there is no room', () => {
    expect(chatRoomLabel(null)).toBe('');
  });
});
