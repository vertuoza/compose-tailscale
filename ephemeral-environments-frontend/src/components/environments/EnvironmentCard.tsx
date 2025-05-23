import React from 'react';
import { Link } from 'react-router-dom';
import { Environment } from '../../services/api';
import StatusBadge from '../common/StatusBadge';
import Button from '../common/Button';

interface EnvironmentCardProps {
  environment: Environment;
  onDelete: (id: string) => void;
  onViewLogs: (id: string) => void;
}

// Function to generate a color based on repository name
const repoToColor = (repo: string) => {
  const colors = [
    'linear-blue',
    'linear-purple',
    'linear-green',
    'linear-yellow',
    'linear-orange',
    'linear-red',
  ];

  let hash = 0;
  for (let i = 0; i < repo.length; i++) {
    hash = repo.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
};

const EnvironmentCard: React.FC<EnvironmentCardProps> = ({
  environment,
  onDelete,
  onViewLogs,
}) => {
  const { id, repositoryName, prNumber, status, url, createdAt, environmentType = 'qa' } = environment;
  // For DEMO environments, use a default color
  const colorClass = repositoryName
    ? `text-${repoToColor(repositoryName)}`
    : 'text-linear-purple';

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete environment ${id}?`)) {
      onDelete(id);
    }
  };

  // Format the date to be more like Linear's format
  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Today at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="card hover:border-linear-border-hover transition-all duration-200 mb-3 group">
      <div className="p-4">
        <div className="flex items-center mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center">
              <h3 className="text-base font-medium text-linear-text truncate">
                <Link to={`/environment/${id}`} className="hover:text-linear-accent">
                  {repositoryName || `Demo Environment ${id.split('-')[1]}`}
                </Link>
              </h3>
              <div className="ml-2 flex-shrink-0">
                <StatusBadge status={status} />
              </div>
            </div>

            <div className="flex items-center text-sm text-linear-text-secondary mt-0.5">
              {prNumber ? (
                <>
                  <span className="truncate">PR #{prNumber}</span>
                  <span className="mx-1.5 text-linear-text-secondary opacity-40">•</span>
                </>
              ) : null}
              <span className="whitespace-nowrap">{formatDate(createdAt)}</span>
              <span className="mx-1.5 text-linear-text-secondary opacity-40">•</span>
              <span className="uppercase text-xs bg-linear-dark-lighter px-1.5 py-0.5 rounded">
                {environmentType}
              </span>
            </div>
          </div>
        </div>

        {url && (
          <div className="mt-2 text-sm">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-linear-accent hover:underline truncate block"
            >
              {url}
            </a>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-linear-text-secondary">
            ID: <span className="font-mono" title={id}>{id}</span>
          </div>

          <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onViewLogs(id)}
            >
              <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Logs
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
            >
              <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnvironmentCard;
