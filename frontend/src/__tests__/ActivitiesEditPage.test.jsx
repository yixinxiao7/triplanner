import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ActivitiesEditPage from '../pages/ActivitiesEditPage';

vi.mock('../utils/api', () => ({
  api: {
    auth: { logout: vi.fn().mockResolvedValue({}) },
    trips: { get: vi.fn() },
    activities: {
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

const mockActivities = [
  {
    id: 'act-001',
    trip_id: 'trip-001',
    name: 'Tokyo Skytree',
    location: 'Sumida, Tokyo',
    activity_date: '2026-08-09',
    start_time: '10:00:00',
    end_time: '12:00:00',
    created_at: '2026-02-24T12:00:00.000Z',
    updated_at: '2026-02-24T12:00:00.000Z',
  },
  {
    id: 'act-002',
    trip_id: 'trip-001',
    name: 'Senso-ji Temple',
    location: 'Asakusa, Tokyo',
    activity_date: '2026-08-10',
    start_time: '09:00:00',
    end_time: '11:00:00',
    created_at: '2026-02-24T12:00:00.000Z',
    updated_at: '2026-02-24T12:00:00.000Z',
  },
];

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/trips/trip-001/edit/activities']}>
      <AuthContext.Provider value={mockAuthContext}>
        <Routes>
          <Route path="/trips/:id/edit/activities" element={<ActivitiesEditPage />} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe('ActivitiesEditPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.activities.list.mockResolvedValue({ data: { data: [] } });
  });

  it('renders the page title "edit activities"', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /edit activities/i })).toBeDefined();
  });

  it('renders the back link to trip details', () => {
    renderPage();
    const backLink = screen.getByRole('link', { name: /back to trip/i });
    expect(backLink).toBeDefined();
    expect(backLink.getAttribute('href')).toBe('/trips/trip-001');
  });

  it('renders "Save all" and "Cancel" buttons', async () => {
    renderPage();
    // Wait for loading to complete and buttons to render
    const saveButtons = await screen.findAllByRole('button', { name: /save all/i });
    expect(saveButtons.length).toBeGreaterThanOrEqual(1);
    const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
    expect(cancelButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('renders column headers: DATE, ACTIVITY NAME, LOCATION, START, END', () => {
    renderPage();
    expect(screen.getByText('DATE')).toBeDefined();
    expect(screen.getByText('ACTIVITY NAME')).toBeDefined();
    expect(screen.getByText('LOCATION')).toBeDefined();
    expect(screen.getByText('START')).toBeDefined();
    expect(screen.getByText('END')).toBeDefined();
  });

  it('shows add row button', async () => {
    renderPage();
    // Wait for loading to complete — the add button appears after data loads
    // Use getAllByText since the empty state subtext also mentions "+ add activity"
    const matches = await screen.findAllByText(/\+ add activity/i);
    const addBtn = matches.find((el) => el.tagName === 'BUTTON');
    expect(addBtn).toBeDefined();
  });

  it('shows loading skeletons initially while activities are being fetched', () => {
    api.activities.list.mockReturnValue(new Promise(() => {}));
    const { container } = renderPage();
    const skeletons = container.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows loaded activity rows after fetch', async () => {
    api.activities.list.mockResolvedValue({ data: { data: mockActivities } });
    renderPage();
    await screen.findByDisplayValue('Tokyo Skytree');
    expect(screen.getByDisplayValue('Senso-ji Temple')).toBeDefined();
  });

  it('shows activity dates for loaded activities', async () => {
    api.activities.list.mockResolvedValue({ data: { data: mockActivities } });
    renderPage();
    await screen.findByDisplayValue('2026-08-09');
    expect(screen.getByDisplayValue('2026-08-10')).toBeDefined();
  });

  it('adds a new empty row when add activity button is clicked', async () => {
    api.activities.list.mockResolvedValue({ data: { data: [] } });
    renderPage();

    // Wait for page to load
    await screen.findByRole('button', { name: /add activity/i });

    const addBtn = screen.getByRole('button', { name: /add activity/i });
    fireEvent.click(addBtn);

    // Should now have an input row for activity name
    const nameInputs = screen.getAllByLabelText(/activity name/i);
    expect(nameInputs.length).toBeGreaterThan(0);
  });
});
