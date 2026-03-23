import db from '../config/database.js';

/**
 * Deduplicate a destinations array using case-insensitive comparison.
 * Preserves the original casing of the first occurrence of each destination.
 * Preserves the original order of first occurrences.
 *
 * T-058 / B-023 — Defense-in-depth measure ensuring data integrity regardless
 * of which client sends the request (frontend already does client-side dedup).
 *
 * @param {string[]} destinations - Array of trimmed destination strings
 * @returns {string[]} Deduplicated array with first-occurrence casing preserved
 */
export function deduplicateDestinations(destinations) {
  if (!Array.isArray(destinations)) return destinations;
  const seen = new Set();
  return destinations.filter(dest => {
    const lower = dest.toLowerCase();
    if (seen.has(lower)) return false;
    seen.add(lower);
    return true;
  });
}

/**
 * Trip column selection.
 *
 * start_date / end_date — T-163 (Sprint 16) + T-229 (Sprint 28):
 *   Resolved at read time with the following priority:
 *     1. User-provided value stored in trips.start_date / trips.end_date (highest priority).
 *     2. Computed MIN/MAX date across all event tables for the trip (fallback when stored
 *        value is NULL — i.e., the user has not explicitly set a date).
 *
 *   T-229 fix: Wraps the LEAST()/GREATEST() sub-resource aggregate in
 *   COALESCE(trips.start_date, LEAST(...)) so that a value explicitly saved by the user
 *   via PATCH /trips/:id is always returned as-is, regardless of what sub-resource dates
 *   are attached to the trip. When trips.start_date IS NULL, the aggregate is used instead,
 *   preserving the original Sprint 16 behaviour for trips with no explicit date set.
 *
 *   Event sources for the aggregate fallback:
 *     flights     — DATE(departure_at), DATE(arrival_at)
 *     stays       — DATE(check_in_at),  DATE(check_out_at)
 *     activities  — activity_date
 *     land_travels — departure_date, arrival_date
 *
 *   PostgreSQL LEAST()/GREATEST() ignore individual NULL arguments and return NULL
 *   only when ALL inputs are NULL (i.e., the trip has no events at all).
 *   Dates are returned as YYYY-MM-DD strings via TO_CHAR on the outer COALESCE result.
 *
 *   No schema migration is required — these are pure read-time computations.
 */
const TRIP_COLUMNS = [
  'id',
  'user_id',
  'name',
  'destinations',
  'status',
  'notes',   // T-103 — nullable trip notes/description field (max 2000 chars)
  db.raw(`
    TO_CHAR(
      COALESCE(
        trips.start_date,
        LEAST(
          (SELECT MIN(DATE(departure_at)) FROM flights      WHERE trip_id = trips.id),
          (SELECT MIN(DATE(arrival_at))   FROM flights      WHERE trip_id = trips.id),
          (SELECT MIN(DATE(check_in_at))  FROM stays        WHERE trip_id = trips.id),
          (SELECT MIN(DATE(check_out_at)) FROM stays        WHERE trip_id = trips.id),
          (SELECT MIN(activity_date)      FROM activities   WHERE trip_id = trips.id),
          (SELECT MIN(departure_date)     FROM land_travels WHERE trip_id = trips.id),
          (SELECT MIN(arrival_date)       FROM land_travels WHERE trip_id = trips.id)
        )
      ),
      'YYYY-MM-DD'
    ) AS start_date
  `),
  db.raw(`
    TO_CHAR(
      COALESCE(
        trips.end_date,
        GREATEST(
          (SELECT MAX(DATE(departure_at)) FROM flights      WHERE trip_id = trips.id),
          (SELECT MAX(DATE(arrival_at))   FROM flights      WHERE trip_id = trips.id),
          (SELECT MAX(DATE(check_in_at))  FROM stays        WHERE trip_id = trips.id),
          (SELECT MAX(DATE(check_out_at)) FROM stays        WHERE trip_id = trips.id),
          (SELECT MAX(activity_date)      FROM activities   WHERE trip_id = trips.id),
          (SELECT MAX(departure_date)     FROM land_travels WHERE trip_id = trips.id),
          (SELECT MAX(arrival_date)       FROM land_travels WHERE trip_id = trips.id)
        )
      ),
      'YYYY-MM-DD'
    ) AS end_date
  `),
  'created_at',
  'updated_at',
];

