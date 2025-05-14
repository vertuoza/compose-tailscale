import React, { useState } from 'react';
import { Environment } from '../../services/api';
import EnvironmentCard from './EnvironmentCard';
import EnvironmentLogs from './EnvironmentLogs';

interface EnvironmentListProps {
  environments: Environment[];
  onDelete: (id: string) => void;
  title?: string;
  emptyMessage?: string;
}

const EnvironmentList: React.FC<EnvironmentListProps> = ({
  environments,
  onDelete,
  title = 'Environments',
  emptyMessage = 'No environments found',
}) => {
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string | null>(null);

  const handleViewLogs = (id: string) => {
    setSelectedEnvironmentId(id);
  };

  const handleCloseLogs = () => {
    setSelectedEnvironmentId(null);
  };

  return (
    <div>
      {title && (
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
      )}

      {environments.length === 0 ? (
        <div className="bg-linear-dark-lighter rounded-lg border border-linear-border p-8 text-center text-linear-text-secondary">
          {emptyMessage}
        </div>
      ) : (
        <div>
          {environments.map((environment) => (
            <EnvironmentCard
              key={environment.id}
              environment={environment}
              onDelete={onDelete}
              onViewLogs={handleViewLogs}
            />
          ))}
        </div>
      )}

      {selectedEnvironmentId && (
        <EnvironmentLogs
          environmentId={selectedEnvironmentId}
          onClose={handleCloseLogs}
        />
      )}
    </div>
  );
};

export default EnvironmentList;
