export const mockSupabaseClient = {
  storage: {
    from: jest.fn().mockReturnValue({
      upload: jest.fn().mockResolvedValue({ data: { path: 'test-video.mp4' }, error: null }),
      getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://test-url.com/video.mp4' } }),
      remove: jest.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
  from: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({ data: [], error: null }),
  }),
};

export const supabase = mockSupabaseClient; 