/**
 * Return the trip row unchanged.
 *
 * T-238 (Sprint 30) — Removed the date-based auto-compute override.
 *
 * Previously (T-030, Sprint 3), this function rewrote `trip.status` with a value
 * derived from start_date / end_date whenever both were set. That caused a bug
 * (FB-130): PATCH /trips/:id with { status: "ONGOING" } on a trip with future dates
 * returned "PLANNING" instead of "ONGOING" because the re-fetch called this function,
 * which silently overrode the value just written to the DB.
 *
 * Status is now ALWAYS the stored DB value. The user controls status explicitly
 * through PATCH /trips/:id. The frontend TripStatusSelector is the authoritative
 * mechanism for status changes.
 *
 * The function is kept (rather than inlined) so that callers (findTripById,
 * listTripsByUser) require no structural changes and the function remains
 * unit-testable.
 *
 * @param {Object|undefined} trip - raw trip row from DB
 * @returns {Object|undefined} trip unchanged
 */
export function computeTripStatus(trip) {
  return trip;
}

/**
 * Valid sort fields and their SQL mapping for GET /trips query (T-072).
 */
const VALID_SORT_BY = ['name', 'created_at', 'start_date'];
const VALID_SORT_ORDER = ['asc', 'desc'];
const VALID_STATUS_FILTER = ['PLANNING', 'ONGOING', 'COMPLETED'];

/**
 * List all trips for a user, with optional search, status filter, and sort.
 * Status is computed dynamically via computeTripStatus (T-030).
 *
 * T-072 — Search, filter, and sort query parameters:
 *   - search: case-insensitive partial match on name OR any destination (ILIKE)
 *   - status: filter by computed trip status (post-query filtering)
 *   - sort_by: name | created_at | start_date (default: created_at)
 *   - sort_order: asc | desc (default: desc)
 *
 * When status filter is active, all matching rows are fetched, status computed,
 * filtered, then paginated in JS. When status filter is NOT active, pagination
 * is applied at the SQL level for efficiency.
 *
 * @param {string} userId
 * @param {Object} options
 * @param {number} [options.page=1] - 1-indexed page number
 * @param {number} [options.limit=20] - results per page
 * @param {string} [options.search] - search term for name/destinations
 * @param {string} [options.status] - computed status filter
 * @param {string} [options.sortBy='created_at'] - sort field
 * @param {string} [options.sortOrder='desc'] - sort direction
 * @returns {Promise<{ trips: Array, total: number }>}
 */
export async function listTripsByUser(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    search,
    status,
    sortBy = 'created_at',
    sortOrder = 'desc',
  } = options;

  const offset = (page - 1) * limit;

  // ---- Build sort clause ----
  let orderByClause;
  if (sortBy === 'name') {
    // Case-insensitive alphabetical sort
    orderByClause = { column: db.raw('LOWER(name)'), order: sortOrder };
  } else if (sortBy === 'start_date') {
    // NULLS LAST in both asc and desc directions
    orderByClause = db.raw(`start_date ${sortOrder === 'asc' ? 'ASC' : 'DESC'} NULLS LAST`);
  } else {
    // Default: created_at
    orderByClause = { column: 'created_at', order: sortOrder };
  }

  // ---- Build base query (user-scoped + optional search) ----
  function applyBaseFilters(query) {
    query.where({ user_id: userId });

    if (search && search.trim()) {
      // T-085 / B-033 / FB-062: Escape ILIKE special characters before interpolation.
      // Without escaping, a user searching for "%" would match ALL trips (SQL wildcard),
      // and "_" would match any single character. We use "!" as the ESCAPE character
      // (a single literal char, safe with standard_conforming_strings=on since PG 9.1).
      //
      // Escaping order matters: escape "!" first to avoid double-escaping.
      //   ! → !!   (the escape char itself)
      //   % → !%   (SQL wildcard)
      //   _ → !_   (SQL single-char wildcard)
      const escaped = search
        .trim()
        .replace(/!/g, '!!')  // Escape the escape char first
        .replace(/%/g, '!%')  // Escape percent wildcard
        .replace(/_/g, '!_'); // Escape underscore single-char wildcard

      const searchTerm = `%${escaped}%`;
      query.where(function () {
        this.whereRaw("name ILIKE ? ESCAPE '!'", [searchTerm])
          .orWhereRaw("array_to_string(destinations, ',') ILIKE ? ESCAPE '!'", [searchTerm]);
      });
    }

    return query;
  }

  // ---- When status filter is active: post-query filtering ----
  if (status) {
    // Fetch ALL matching rows (no LIMIT/OFFSET) for status post-filtering
    let query = db('trips').select(TRIP_COLUMNS);
    applyBaseFilters(query);

    if (sortBy === 'start_date') {
      query.orderByRaw(`start_date ${sortOrder === 'asc' ? 'ASC' : 'DESC'} NULLS LAST`);
    } else if (sortBy === 'name') {
      query.orderByRaw(`LOWER(name) ${sortOrder === 'asc' ? 'ASC' : 'DESC'}`);
    } else {
      query.orderBy(sortBy, sortOrder);
    }

    const allTrips = await query;

    // Apply computed status and filter
    const filtered = allTrips
      .map(computeTripStatus)
      .filter((trip) => trip.status === status);

    const total = filtered.length;
    const trips = filtered.slice(offset, offset + limit);

    return { trips, total };
  }

  // ---- No status filter: SQL-level pagination (efficient) ----

  // Count query
  const countQuery = db('trips').count('id as count');
  applyBaseFilters(countQuery);
  const [{ count }] = await countQuery;
  const total = parseInt(count, 10);

  // Data query with sort + pagination
  let dataQuery = db('trips').select(TRIP_COLUMNS);
  applyBaseFilters(dataQuery);

  if (sortBy === 'start_date') {
    dataQuery.orderByRaw(`start_date ${sortOrder === 'asc' ? 'ASC' : 'DESC'} NULLS LAST`);
  } else if (sortBy === 'name') {
    dataQuery.orderByRaw(`LOWER(name) ${sortOrder === 'asc' ? 'ASC' : 'DESC'}`);
  } else {
    dataQuery.orderBy(sortBy, sortOrder);
  }

  dataQuery.limit(limit).offset(offset);

  const trips = await dataQuery;

  return { trips: trips.map(computeTripStatus), total };
}

