/**
 * API Test Suite
 * Tests all API functions in lib/api.ts
 */

import {
  APIError,
  getStories,
  getStoryById,
  getStoriesByTopic,
  getTopics,
  getSources,
  getProfile,
  updateProfile,
  getSavedStories,
  saveStory,
  unsaveStory,
  isStorySaved,
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  recordInteraction,
  getViewedStories,
  searchStories,
  getDailySummaryStories,
  getBlockedSources,
  getBlockedSourceIds,
  blockSource,
  unblockSource,
  getTopicSourceMapping,
} from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { ValidationError } from '@/lib/validators';

// Mock setup
jest.mock('@/lib/supabase');

// Valid UUIDs for testing
const validUUID = '123e4567-e89b-12d3-a456-426614174000';
const validUUID2 = '123e4567-e89b-12d3-a456-426614174001';

// Mock data
const mockStory = {
  id: validUUID,
  title_ar: 'عنوان الخبر',
  title_en: 'News Title',
  summary_ar: 'ملخص',
  summary_en: 'Summary',
  source: { id: validUUID2, name: 'Test Source' },
  topic_ids: [validUUID2],
  published_at: '2024-01-01T00:00:00Z',
};

const mockProfile = {
  id: validUUID,
  username: 'testuser',
  full_name: 'Test User',
  language: 'ar',
};

const mockTopic = {
  id: validUUID,
  name_ar: 'سياسة',
  name_en: 'Politics',
  slug: 'politics',
  is_active: true,
};

const mockSource = {
  id: validUUID,
  name: 'Test Source',
  url: 'https://test.com',
  is_active: true,
};

describe('APIError', () => {
  it('should create error with message, status, and code', () => {
    const error = new APIError('Test error', 404, 'NOT_FOUND');
    expect(error.message).toBe('Test error');
    expect(error.status).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.name).toBe('APIError');
  });

  it('should use defaults for status and code', () => {
    const error = new APIError('Test error');
    expect(error.status).toBe(500);
    expect(error.code).toBe('UNKNOWN_ERROR');
  });
});

describe('getStories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch stories with default parameters', async () => {
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      overlaps: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({ data: [mockStory], error: null }),
    };
    (supabase.from as jest.Mock).mockReturnValue(mockQuery);

    const result = await getStories();

    expect(supabase.from).toHaveBeenCalledWith('stories');
    expect(mockQuery.eq).toHaveBeenCalledWith('is_approved', true);
    expect(mockQuery.order).toHaveBeenCalledWith('published_at', { ascending: false });
    expect(mockQuery.range).toHaveBeenCalledWith(0, 19);
    expect(result).toEqual([mockStory]);
  });

  it('should filter by topicIds when provided', async () => {
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      overlaps: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({ data: [mockStory], error: null }),
    };
    (supabase.from as jest.Mock).mockReturnValue(mockQuery);

    await getStories(20, 0, [validUUID]);

    expect(mockQuery.overlaps).toHaveBeenCalledWith('topic_ids', [validUUID]);
  });

  it('should filter out blocked sources when provided', async () => {
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      overlaps: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({ data: [mockStory], error: null }),
    };
    (supabase.from as jest.Mock).mockReturnValue(mockQuery);

    await getStories(20, 0, undefined, [validUUID, validUUID2]);

    expect(mockQuery.not).toHaveBeenCalledWith('source_id', 'in', `(${validUUID},${validUUID2})`);
  });

  it('should throw APIError on database error', async () => {
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB Error', code: 'PGRST500' } }),
    };
    (supabase.from as jest.Mock).mockReturnValue(mockQuery);

    await expect(getStories()).rejects.toThrow(APIError);
  });

  it('should return empty array when no data', async () => {
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({ data: null, error: null }),
    };
    (supabase.from as jest.Mock).mockReturnValue(mockQuery);

    const result = await getStories();
    expect(result).toEqual([]);
  });
});

