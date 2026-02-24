import styles from './StatusBadge.module.css';

const STATUS_CONFIG = {
  PLANNING: { label: 'PLANNING', className: 'planning' },
  ONGOING: { label: 'ONGOING', className: 'ongoing' },
  COMPLETED: { label: 'COMPLETED', className: 'completed' },
};

/**
 * StatusBadge — pill-shaped badge for trip status.
 */
export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PLANNING;
  return (
    <span className={`${styles.badge} ${styles[config.className]}`}>
      {config.label}
    </span>
  );
}