/** Exported for validation in route handler (T-072) */
export { VALID_SORT_BY, VALID_SORT_ORDER, VALID_STATUS_FILTER };

/**
 * Find a trip by ID.
 * Status is computed dynamically via computeTripStatus (T-030).
 * @param {string} id - UUID
 * @returns {Promise<Object|undefined>}
 */
export async function findTripById(id) {
  const trip = await db('trips')
    .where({ id })
    .select(TRIP_COLUMNS)
    .first();

  return computeTripStatus(trip);
}

/**
 * Create a new trip.
 * After inserting, re-queries via findTripById to get properly formatted date fields
 * (via TO_CHAR) and computed status (T-030).
 * @param {Object} data - { user_id, name, destinations, start_date?, end_date? }
 * @returns {Promise<Object>}
 */
export async function createTrip(data) {
  const insertData = {
    user_id: data.user_id,
    name: data.name,
    destinations: deduplicateDestinations(data.destinations),
  };

  // start_date and end_date are optional nullable fields (T-029)
  if (data.start_date !== undefined) {
    insertData.start_date = data.start_date ?? null;
  }
  if (data.end_date !== undefined) {
    insertData.end_date = data.end_date ?? null;
  }

  // notes is an optional nullable text field (T-103)
  if (data.notes !== undefined) {
    insertData.notes = data.notes ?? null;
  }

  const [{ id }] = await db('trips').insert(insertData).returning('id');

  // Re-query to get formatted date fields and computed status
  return findTripById(id);
}

/**
 * Update a trip by ID.
 * After updating, re-queries via findTripById to get formatted date fields
 * (via TO_CHAR) and computed status (T-030).
 * @param {string} id
 * @param {Object} updates - partial { name, destinations, status, start_date, end_date }
 * @returns {Promise<Object>}
 */
export async function updateTrip(id, updates) {
  // Apply destination deduplication when destinations are being updated (T-058)
  const processedUpdates = { ...updates };
  if (processedUpdates.destinations !== undefined && Array.isArray(processedUpdates.destinations)) {
    processedUpdates.destinations = deduplicateDestinations(processedUpdates.destinations);
  }

  await db('trips')
    .where({ id })
    .update({ ...processedUpdates, updated_at: new Date() });

  // Re-query to get formatted date fields and computed status
  return findTripById(id);
}

/**
 * Delete a trip by ID.
 * @param {string} id
 * @returns {Promise<number>} - rows deleted
 */
export async function deleteTrip(id) {
  return db('trips').where({ id }).delete();
}
