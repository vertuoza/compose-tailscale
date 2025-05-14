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

const EnvironmentCard: React.FC<EnvironmentCardProps> = ({
  environment,
  onDelete,
  onViewLogs,
}) => {
  const { id, repositoryName, prNumber, status, url, createdAt } = environment;

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete environment ${id}?`)) {
      onDelete(id);
    }
  };

  return (
    <div className="bg-linear-dark-lighter rounded-lg border border-linear-border p-4 mb-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-medium text-linear-text">
            <Link to={`/environment/${id}`} className="hover:text-linear-accent">
              {id}
            </Link>
          </h3>
          <div className="mt-1 text-linear-text-secondary">
            <p>Repository: {repositoryName}</p>
            <p>PR: #{prNumber}</p>
            <p>Created: {new Date(createdAt).toLocaleString()}</p>
            {url && (
              <p className="mt-2">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-linear-accent hover:underline"
                >
                  {url}
                </a>
              </p>
            )}
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="mt-4 flex space-x-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onViewLogs(id)}
        >
          View Logs
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={handleDelete}
        >
          Delete
        </Button>
      </div>
    </div>
  );
};

export default EnvironmentCard;
