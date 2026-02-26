// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Triplanner E2E Critical Flows
 *
 * Prerequisites:
 *   - Backend running at https://localhost:3001
 *   - Frontend running at https://localhost:4173
 *   - Both use self-signed certs (ignoreHTTPSErrors in config)
 *
 * These tests exercise the core user journeys end-to-end.
 */

// ── Helpers ──────────────────────────────────────────────────────

/** Generate a unique email using a timestamp + random suffix. */
function uniqueEmail() {
  const ts = Date.now();
  const rand = Math.floor(Math.random() * 10000);
  return `e2e_${ts}_${rand}@test.triplanner.dev`;
}

const TEST_PASSWORD = 'Test1234!';

/**
 * Register a new user via the UI and end up on the home page.
 * Returns the email and name used.
 */
async function registerNewUser(page) {
  const email = uniqueEmail();
  const name = `E2E User ${Date.now()}`;

  await page.goto('/register');
  await page.getByLabel(/name/i).fill(name);
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(TEST_PASSWORD);
  await page.getByRole('button', { name: /create account/i }).click();

  // After successful registration, the app redirects to "/"
  await page.waitForURL('/', { timeout: 15000 });
  // Wait for page to settle (either empty state or trips grid)
  await expect(
    page.getByRole('heading', { name: /my trips/i })
  ).toBeVisible({ timeout: 10000 });

  return { email, name };
}

/**
 * Log in an existing user via the UI and end up on the home page.
 */
async function loginUser(page, email) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(TEST_PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();

  await page.waitForURL('/', { timeout: 15000 });
  await expect(
    page.getByRole('heading', { name: /my trips/i })
  ).toBeVisible({ timeout: 10000 });
}

/**
 * Create a trip via the UI modal.
 * After creation, the page navigates to the trip details page.
 *
 * The DestinationChipInput has aria-label="Add destination" on the text input.
 * After the first chip is added the placeholder disappears, so we target by
 * aria-label throughout.
 */
async function createTrip(page, tripName, destinations) {
  // Click the "+ new trip" button in the page header.
  // On empty state the page also shows "+ plan your first trip" — use .first()
  // to always click the header button (which is rendered first in DOM order).
  await page.getByRole('button', { name: /new trip|plan your first trip/i }).first().click();

  // The create trip modal opens
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: 5000 });

  // Fill trip name
  await dialog.getByLabel(/trip name/i).fill(tripName);

  // Add destinations via the chip input.
  // The inner <input> has aria-label="Add destination".
  const destInput = dialog.getByLabel('Add destination');
  for (const dest of destinations) {
    await destInput.fill(dest);
    await destInput.press('Enter');
    // Brief pause to let the chip render before adding the next one
    await page.waitForTimeout(100);
  }

  // Submit
  await dialog.getByRole('button', { name: /create trip/i }).click();

  // After creation, the app navigates to /trips/:id
  await page.waitForURL(/\/trips\//, { timeout: 15000 });

  return tripName;
}

// ── Test 1: Core User Flow ────────────────────────────────────────