describe('getStoryById', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch story by ID', async () => {
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: mockStory, error: null }),
    };
    (supabase.from as jest.Mock).mockReturnValue(mockQuery);

    const result = await getStoryById(validUUID);

    expect(mockQuery.eq).toHaveBeenCalledWith('id', validUUID);
    expect(result).toEqual(mockStory);
  });

  it('should return null for not found', async () => {
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'Not found' } }),
    };
    (supabase.from as jest.Mock).mockReturnValue(mockQuery);

    const result = await getStoryById(validUUID);
    expect(result).toBeNull();
  });

  it('should throw ValidationError for invalid UUID', async () => {
    await expect(getStoryById('invalid')).rejects.toThrow(ValidationError);
  });
});

describe('getTopics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch active topics ordered by sort_order', async () => {
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [mockTopic], error: null }),
    };
    (supabase.from as jest.Mock).mockReturnValue(mockQuery);

    const result = await getTopics();

    expect(supabase.from).toHaveBeenCalledWith('topics');
    expect(mockQuery.eq).toHaveBeenCalledWith('is_active', true);
    expect(mockQuery.order).toHaveBeenCalledWith('sort_order');
    expect(result).toEqual([mockTopic]);
  });
});

describe('getSources', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch active sources ordered by name', async () => {
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [mockSource], error: null }),
    };
    (supabase.from as jest.Mock).mockReturnValue(mockQuery);

    const result = await getSources();

    expect(supabase.from).toHaveBeenCalledWith('sources');
    expect(mockQuery.eq).toHaveBeenCalledWith('is_active', true);
    expect(mockQuery.order).toHaveBeenCalledWith('name');
    expect(result).toEqual([mockSource]);
  });
});

describe('Profile API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should fetch profile by user ID', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await getProfile(validUUID);

      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(mockQuery.eq).toHaveBeenCalledWith('id', validUUID);
      expect(result).toEqual(mockProfile);
    });

    it('should return null for not found', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'Not found' } }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await getProfile(validUUID);
      expect(result).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should update profile with valid data', async () => {
      const updatedProfile = { ...mockProfile, username: 'newuser' };
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: updatedProfile, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await updateProfile(validUUID, { username: 'newuser' });

      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(result).toEqual(updatedProfile);
    });

    it('should throw ValidationError for invalid username', async () => {
      await expect(updateProfile(validUUID, { username: 'ab' })).rejects.toThrow(ValidationError);
    });
  });
});

describe('Saved Stories API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveStory', () => {
    it('should save a story', async () => {
      const savedStory = { id: validUUID, user_id: validUUID, story_id: validUUID2 };
      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: savedStory, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await saveStory(validUUID, validUUID2);

      expect(supabase.from).toHaveBeenCalledWith('saved_stories');
      expect(result).toEqual(savedStory);
    });

    it('should throw ALREADY_SAVED for duplicate', async () => {
      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: '23505', message: 'Duplicate' } }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      await expect(saveStory(validUUID, validUUID2)).rejects.toThrow('Story already saved');
    });
  });

  describe('unsaveStory', () => {
    it('should unsave a story', async () => {
      const mockQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      mockQuery.eq.mockReturnValueOnce(mockQuery).mockResolvedValueOnce({ error: null });
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      await expect(unsaveStory(validUUID, validUUID2)).resolves.not.toThrow();
    });
  });

  describe('isStorySaved', () => {
    it('should return true when saved', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      mockQuery.eq.mockReturnValueOnce(mockQuery).mockResolvedValueOnce({ count: 1, error: null });
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await isStorySaved(validUUID, validUUID2);
      expect(result).toBe(true);
    });

    it('should return false when not saved', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      mockQuery.eq.mockReturnValueOnce(mockQuery).mockResolvedValueOnce({ count: 0, error: null });
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await isStorySaved(validUUID, validUUID2);
      expect(result).toBe(false);
    });
  });
});

