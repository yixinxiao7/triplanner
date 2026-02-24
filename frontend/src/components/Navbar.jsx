import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import styles from './Navbar.module.css';

/**
 * Navbar — sticky top navigation bar shown on all authenticated pages.
 * NOT shown on /login or /register.
 */
export default function Navbar() {
  const { user, clearAuth } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await api.auth.logout();
    } catch {
      // Logout is best-effort; clear auth state regardless
    }
    clearAuth();
    navigate('/login', { replace: true });
  }

  return (
    <nav className={styles.navbar} aria-label="Main navigation">
      <div className={styles.inner}>
        {/* Left — Brand */}
        <Link to="/" className={styles.brand}>
          TRIPLANNER
        </Link>

        {/* Center — Nav links */}
        <div className={styles.navLinks}>
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
            }
            aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
          >
            home
          </NavLink>
        </div>

        {/* Right — User + Logout */}
        <div className={styles.rightSection}>
          {user?.name && (
            <span className={styles.username} title={user.name}>
              {user.name.length > 20
                ? `${user.name.slice(0, 20)}…`
                : user.name}
            </span>
          )}
          <button
            onClick={handleLogout}
            className={styles.logoutBtn}
            aria-label="Sign out"
          >
            sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