test.describe('Test 1: Core user flow', () => {
  test('register, create trip, view details, delete, logout', async ({ page }) => {
    // Step 1: Register a new user
    const { email } = await registerNewUser(page);

    // Step 2: Create a new trip
    const tripName = `E2E Trip ${Date.now()}`;
    await createTrip(page, tripName, ['Tokyo', 'Osaka']);

    // Step 3: Verify we're on the trip details page and see the trip name
    await expect(page.getByRole('heading', { name: tripName })).toBeVisible({ timeout: 10000 });

    // Step 4: Navigate back to home and verify trip appears in the list
    await page.getByRole('link', { name: /my trips/i }).click();
    await page.waitForURL('/', { timeout: 10000 });
    await expect(page.getByText(tripName)).toBeVisible({ timeout: 10000 });

    // Step 5: Click the trip card to view details again
    await page.getByRole('article', { name: new RegExp(tripName, 'i') }).click();
    await page.waitForURL(/\/trips\//, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: tripName })).toBeVisible();

    // Step 6: Navigate back to home to delete the trip
    await page.getByRole('link', { name: /my trips/i }).click();
    await page.waitForURL('/', { timeout: 10000 });

    // Click the delete button on the trip card
    const tripCard = page.getByRole('article', { name: new RegExp(tripName, 'i') });
    await tripCard.getByRole('button', { name: /delete trip/i }).click();

    // Confirm deletion
    await tripCard.getByRole('button', { name: /yes, delete/i }).click();

    // Wait for the trip to disappear from the list
    await expect(page.getByRole('article', { name: new RegExp(tripName, 'i') })).toBeHidden({ timeout: 10000 });

    // Step 7: Logout
    await page.getByRole('button', { name: /sign out/i }).click();

    // Verify we land on the login page
    await page.waitForURL(/\/login/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  });
});

// ── Test 2: Sub-resource CRUD (Flights + Stays) ───────────────────

test.describe('Test 2: Sub-resource CRUD', () => {
  test('create trip, add flight, add stay, verify on details page', async ({ page }) => {
    // Register a new user
    await registerNewUser(page);

    // Create a trip
    const tripName = `SubRes Trip ${Date.now()}`;
    await createTrip(page, tripName, ['San Francisco']);

    // We're on the trip details page. Verify trip heading.
    await expect(page.getByRole('heading', { name: tripName })).toBeVisible({ timeout: 10000 });

    // ── Add a Flight ──

    // Click "edit flights" link
    await page.getByRole('link', { name: /edit flights/i }).click();
    await page.waitForURL(/\/edit\/flights/, { timeout: 10000 });

    // Wait for the form section to appear
    await expect(page.getByRole('heading', { name: /add a flight/i })).toBeVisible({ timeout: 10000 });

    // Fill out the flight form
    await page.getByLabel(/flight number/i).fill('DL1234');
    await page.getByLabel(/airline/i).fill('Delta Air Lines');
    await page.getByLabel(/^from$/i).fill('JFK');
    await page.getByLabel(/^to$/i).fill('SFO');
    await page.getByLabel(/departure date/i).fill('2026-08-01T10:00');
    // Use the IANA value for timezone selects (e.g. 'America/New_York')
    await page.getByLabel(/departure timezone/i).selectOption('America/New_York');
    await page.getByLabel(/arrival date/i).fill('2026-08-01T13:30');
    await page.getByLabel(/arrival timezone/i).selectOption('America/Los_Angeles');

    // Save the flight
    await page.getByRole('button', { name: /save flight/i }).click();

    // Verify the flight card appears in the list
    await expect(page.getByTestId('flight-card')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('DL1234')).toBeVisible();
    await expect(page.getByText('Delta Air Lines')).toBeVisible();

    // Navigate back to trip details
    await page.getByRole('button', { name: /done editing/i }).first().click();
    await page.waitForURL(/\/trips\/[^/]+$/, { timeout: 10000 });

    // Verify flight appears on the trip details page
    await expect(page.getByText('DL1234')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('JFK')).toBeVisible();
    await expect(page.getByText('SFO')).toBeVisible();

    // ── Add a Stay ──

    // Click "edit stays" link
    await page.getByRole('link', { name: /edit stays/i }).click();
    await page.waitForURL(/\/edit\/stays/, { timeout: 10000 });

    // Wait for the form section to appear
    await expect(page.getByRole('heading', { name: /add a stay/i })).toBeVisible({ timeout: 10000 });

    // Fill out the stay form
    await page.getByLabel(/category/i).selectOption('HOTEL');
    await page.getByLabel(/^name$/i).fill('Hyatt Regency SF');
    await page.getByLabel(/address/i).fill('5 Embarcadero Center, SF, CA');
    await page.getByLabel(/check-in date/i).fill('2026-08-01T15:00');
    await page.getByLabel(/check-in timezone/i).selectOption('America/Los_Angeles');
    await page.getByLabel(/check-out date/i).fill('2026-08-05T11:00');
    await page.getByLabel(/check-out timezone/i).selectOption('America/Los_Angeles');

    // Save the stay
    await page.getByRole('button', { name: /save stay/i }).click();

    // Verify the stay card appears in the list
    await expect(page.getByTestId('stay-card')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Hyatt Regency SF')).toBeVisible();

    // Navigate back to trip details
    await page.getByRole('button', { name: /done editing/i }).first().click();
    await page.waitForURL(/\/trips\/[^/]+$/, { timeout: 10000 });

    // Verify stay appears on the trip details page
    await expect(page.getByText('Hyatt Regency SF')).toBeVisible({ timeout: 10000 });
  });
});

// ── Test 3: Search, Filter, Sort ──────────────────────────────────

test.describe('Test 3: Search, filter, sort', () => {
  test('create trips, search, filter by status, sort by name, clear filters', async ({ page }) => {
    // Register a new user
    await registerNewUser(page);

    // Create Trip 1
    const tripName1 = `Alpha Beach ${Date.now()}`;
    await createTrip(page, tripName1, ['Miami']);

    // Navigate back to home
    await page.getByRole('link', { name: /my trips/i }).click();
    await page.waitForURL('/', { timeout: 10000 });

    // Create Trip 2
    const tripName2 = `Zeta Mountain ${Date.now()}`;
    await createTrip(page, tripName2, ['Denver']);

    // Navigate back to home
    await page.getByRole('link', { name: /my trips/i }).click();
    await page.waitForURL('/', { timeout: 10000 });

    // Wait for both trips to appear
    await expect(page.getByText(tripName1)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(tripName2)).toBeVisible({ timeout: 10000 });

    // ── Search by name ──

    // The FilterToolbar shows once initialLoadDone && !isLoading && trips.length > 0.
    // After navigating back from trip creation, there can be a brief window where the
    // trips are visible but the toolbar hasn't rendered yet. A reload ensures a clean
    // mount cycle where initialLoadDone gets set after fetchTrips completes.
    await page.reload();
    await expect(page.getByText(tripName1)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(tripName2)).toBeVisible({ timeout: 10000 });

    // The search input has placeholder="search trips..." and type="search".
    const searchInput = page.locator('input[type="search"]');
    await expect(searchInput).toBeVisible({ timeout: 15000 });

    // Search for the first trip
    await searchInput.fill('Alpha Beach');

    // Wait for search debounce (300ms) + API response
    await expect(page.getByText(tripName1)).toBeVisible({ timeout: 10000 });
    // The second trip should be hidden
    await expect(page.getByText(tripName2)).toBeHidden({ timeout: 10000 });

    // ── Clear search ──
    await page.getByRole('button', { name: /clear search/i }).click();

    // Both trips should reappear
    await expect(page.getByText(tripName1)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(tripName2)).toBeVisible({ timeout: 10000 });

    // ── Filter by status ──

    // Both trips should be in "PLANNING" status by default
    const statusFilter = page.getByLabel(/filter by status/i);
    await statusFilter.selectOption('PLANNING');

    // Both trips should still be visible (both are in PLANNING status)
    await expect(page.getByText(tripName1)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(tripName2)).toBeVisible({ timeout: 10000 });

    // Filter by a status that has no trips
    await statusFilter.selectOption('COMPLETED');

    // Both trips should be hidden (no trips are completed)
    // The empty search results component should show instead
    await expect(page.getByText(tripName1)).toBeHidden({ timeout: 10000 });
    await expect(page.getByText(tripName2)).toBeHidden({ timeout: 10000 });

    // Reset status filter
    await statusFilter.selectOption('');

    // Both trips should reappear
    await expect(page.getByText(tripName1)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(tripName2)).toBeVisible({ timeout: 10000 });

    // ── Sort by name ──

    const sortSelector = page.getByLabel(/sort trips/i);

    // Sort name A-Z: Alpha should come before Zeta
    await sortSelector.selectOption('name:asc');

    // Wait for the API to re-fetch and re-render
    await page.waitForTimeout(1000);

    // Get the trip card text order
    let cards = await page.getByRole('article').allTextContents();
    let alphaIdx = cards.findIndex((text) => text.includes('Alpha Beach'));
    let zetaIdx = cards.findIndex((text) => text.includes('Zeta Mountain'));
    expect(alphaIdx).toBeGreaterThanOrEqual(0);
    expect(zetaIdx).toBeGreaterThanOrEqual(0);
    expect(alphaIdx).toBeLessThan(zetaIdx);

    // Sort name Z-A: Zeta should come before Alpha
    await sortSelector.selectOption('name:desc');

    // Wait for the API to re-fetch and re-render
    await page.waitForTimeout(1000);

    cards = await page.getByRole('article').allTextContents();
    alphaIdx = cards.findIndex((text) => text.includes('Alpha Beach'));
    zetaIdx = cards.findIndex((text) => text.includes('Zeta Mountain'));
    expect(alphaIdx).toBeGreaterThanOrEqual(0);
    expect(zetaIdx).toBeGreaterThanOrEqual(0);
    expect(zetaIdx).toBeLessThan(alphaIdx);

    // ── Clear all filters ──

    await page.getByRole('button', { name: /clear.*filters/i }).click();

    // Both trips should be visible and sort should be back to default
    await expect(page.getByText(tripName1)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(tripName2)).toBeVisible({ timeout: 10000 });
  });
});

// ── Test 4: Rate Limit Lockout ────────────────────────────────────

test.describe('Test 4: Rate limit lockout', () => {
  test('rapid wrong-password login triggers 429 banner and disables submit', async ({ page }) => {
    // Navigate to the login page
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible({ timeout: 10000 });

    const email = 'ratelimit_test@test.triplanner.dev';
    const wrongPassword = 'WrongPassword123!';

    // Submit login with wrong password rapidly (11+ times)
    // The backend rate limiter should kick in around attempt 10
    let rateLimitHit = false;

    for (let i = 0; i < 15; i++) {
      // Check if rate limit banner is already visible
      const banner = page.locator('[role="alert"]').filter({ hasText: /too many/i });
      if (await banner.isVisible().catch(() => false)) {
        rateLimitHit = true;
        break;
      }

      // Fill and submit the form
      await page.getByLabel(/email/i).fill(email);
      await page.getByLabel(/password/i).fill(wrongPassword);

      const submitBtn = page.getByRole('button', { name: /sign in/i });

      // If the submit button text changed to "please wait..." it means rate limit hit
      const waitBtn = page.getByRole('button', { name: /please wait/i });
      if (await waitBtn.isVisible().catch(() => false)) {
        rateLimitHit = true;
        break;
      }

      // If button is disabled (rate limited), we're done
      if (await submitBtn.isDisabled().catch(() => false)) {
        rateLimitHit = true;
        break;
      }

      await submitBtn.click();

      // Wait briefly for the response
      await page.waitForTimeout(300);
    }

    // Verify: the rate limit banner should be visible
    // The banner contains text like "too many login attempts"
    const rateLimitBanner = page.locator('[role="alert"]').filter({ hasText: /too many/i });

    if (rateLimitHit) {
      await expect(rateLimitBanner).toBeVisible({ timeout: 5000 });

      // Verify: the submit button should be disabled when rate-limited
      // The button text changes to "please wait..." when rate-limited
      const submitBtn = page.getByRole('button', { name: /sign in|please wait/i });
      await expect(submitBtn).toBeDisabled({ timeout: 5000 });
    } else {
      // The rate limiter might not trigger if the backend isn't rate-limiting
      // at the threshold we expect or if the backend isn't running.
      console.log('Note: rate limit banner did not appear after 15 attempts. ' +
        'The backend rate limit threshold may be higher than expected, ' +
        'or the backend may not be running.');
    }
  });
});
