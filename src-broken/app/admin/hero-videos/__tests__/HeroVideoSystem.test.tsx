import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import HeroVideosPage from '../page';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

interface VideoData {
  id?: number;
  title?: string;
  description?: string;
  videoUrl?: string;
  slot?: number;
  createdAt?: string;
  updatedAt?: string;
}

const mockVideos = [
  {
    id: 1,
    title: 'Existing Video',
    description: 'A video in slot 1',
    videoUrl: 'https://test-url.com/existing.mp4',
    slot: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Mock the fetch API
const server = setupServer(
  // GET /api/hero-videos
  http.get('/api/hero-videos', () => {
    return HttpResponse.json([]);
  }),

  // POST /api/hero-videos
  http.post('/api/hero-videos', async ({ request }) => {
    const data = await request.json() as VideoData;
    if (!data?.title || !data?.description) {
      return HttpResponse.json(
        { error: 'Validation failed', details: [{ path: ['title'], message: 'Title is required' }] },
        { status: 400 }
      );
    }
    const response: VideoData = {
      id: 1,
      title: data.title,
      description: data.description,
      videoUrl: data.videoUrl,
      slot: data.slot,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return HttpResponse.json(response);
  }),

  // PUT /api/hero-videos
  http.put('/api/hero-videos', async ({ request }) => {
    const data = await request.json() as VideoData;
    if (!data?.id) {
      return HttpResponse.json({ error: 'Invalid video ID' }, { status: 400 });
    }
    const response: VideoData = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    return HttpResponse.json(response);
  }),

  // DELETE /api/hero-videos
  http.delete('/api/hero-videos', async ({ request }) => {
    const data = await request.json() as VideoData;
    if (!data?.id) {
      return HttpResponse.json({ error: 'Invalid video ID' }, { status: 400 });
    }
    return HttpResponse.json({ success: true });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Hero Video System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // By default, mock slot 1 as occupied so other slots are available
    server.use(
      http.get('/api/hero-videos', () => {
        return HttpResponse.json(mockVideos);
      })
    );
  });

  it('renders empty state', async () => {
    // For this test, mock all slots as empty
    server.use(
      http.get('/api/hero-videos', () => {
        return HttpResponse.json([]);
      })
    );
    render(<HeroVideosPage />);
    expect(screen.getByText('Manage Hero Videos')).toBeInTheDocument();
    expect(screen.getAllByText('No Video')).toHaveLength(3);
    expect(screen.getAllByText('This slot is available')).toHaveLength(3);
    expect(screen.getAllByText('Add Video')).toHaveLength(3);
  });

  it('opens modal when Add Video button is clicked', async () => {
    render(<HeroVideosPage />);
    const addButtons = screen.getAllByText('Add Video');
    const enabledButton = addButtons.find(btn => !btn.hasAttribute('disabled'));
    if (!enabledButton) throw new Error('No enabled Add Video button found');
    fireEvent.click(enabledButton);
    expect(screen.getByText('Add Hero Video')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Video File')).toBeInTheDocument();
    expect(screen.getByLabelText('Slot')).toBeInTheDocument();
  });

  it('validates required fields when saving', async () => {
    render(<HeroVideosPage />);
    const addButtons = screen.getAllByText('Add Video');
    const enabledButton = addButtons.find(btn => !btn.hasAttribute('disabled'));
    if (!enabledButton) throw new Error('No enabled Add Video button found');
    fireEvent.click(enabledButton);
    const saveButton = screen.getByText('Save');
    await userEvent.click(saveButton);
    expect(screen.getByText('Title is required')).toBeInTheDocument();
    expect(screen.getByText('Description is required')).toBeInTheDocument();
    expect(screen.getByText('Video file is required')).toBeInTheDocument();
  });

  it('validates file size when uploading', async () => {
    render(<HeroVideosPage />);
    const addButtons = screen.getAllByText('Add Video');
    const enabledButton = addButtons.find(btn => !btn.hasAttribute('disabled'));
    if (!enabledButton) throw new Error('No enabled Add Video button found');
    fireEvent.click(enabledButton);
    const file = new File(['x'.repeat(100 * 1024 * 1024 + 1)], 'large-video.mp4', { type: 'video/mp4' });
    const fileInput = screen.getByLabelText('Video File');
    await userEvent.upload(fileInput, file);
    expect(screen.getByText('File size must be less than 100MB')).toBeInTheDocument();
  });

  it('successfully creates a video', async () => {
    const mockVideo = {
      id: 1,
      title: 'Test Video',
      description: 'Test Description',
      videoUrl: 'https://test-url.com/video.mp4',
      slot: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    server.use(
      http.post('/api/hero-videos', async () => {
        return HttpResponse.json(mockVideo);
      })
    );
    render(<HeroVideosPage />);
    const addButtons = screen.getAllByText('Add Video');
    const enabledButton = addButtons.find(btn => !btn.hasAttribute('disabled'));
    if (!enabledButton) throw new Error('No enabled Add Video button found');
    fireEvent.click(enabledButton);
    await userEvent.type(screen.getByLabelText('Title'), 'Test Video');
    await userEvent.type(screen.getByLabelText('Description'), 'Test Description');
    const file = new File(['test'], 'test-video.mp4', { type: 'video/mp4' });
    const fileInput = screen.getByLabelText('Video File');
    await userEvent.upload(fileInput, file);
    const saveButton = screen.getByText('Save');
    await userEvent.click(saveButton);
    await waitFor(() => {
      expect(screen.getByText('Video added successfully')).toBeInTheDocument();
    });
  });

  it('handles slot conflicts', async () => {
    server.use(
      http.post('/api/hero-videos', async () => {
        return HttpResponse.json(
          { error: 'Slot conflict', details: [{ path: ['slot'], message: 'This slot is already occupied' }] },
          { status: 400 }
        );
      })
    );
    render(<HeroVideosPage />);
    const addButtons = screen.getAllByText('Add Video');
    const enabledButton = addButtons.find(btn => !btn.hasAttribute('disabled'));
    if (!enabledButton) throw new Error('No enabled Add Video button found');
    fireEvent.click(enabledButton);
    await userEvent.type(screen.getByLabelText('Title'), 'Test Video');
    await userEvent.type(screen.getByLabelText('Description'), 'Test Description');
    const file = new File(['test'], 'test-video.mp4', { type: 'video/mp4' });
    const fileInput = screen.getByLabelText('Video File');
    await userEvent.upload(fileInput, file);
    const saveButton = screen.getByText('Save');
    await userEvent.click(saveButton);
    await waitFor(() => {
      expect(screen.getByText('This slot is already occupied')).toBeInTheDocument();
    });
  });

  it('deletes a video', async () => {
    const mockVideo = {
      id: 1,
      title: 'Test Video',
      description: 'Test Description',
      videoUrl: 'https://test-url.com/video.mp4',
      slot: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    server.use(
      http.get('/api/hero-videos', () => {
        return HttpResponse.json([mockVideo]);
      }),
      http.delete('/api/hero-videos', async () => {
        return HttpResponse.json({ success: true });
      })
    );
    render(<HeroVideosPage />);
    await waitFor(() => {
      expect(screen.getByText('Test Video')).toBeInTheDocument();
    });
    // Find the delete button for the video (assuming only one video is present)
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await userEvent.click(deleteButton);
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await userEvent.click(confirmButton);
    await waitFor(() => {
      expect(screen.getByText('Video deleted successfully')).toBeInTheDocument();
    });
  });
}); 