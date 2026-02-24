import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import TripCard, { TripCardSkeleton } from '../components/TripCard';
import CreateTripModal from '../components/CreateTripModal';
import Toast from '../components/Toast';
import { useTrips } from '../hooks/useTrips';
import styles from './HomePage.module.css';

export default function HomePage() {
  const navigate = useNavigate();
  const { trips, isLoading, error, fetchTrips, createTrip, deleteTrip } = useTrips();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  function openModal() {
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
  }

  async function handleCreateTrip(formData) {
    const newTrip = await createTrip(formData);
    // Navigate directly to the new trip's detail page
    navigate(`/trips/${newTrip.id}`);
  }

  async function handleDeleteTrip(tripId) {
    try {
      await deleteTrip(tripId);
    } catch {
      setToast('could not delete trip. please try again.');
      throw new Error('delete failed'); // Re-throw so TripCard can restore itself
    }
  }

  return (
    <>
      <Navbar />

      <main className={styles.main}>
        <div className={styles.container}>
          {/* Page Header */}
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>my trips</h1>
            <button
              className={styles.newTripBtn}
              onClick={openModal}
            >
              + new trip
            </button>
          </div>

          {/* Content Area */}
          {isLoading ? (
            /* Loading — skeleton cards */
            <div className={styles.grid}>
              <TripCardSkeleton />
              <TripCardSkeleton />
              <TripCardSkeleton />
            </div>
          ) : error ? (
            /* Error state */
            <div className={styles.errorState} role="status">
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                aria-hidden="true"
              >
                <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="M16 9v8M16 21v1"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <p className={styles.errorTitle}>could not load trips.</p>
              <p className={styles.errorSubtext}>check your connection and try again.</p>
              <button
                className={styles.retryBtn}
                onClick={fetchTrips}
              >
                try again
              </button>
            </div>
          ) : trips.length === 0 ? (
            /* Empty state */
            <div className={styles.emptyState}>
              <svg
                width="48"
                height="48"
                viewBox="0 0 48 48"
                fill="none"
                aria-hidden="true"
                style={{ color: 'var(--accent)', opacity: 0.4 }}
              >
                <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="M24 12v12M24 30l4-4M24 30l-4-4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="24" cy="24" r="3" fill="currentColor" />
              </svg>
              <h2 className={styles.emptyTitle}>no trips yet</h2>
              <p className={styles.emptySubtext}>start planning your first adventure.</p>
              <button
                className={styles.newTripBtn}
                onClick={openModal}
              >
                + plan your first trip
              </button>
            </div>
          ) : (
            /* Trip grid */
            <div className={styles.grid}>
              {trips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onDelete={handleDeleteTrip}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Trip Modal */}
      <CreateTripModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleCreateTrip}
      />

      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast}
          onDismiss={() => setToast(null)}
        />
      )}
    </>
  );
}
