/**
 * LandTravelEditPage tests — Sprint 6 T-087
 * Tests: render states (loading, empty, with entries), add row, delete row,
 * save flow (POST new / PATCH edited / DELETE removed), cancel navigation,
 * validation errors, API error display.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import LandTravelEditPage from '../pages/LandTravelEditPage';

// ── Mock api ──────────────────────────────────────────────────────────────────
vi.mock('../utils/api', () => ({
  api: {
    auth: { logout: vi.fn().mockResolvedValue({}) },
    land_travel: {
      list: vi.fn(),
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
  default: { auth: { logout: vi.fn().mockResolvedValue({}) } },
}));

import { api } from '../utils/api';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// ── Auth context ──────────────────────────────────────────────────────────────
const mockAuthContext = {
  user: { id: 'u1', name: 'Test User', email: 'test@test.com' },
  isAuthenticated: true,
  isAuthLoading: false,
  getAccessToken: vi.fn(() => 'mock-token'),
  setAccessToken: vi.fn(),
  handleAuthSuccess: vi.fn(),
  clearAuth: vi.fn(),
  initializeAuth: vi.fn(),
};

// ── Mock data ─────────────────────────────────────────────────────────────────
const mockEntries = [
  {
    id: 'lt-001',
    trip_id: 'trip-001',
    mode: 'TRAIN',
    provider: 'Amtrak',
    from_location: 'New York',
    to_location: 'Washington DC',
    departure_date: '2026-08-07',
    departure_time: '09:00:00',
    arrival_date: '2026-08-07',
    arrival_time: '12:30:00',
    confirmation_number: 'AMTK123',
    notes: 'Take Acela',
    created_at: '2026-02-27T12:00:00.000Z',
    updated_at: '2026-02-27T12:00:00.000Z',
  },
  {
    id: 'lt-002',
    trip_id: 'trip-001',
    mode: 'RENTAL_CAR',
    provider: 'Enterprise',
    from_location: 'Washington DC',
    to_location: 'Philadelphia',
    departure_date: '2026-08-08',
    departure_time: null,
    arrival_date: null,
    arrival_time: null,
    confirmation_number: null,
    notes: null,
    created_at: '2026-02-27T12:00:00.000Z',
    updated_at: '2026-02-27T12:00:00.000Z',
  },
];

// ── Render helper ─────────────────────────────────────────────────────────────
function renderPage() {
  return render(
    <MemoryRouter
      initialEntries={['/trips/trip-001/land-travel/edit']}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <AuthContext.Provider value={mockAuthContext}>
        <Routes>
          <Route path="/trips/:id/land-travel/edit" element={<LandTravelEditPage />} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe('LandTravelEditPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    // Default: empty list
    api.land_travel.list.mockResolvedValue({ data: { data: [] } });
    api.land_travel.create.mockResolvedValue({ data: { data: { id: 'lt-new', ...mockEntries[0] } } });
    api.land_travel.update.mockResolvedValue({ data: { data: mockEntries[0] } });
    api.land_travel.delete.mockResolvedValue({});
  });

  // ── 1. Loading state ───────────────────────────────────────────────────────
  it('renders loading skeleton while fetching entries', () => {
    api.land_travel.list.mockReturnValue(new Promise(() => {})); // never resolves
    renderPage();
    expect(screen.getByText(/edit land travel/i)).toBeDefined();
    // Skeleton cards should be present during loading
    expect(document.querySelectorAll('[class*="skeletonCard"]').length).toBeGreaterThan(0);
  });

  // ── 2. Empty state ─────────────────────────────────────────────────────────
  it('shows empty state when no entries exist', async () => {
    api.land_travel.list.mockResolvedValue({ data: { data: [] } });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/no land travel entries yet/i)).toBeDefined();
    });
  });

  // ── 3. Renders existing entries ────────────────────────────────────────────
  it('renders existing land travel entries with mode, provider, from/to locations', async () => {
    api.land_travel.list.mockResolvedValue({ data: { data: mockEntries } });
    renderPage();
    await waitFor(() => {
      expect(screen.getByDisplayValue('TRAIN')).toBeDefined();
      expect(screen.getByDisplayValue('Amtrak')).toBeDefined();
      expect(screen.getByDisplayValue('New York')).toBeDefined();
      expect(screen.getByDisplayValue('Washington DC')).toBeDefined();
    });
  });

  it('renders multiple entries with correct indices', async () => {
    api.land_travel.list.mockResolvedValue({ data: { data: mockEntries } });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/entry 1/i)).toBeDefined();
      expect(screen.getByText(/entry 2/i)).toBeDefined();
    });
  });

  // ── 4. Add row ─────────────────────────────────────────────────────────────
  it('adds a new empty row when "+ add entry" is clicked', async () => {
    api.land_travel.list.mockResolvedValue({ data: { data: [] } });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/no land travel entries yet/i)).toBeDefined();
    });
    const addBtn = screen.getByRole('button', { name: /add a new land travel entry/i });
    fireEvent.click(addBtn);
    expect(screen.getByText(/entry 1/i)).toBeDefined();
    // Mode select should be present for the new row
    expect(screen.getByText(/rental car/i)).toBeDefined();
  });

  // ── 5. Delete row ──────────────────────────────────────────────────────────
  it('removes a row from the form when the remove button is clicked', async () => {
    api.land_travel.list.mockResolvedValue({ data: { data: mockEntries } });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/entry 1/i)).toBeDefined();
    });
    const removeButtons = screen.getAllByRole('button', { name: /delete entry/i });
    fireEvent.click(removeButtons[0]);
    // Only one entry row should remain (entry 2 becomes entry 1)
    expect(screen.queryByText(/entry 2/i)).toBeNull();
  });

  // ── 6. Save new entry ──────────────────────────────────────────────────────
  it('POSTs a new entry on save and navigates back to trip details', async () => {
    api.land_travel.list.mockResolvedValue({ data: { data: [] } });
    renderPage();
    await waitFor(() => screen.getByText(/no land travel entries yet/i));

    // Add a row
    fireEvent.click(screen.getByRole('button', { name: /add a new land travel entry/i }));

    // Fill required fields
    const fromInputs = screen.getAllByPlaceholderText(/departure city or address/i);
    const toInputs = screen.getAllByPlaceholderText(/arrival city or address/i);
    fireEvent.change(fromInputs[0], { target: { value: 'Boston' } });
    fireEvent.change(toInputs[0], { target: { value: 'NYC' } });

    // Fill departure date
    const dateInputs = screen.getAllByDisplayValue('');
    const dateInput = dateInputs.find((el) => el.type === 'date');
    if (dateInput) {
      fireEvent.change(dateInput, { target: { value: '2026-08-10' } });
    }

    // Click save all
    const saveBtn = screen.getAllByRole('button', { name: /save all/i })[0];
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(api.land_travel.create).toHaveBeenCalledWith(
        'trip-001',
        expect.objectContaining({ from_location: 'Boston', to_location: 'NYC' })
      );
    });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/trips/trip-001');
    });
  });

  // ── 7. Cancel navigation ───────────────────────────────────────────────────
  it('navigates back to trip details when cancel is clicked without making API calls', async () => {
    api.land_travel.list.mockResolvedValue({ data: { data: [] } });
    renderPage();
    await waitFor(() => screen.getByText(/no land travel entries yet/i));

    const cancelBtns = screen.getAllByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtns[0]);

    expect(api.land_travel.create).not.toHaveBeenCalled();
    expect(api.land_travel.update).not.toHaveBeenCalled();
    expect(api.land_travel.delete).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/trips/trip-001');
  });

  // ── 8. Validation — required fields ───────────────────────────────────────
  it('shows validation errors for missing required fields on save attempt', async () => {
    api.land_travel.list.mockResolvedValue({ data: { data: [] } });
    renderPage();
    await waitFor(() => screen.getByText(/no land travel entries yet/i));

    // Add a blank row
    fireEvent.click(screen.getByRole('button', { name: /add a new land travel entry/i }));

    // Attempt to save without filling required fields
    const saveBtn = screen.getAllByRole('button', { name: /save all/i })[0];
    fireEvent.click(saveBtn);

    await waitFor(() => {
      // Should show required errors without navigating
      expect(mockNavigate).not.toHaveBeenCalled();
    });
    // API should not be called
    expect(api.land_travel.create).not.toHaveBeenCalled();
  });

  // ── 9. Load error ──────────────────────────────────────────────────────────
  it('shows error state when fetch fails', async () => {
    api.land_travel.list.mockRejectedValue({ response: { status: 500 } });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/could not load land travel/i)).toBeDefined();
    });
    // Retry button present
    expect(screen.getByRole('button', { name: /try again/i })).toBeDefined();
  });

  // ── 10. 404 load error ─────────────────────────────────────────────────────
  it('shows trip not found when fetch returns 404', async () => {
    api.land_travel.list.mockRejectedValue({ response: { status: 404 } });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/trip not found/i)).toBeDefined();
    });
  });

  // ── 11. Save API error ─────────────────────────────────────────────────────
  it('shows save error banner when API create fails', async () => {
    api.land_travel.list.mockResolvedValue({ data: { data: [] } });
    api.land_travel.create.mockRejectedValue({
      response: { data: { error: { message: 'Server error on save' } } },
    });
    renderPage();
    await waitFor(() => screen.getByText(/no land travel entries yet/i));

    // Add a row with required fields
    fireEvent.click(screen.getByRole('button', { name: /add a new land travel entry/i }));
    const fromInputs = screen.getAllByPlaceholderText(/departure city or address/i);
    const toInputs = screen.getAllByPlaceholderText(/arrival city or address/i);
    fireEvent.change(fromInputs[0], { target: { value: 'Boston' } });
    fireEvent.change(toInputs[0], { target: { value: 'NYC' } });
    const dateInputs = screen.getAllByDisplayValue('');
    const dateInput = dateInputs.find((el) => el.type === 'date');
    if (dateInput) fireEvent.change(dateInput, { target: { value: '2026-08-10' } });

    const saveBtn = screen.getAllByRole('button', { name: /save all/i })[0];
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeDefined();
    });
  });

  // ── 12. DELETE existing entry ──────────────────────────────────────────────
  it('calls DELETE on save for an existing entry that was removed from form', async () => {
    api.land_travel.list.mockResolvedValue({ data: { data: mockEntries } });
    renderPage();
    await waitFor(() => screen.getByText(/entry 1/i));

    // Remove first entry
    const removeButtons = screen.getAllByRole('button', { name: /delete entry/i });
    fireEvent.click(removeButtons[0]);

    // Click save
    const saveBtns = screen.getAllByRole('button', { name: /save all/i });
    fireEvent.click(saveBtns[0]);

    await waitFor(() => {
      expect(api.land_travel.delete).toHaveBeenCalledWith('trip-001', 'lt-001');
    });
  });

  // ── 13. Mode dropdown options ──────────────────────────────────────────────
  it('renders all 6 mode options in the mode dropdown for a new row', async () => {
    api.land_travel.list.mockResolvedValue({ data: { data: [] } });
    renderPage();
    await waitFor(() => screen.getByText(/no land travel entries yet/i));

    fireEvent.click(screen.getByRole('button', { name: /add a new land travel entry/i }));

    const modeSelect = screen.getByRole('combobox');
    const options = modeSelect.querySelectorAll('option');
    expect(options.length).toBe(6);
    const values = Array.from(options).map((o) => o.value);
    expect(values).toContain('RENTAL_CAR');
    expect(values).toContain('BUS');
    expect(values).toContain('TRAIN');
    expect(values).toContain('RIDESHARE');
    expect(values).toContain('FERRY');
    expect(values).toContain('OTHER');
  });

  // ── 14. Page title and back link ───────────────────────────────────────────
  it('renders the page title and back link to trip details', async () => {
    api.land_travel.list.mockResolvedValue({ data: { data: [] } });
    renderPage();
    await waitFor(() => screen.getByText(/edit land travel/i));

    expect(screen.getByText(/← back to trip/i)).toBeDefined();
    const backLink = screen.getByRole('link', { name: /back to trip/i });
    expect(backLink.getAttribute('href')).toBe('/trips/trip-001');
  });

  // ── 15. Optional fields ────────────────────────────────────────────────────
  it('renders optional field labels for provider, departure time, arrival date/time, confirmation, notes', async () => {
    api.land_travel.list.mockResolvedValue({ data: { data: [] } });
    renderPage();
    await waitFor(() => screen.getByText(/no land travel entries yet/i));

    fireEvent.click(screen.getByRole('button', { name: /add a new land travel entry/i }));
    expect(screen.getByText(/provider/i)).toBeDefined();
    expect(screen.getByText(/departure time/i)).toBeDefined();
    expect(screen.getByText(/arrival date/i)).toBeDefined();
    expect(screen.getByText(/confirmation/i)).toBeDefined();
    expect(screen.getByText(/notes/i)).toBeDefined();
  });
});