describe('Notes API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createNote', () => {
    it('should throw PREMIUM_REQUIRED for non-premium user', async () => {
      // Mock subscription check returning no premium
      const mockSubQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { plan: 'free', status: 'active' }, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockSubQuery);

      await expect(createNote(validUUID, validUUID2, 'Test note')).rejects.toThrow('صفحة+');
    });

    it('should throw EMPTY_CONTENT for empty note', async () => {
      // Mock subscription check returning premium
      const mockSubQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { plan: 'premium', status: 'active', current_period_end: '2099-01-01' },
          error: null
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockSubQuery);

      await expect(createNote(validUUID, validUUID2, '')).rejects.toThrow('empty');
    });
  });

  describe('updateNote', () => {
    it('should throw EMPTY_CONTENT for empty content', async () => {
      await expect(updateNote(validUUID, '')).rejects.toThrow('empty');
    });
  });

  describe('deleteNote', () => {
    it('should delete note by ID', async () => {
      const mockQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      await expect(deleteNote(validUUID)).resolves.not.toThrow();
      expect(supabase.from).toHaveBeenCalledWith('notes');
    });
  });
});

describe('Interactions API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('recordInteraction', () => {
    it('should record valid interaction', async () => {
      const mockQuery = {
        upsert: jest.fn().mockResolvedValue({ error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      await expect(recordInteraction(validUUID, validUUID2, 'view')).resolves.not.toThrow();
      expect(supabase.from).toHaveBeenCalledWith('user_story_interactions');
      expect(mockQuery.upsert).toHaveBeenCalledWith(
        {
          user_id: validUUID,
          story_id: validUUID2,
          interaction_type: 'view',
        },
        {
          onConflict: 'user_id,story_id,interaction_type',
          ignoreDuplicates: true,
        }
      );
    });

    it('should reject invalid interaction type', async () => {
      await expect(recordInteraction(validUUID, validUUID2, 'invalid' as any)).rejects.toThrow(ValidationError);
    });
  });
});

describe('Search API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchStories', () => {
    it('should search using RPC function', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValue({ data: [mockStory], error: null });
      const mockFromQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({ data: [mockStory], error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockFromQuery);

      const result = await searchStories('test query');

      expect(supabase.rpc).toHaveBeenCalledWith('search_stories_v2', {
        search_query: 'test query',
        result_limit: 20,
      });
      expect(result.length).toBeGreaterThan(0);
    });

    it('should throw ValidationError for empty query', async () => {
      await expect(searchStories('')).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for query > 200 chars', async () => {
      const longQuery = 'a'.repeat(201);
      await expect(searchStories(longQuery)).rejects.toThrow(ValidationError);
    });
  });
});

describe('Blocked Sources API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('blockSource', () => {
    it('should block a source', async () => {
      const blockedSource = { id: validUUID, user_id: validUUID, source_id: validUUID2 };
      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: blockedSource, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await blockSource(validUUID, validUUID2);

      expect(supabase.from).toHaveBeenCalledWith('blocked_sources');
      expect(result).toEqual(blockedSource);
    });

    it('should throw ALREADY_BLOCKED for duplicate', async () => {
      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: '23505', message: 'Duplicate' } }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      await expect(blockSource(validUUID, validUUID2)).rejects.toThrow('already blocked');
    });
  });

  describe('getBlockedSourceIds', () => {
    it('should return array of source IDs', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [{ source_id: validUUID }, { source_id: validUUID2 }],
          error: null
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await getBlockedSourceIds(validUUID);
      expect(result).toEqual([validUUID, validUUID2]);
    });
  });
});

describe('Topic Source Mapping API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTopicSourceMapping', () => {
    it('should fetch mapping via RPC', async () => {
      const mapping = [{ topic_id: validUUID, source_id: validUUID2 }];
      (supabase.rpc as jest.Mock).mockResolvedValue({ data: mapping, error: null });

      const result = await getTopicSourceMapping();

      expect(supabase.rpc).toHaveBeenCalledWith('get_topic_source_mapping');
      expect(result).toEqual(mapping);
    });

    it('should return empty array when function not available', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: null,
        error: { code: 'PGRST202', message: 'Function not found' }
      });

      const result = await getTopicSourceMapping();
      expect(result).toEqual([]);
    });
  });
});

describe('Daily Summary API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDailySummaryStories', () => {
    it('should fetch top stories with default limit', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        overlaps: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [mockStory], error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await getDailySummaryStories();

      expect(mockQuery.limit).toHaveBeenCalledWith(5);
      expect(result).toEqual([mockStory]);
    });

    it('should handle demo mode gracefully', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST205', message: 'Schema cache error' }
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await getDailySummaryStories();
      expect(result).toEqual([]);
    });
  });
});
