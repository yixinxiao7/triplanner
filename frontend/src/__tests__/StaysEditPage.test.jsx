import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import StaysEditPage from '../pages/StaysEditPage';

vi.mock('../utils/api', () => ({
  api: {
    auth: { logout: vi.fn().mockResolvedValue({}) },
    trips: { get: vi.fn() },
    stays: {
      list: vi.fn().mockResolvedValue({ data: { data: [] } }),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
  apiClient: {
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
  configureApiAuth: vi.fn(),
  default: {
    auth: { logout: vi.fn().mockResolvedValue({}) },
  },
}));

import { api } from '../utils/api';

const mockAuthContext = {
  user: { id: 'u1', name: 'Jane Doe', email: 'jane@test.com' },
  isAuthenticated: true,
  isAuthLoading: false,
  getAccessToken: vi.fn(() => 'mock-token'),
  setAccessToken: vi.fn(),
  handleAuthSuccess: vi.fn(),
  clearAuth: vi.fn(),
  initializeAuth: vi.fn(),
};

const mockStays = [
  {
    id: 'stay-001',
    trip_id: 'trip-001',
    category: 'AIRBNB',
    name: 'Cozy Shibuya Apartment',
    address: '1-2-3 Shibuya, Tokyo',
    check_in_at: '2026-08-08T15:00:00.000Z',
    check_in_tz: 'Asia/Tokyo',
    check_out_at: '2026-08-12T11:00:00.000Z',
    check_out_tz: 'Asia/Tokyo',
    created_at: '2026-02-24T12:00:00.000Z',
    updated_at: '2026-02-24T12:00:00.000Z',
  },
];

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/trips/trip-001/edit/stays']}>
      <AuthContext.Provider value={mockAuthContext}>
        <Routes>
          <Route path="/trips/:id/edit/stays" element={<StaysEditPage />} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe('StaysEditPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.stays.list.mockResolvedValue({ data: { data: [] } });
  });

  it('renders the page title "edit stays"', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /edit stays/i })).toBeDefined();
  });

  it('renders the back link to trip details', () => {
    renderPage();
    const backLink = screen.getByRole('link', { name: /back to trip/i });
    expect(backLink).toBeDefined();
    expect(backLink.getAttribute('href')).toBe('/trips/trip-001');
  });

  it('renders the "done editing" button', () => {
    renderPage();
    const buttons = screen.getAllByRole('button', { name: /done editing/i });
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it('shows the "add a stay" form section heading', () => {
    renderPage();
    expect(screen.getByText(/add a stay/i)).toBeDefined();
  });

  it('shows empty state when no stays exist', async () => {
    api.stays.list.mockResolvedValue({ data: { data: [] } });
    renderPage();
    await screen.findByText('no stays added yet.');
  });

  it('shows loaded stays after fetch', async () => {
    api.stays.list.mockResolvedValue({ data: { data: mockStays } });
    renderPage();
    await screen.findByText('Cozy Shibuya Apartment');
  });

  it('shows category badge for loaded stays', async () => {
    api.stays.list.mockResolvedValue({ data: { data: mockStays } });
    renderPage();
    await screen.findByText('AIRBNB');
  });

  it('shows address for loaded stays', async () => {
    api.stays.list.mockResolvedValue({ data: { data: mockStays } });
    renderPage();
    await screen.findByText('1-2-3 Shibuya, Tokyo');
  });

  it('shows loading skeletons initially while stays are being fetched', () => {
    api.stays.list.mockReturnValue(new Promise(() => {}));
    const { container } = renderPage();
    const skeletons = container.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders the category dropdown in the form', () => {
    renderPage();
    expect(screen.getByLabelText(/category/i)).toBeDefined();
  });

  it('renders name and address fields in the form', () => {
    renderPage();
    expect(screen.getByLabelText(/^name$/i)).toBeDefined();
    expect(screen.getByLabelText(/^address$/i)).toBeDefined();
  });

  it('renders check-in and check-out date fields in the form', () => {
    renderPage();
    expect(screen.getByLabelText(/check-in date/i)).toBeDefined();
    expect(screen.getByLabelText(/check-out date/i)).toBeDefined();
  });

  it('renders save stay submit button', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /save stay/i })).toBeDefined();
  });
});
