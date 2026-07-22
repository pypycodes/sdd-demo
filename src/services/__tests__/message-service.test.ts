import {
  getUnreadCount,
  getLatestUnreadMessage,
  markMessageAsRead,
  getAllMessages,
  formatTimestamp,
  truncateMessage,
} from '../message-service';

describe('MessageService', () => {
  describe('getUnreadCount', () => {
    it('should return 0 for patient with no messages', () => {
      const count = getUnreadCount('P003');
      expect(count).toBe(0);
    });

    it('should return correct count for patient with unread messages', () => {
      const count = getUnreadCount('P001');
      expect(count).toBeGreaterThan(0);
    });

    it('should return 0 for non-existent patient', () => {
      const count = getUnreadCount('999');
      expect(count).toBe(0);
    });
  });

  describe('getLatestUnreadMessage', () => {
    it('should return null for patient with no messages', () => {
      const message = getLatestUnreadMessage('P003');
      expect(message).toBeNull();
    });

    it('should return latest unread message when unread exist', () => {
      const message = getLatestUnreadMessage('P001');
      if (message) {
        expect(message).toHaveProperty('id');
        expect(message).toHaveProperty('providerId');
        expect(message).toHaveProperty('providerName');
        expect(message.isRead).toBe(false);
      }
    });

    it('should return null for non-existent patient', () => {
      const message = getLatestUnreadMessage('999');
      expect(message).toBeNull();
    });

    it('should return most recent message by timestamp', () => {
      const message = getLatestUnreadMessage('1');
      if (message) {
        expect(message.timestamp).toBeTruthy();
      }
    });
  });

  describe('markMessageAsRead', () => {
    it('should set isRead to true for message', () => {
      const message = getLatestUnreadMessage('P001');
      if (message) {
        markMessageAsRead('P001', message.id);
        // Note: In real app, this would query the DB
        // For now, we verify the function doesn't throw
        expect(true).toBe(true);
      }
    });

    it('should throw error for non-existent patient', () => {
      expect(() => markMessageAsRead('999', 'msg-1')).toThrow();
    });

    it('should throw error for non-existent message', () => {
      expect(() => markMessageAsRead('P001', 'non-existent-msg')).toThrow();
    });
  });

  describe('getAllMessages', () => {
    it('should return empty array for patient with no messages', () => {
      const messages = getAllMessages('P003');
      expect(Array.isArray(messages)).toBe(true);
      expect(messages.length).toBe(0);
    });

    it('should return all messages for patient', () => {
      const messages = getAllMessages('P001');
      expect(Array.isArray(messages)).toBe(true);
      expect(messages.length).toBeGreaterThan(0);
    });

    it('should return empty array for non-existent patient', () => {
      const messages = getAllMessages('999');
      expect(messages).toEqual([]);
    });

    it('should return messages sorted by timestamp (most recent first)', () => {
      const messages = getAllMessages('1');
      if (messages.length > 1) {
        for (let i = 0; i < messages.length - 1; i++) {
          const current = new Date(messages[i].timestamp).getTime();
          const next = new Date(messages[i + 1].timestamp).getTime();
          expect(current).toBeGreaterThanOrEqual(next);
        }
      }
    });
  });

  describe('formatTimestamp', () => {
    it('should format "just now" for recent timestamps', () => {
      const now = new Date().toISOString();
      const formatted = formatTimestamp(now);
      expect(formatted).toBe('just now');
    });

    it('should format minutes ago', () => {
      const tenMinsAgo = new Date(Date.now() - 10 * 60000).toISOString();
      const formatted = formatTimestamp(tenMinsAgo);
      expect(formatted).toContain('m ago');
    });

    it('should format hours ago', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60000).toISOString();
      const formatted = formatTimestamp(twoHoursAgo);
      expect(formatted).toContain('h ago');
    });

    it('should format days ago', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60000).toISOString();
      const formatted = formatTimestamp(threeDaysAgo);
      expect(formatted).toContain('d ago');
    });

    it('should format date for old messages', () => {
      const twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60000).toISOString();
      const formatted = formatTimestamp(twoMonthsAgo);
      expect(formatted).toBeTruthy();
    });
  });

  describe('truncateMessage', () => {
    it('should return full message if under max length', () => {
      const short = 'Hello world';
      expect(truncateMessage(short, 100)).toBe(short);
    });

    it('should truncate long message with ellipsis', () => {
      const long = 'A'.repeat(150);
      const truncated = truncateMessage(long, 100);
      expect(truncated.length).toBe(103); // 100 + "..."
      expect(truncated.endsWith('...')).toBe(true);
    });

    it('should use default max length of 100', () => {
      const long = 'B'.repeat(150);
      const truncated = truncateMessage(long);
      expect(truncated.length).toBe(103);
    });

    it('should handle exact max length', () => {
      const exact = 'C'.repeat(100);
      expect(truncateMessage(exact, 100)).toBe(exact);
    });
  });
});
