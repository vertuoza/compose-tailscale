import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getEnvironments, deleteEnvironment, Environment } from '../services/api';
import AppLayout from '../components/layout/AppLayout';
import EnvironmentList from '../components/environments/EnvironmentList';
import Button from '../components/common/Button';

const ServicePage: React.FC = () => {
  const { serviceName } = useParams<{ serviceName: string }>();
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [filteredEnvironments, setFilteredEnvironments] = useState<Environment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEnvironments = async () => {
    try {
      setLoading(true);
      const data = await getEnvironments({ repository_name: serviceName });
      setEnvironments(data);
      setFilteredEnvironments(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching environments:', err);
      setError('Failed to load environments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (serviceName) {
      fetchEnvironments();
    }
  }, [serviceName]);

  const handleDelete = async (id: string) => {
    try {
      await deleteEnvironment(id);
      // Refresh the list after deletion
      fetchEnvironments();
    } catch (err) {
      console.error('Error deleting environment:', err);
      alert('Failed to delete environment. Please try again.');
    }
  };

  return (
    <AppLayout
      title={`${serviceName} Environments`}
      subtitle={`Manage environments for ${serviceName}`}
      environments={environments}
    >
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">{serviceName} Environments</h2>
          <p className="text-linear-text-secondary">
            {filteredEnvironments.length} environment{filteredEnvironments.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            onClick={fetchEnvironments}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {error ? (
        <div className="bg-red-900 bg-opacity-20 border border-red-800 rounded p-4 text-linear-error">
          {error}
        </div>
      ) : loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-linear-accent"></div>
        </div>
      ) : (
        <EnvironmentList
          environments={filteredEnvironments}
          onDelete={handleDelete}
          emptyMessage={`No environments found for ${serviceName}.`}
        />
      )}
    </AppLayout>
  );
};

export default ServicePage;
