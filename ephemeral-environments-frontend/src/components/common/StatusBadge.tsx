import React from 'react';

interface StatusBadgeProps {
  status: 'running' | 'error' | 'removed';
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const baseClasses = 'status-badge';
  const statusClasses = {
    running: 'status-running',
    error: 'status-error',
    removed: 'status-removed',
  };

  const classes = `${baseClasses} ${statusClasses[status]} ${className}`;

  return (
    <span className={classes}>
      {status}
    </span>
  );
};

export default StatusBadge;
