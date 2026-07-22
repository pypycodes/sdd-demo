import * as fs from 'fs';

jest.mock('fs');

const mockedFs = fs as jest.Mocked<typeof fs>;

// Import after mocking so the module picks up the mocked fs
import {
  saveConversation,
  getConversationsByPatient,
  getConversationById,
  deleteConversation,
} from '../transcript-service';

describe('transcript-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveConversation', () => {
    it('should create a new conversation with a generated id when file does not exist', () => {
      (mockedFs.existsSync as jest.Mock).mockReturnValue(false);
      (mockedFs.writeFileSync as jest.Mock).mockImplementation(() => undefined);

      const result = saveConversation({
        patientId: 'P001',
        transcript: [],
        duration: 30,
        timestamp: '2026-01-01T00:00:00Z',
      });

      expect(result.id).toMatch(/^VC-/);
      expect(result.patientId).toBe('P001');
      expect(mockedFs.writeFileSync).toHaveBeenCalledTimes(1);
    });

    it('should append to existing transcripts loaded from file', () => {
      (mockedFs.existsSync as jest.Mock).mockReturnValue(true);
      (mockedFs.readFileSync as jest.Mock).mockReturnValue(
        JSON.stringify({ transcripts: [{ id: 'VC-existing', patientId: 'P002', transcript: [], duration: 10, timestamp: '2025-01-01T00:00:00Z' }] })
      );
      (mockedFs.writeFileSync as jest.Mock).mockImplementation(() => undefined);

      saveConversation({
        patientId: 'P003',
        transcript: [],
        duration: 5,
        timestamp: '2026-02-01T00:00:00Z',
      });

      const writtenArg = (mockedFs.writeFileSync as jest.Mock).mock.calls[0][1] as string;
      const written = JSON.parse(writtenArg);
      expect(written.transcripts).toHaveLength(2);
      expect(written.transcripts[0].id).toBe('VC-existing');
    });

    it('should throw a friendly error if writing fails', () => {
      (mockedFs.existsSync as jest.Mock).mockReturnValue(false);
      (mockedFs.writeFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('disk full');
      });

      expect(() =>
        saveConversation({ patientId: 'P001', transcript: [], duration: 1, timestamp: 'x' })
      ).toThrow('Failed to save transcript');
    });
  });

  describe('getConversationsByPatient', () => {
    it('should return only conversations for the given patient', () => {
      (mockedFs.existsSync as jest.Mock).mockReturnValue(true);
      (mockedFs.readFileSync as jest.Mock).mockReturnValue(
        JSON.stringify({
          transcripts: [
            { id: 'VC-1', patientId: 'P001', transcript: [], duration: 1, timestamp: 't' },
            { id: 'VC-2', patientId: 'P002', transcript: [], duration: 1, timestamp: 't' },
          ],
        })
      );

      const result = getConversationsByPatient('P001');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('VC-1');
    });

    it('should return an empty array when the transcripts file does not exist', () => {
      (mockedFs.existsSync as jest.Mock).mockReturnValue(false);
      const result = getConversationsByPatient('P001');
      expect(result).toEqual([]);
    });

    it('should return an empty array and log an error if reading fails', () => {
      (mockedFs.existsSync as jest.Mock).mockReturnValue(true);
      (mockedFs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('read error');
      });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

      const result = getConversationsByPatient('P001');

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('getConversationById', () => {
    it('should return the matching conversation', () => {
      (mockedFs.existsSync as jest.Mock).mockReturnValue(true);
      (mockedFs.readFileSync as jest.Mock).mockReturnValue(
        JSON.stringify({ transcripts: [{ id: 'VC-1', patientId: 'P001', transcript: [], duration: 1, timestamp: 't' }] })
      );

      const result = getConversationById('VC-1');
      expect(result?.id).toBe('VC-1');
    });

    it('should return undefined when no conversation matches', () => {
      (mockedFs.existsSync as jest.Mock).mockReturnValue(true);
      (mockedFs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({ transcripts: [] }));

      const result = getConversationById('VC-missing');
      expect(result).toBeUndefined();
    });
  });

  describe('deleteConversation', () => {
    it('should delete an existing conversation and return true', () => {
      (mockedFs.existsSync as jest.Mock).mockReturnValue(true);
      (mockedFs.readFileSync as jest.Mock).mockReturnValue(
        JSON.stringify({ transcripts: [{ id: 'VC-1', patientId: 'P001', transcript: [], duration: 1, timestamp: 't' }] })
      );
      (mockedFs.writeFileSync as jest.Mock).mockImplementation(() => undefined);

      const result = deleteConversation('VC-1');

      expect(result).toBe(true);
      expect(mockedFs.writeFileSync).toHaveBeenCalledTimes(1);
    });

    it('should return false when the conversation does not exist', () => {
      (mockedFs.existsSync as jest.Mock).mockReturnValue(true);
      (mockedFs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({ transcripts: [] }));

      const result = deleteConversation('VC-missing');

      expect(result).toBe(false);
      expect(mockedFs.writeFileSync).not.toHaveBeenCalled();
    });
  });
});
