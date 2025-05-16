import React, { useState, ReactNode } from 'react';
import { Environment } from '../../services/api';
import EnvironmentCard from './EnvironmentCard';
import EnvironmentLogs from './EnvironmentLogs';

interface EnvironmentListProps {
  environments: Environment[];
  onDelete: (id: string) => void;
  title?: string;
  emptyMessage?: ReactNode;
}

const EnvironmentList: React.FC<EnvironmentListProps> = ({
  environments,
  onDelete,
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
      {environments.length === 0 ? (
        <div className="bg-linear-dark-lighter rounded-lg border border-linear-border overflow-hidden">
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
