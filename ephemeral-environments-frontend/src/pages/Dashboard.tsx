import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getEnvironments, Environment } from '../services/api';
import AppLayout from '../components/layout/AppLayout';
import EnvironmentList from '../components/environments/EnvironmentList';
import Button from '../components/common/Button';
import StatusFilterDropdown from '../components/common/StatusFilterDropdown';

const Dashboard: React.FC = () => {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilters, setStatusFilters] = useState<string[]>(['running', 'creating', 'deleting']); // Default to showing running, creating, and deleting environments

  const fetchEnvironments = useCallback(async () => {
    try {
      setLoading(true);

      if (statusFilters.length === 0) {
        // No filters selected, show empty list
        setEnvironments([]);
        setError(null);
        setLoading(false);
        return;
      }

      // Use comma-separated status values for efficient single API call
      const statusParam = statusFilters.join(',');
      const data = await getEnvironments({
        status: statusParam
      });

      setEnvironments(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching environments:', err);
      setError('Failed to load environments. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [statusFilters]);

  useEffect(() => {
    fetchEnvironments();
  }, [fetchEnvironments]);

  const handleDelete = async (id: string) => {
    // Just refresh the environments list to show updated status
    // The actual deletion is handled by the EnvironmentCard component
    fetchEnvironments();
  };

  return (
    <AppLayout
      title="Environments"
      subtitle="Manage your ephemeral environments"
      environments={environments}
    >
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <h2 className="text-xl font-medium text-linear-text">All Environments</h2>
            <div className="ml-3 bg-linear-dark-lighter px-2 py-0.5 rounded text-sm text-linear-text-secondary">
              {environments.length}
            </div>
          </div>

          <div className="flex space-x-3">
            <StatusFilterDropdown
              selectedStatuses={statusFilters}
              onStatusChange={setStatusFilters}
              disabled={loading}
            />

            <Button
              variant="secondary"
              size="sm"
              onClick={fetchEnvironments}
              disabled={loading}
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M23 4V10H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M1 20V14H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3.51 9.00008C4.01717 7.56686 4.87913 6.28548 6.01547 5.27549C7.1518 4.2655 8.52547 3.55984 10.0083 3.22433C11.4911 2.88883 13.0348 2.93442 14.4952 3.35685C15.9556 3.77928 17.2853 4.56479 18.36 5.64008L23 10.0001M1 14.0001L5.64 18.3601C6.71475 19.4354 8.04437 20.2209 9.50481 20.6433C10.9652 21.0657 12.5089 21.1113 13.9917 20.7758C15.4745 20.4403 16.8482 19.7346 17.9845 18.7247C19.1209 17.7147 19.9828 16.4333 20.49 15.0001" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>

            <Link to="/create">
              <Button
                variant="primary"
                size="sm"
                icon={
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                }
              >
                New Environment
              </Button>
            </Link>
          </div>
        </div>

        {error ? (
          <div className="bg-linear-red bg-opacity-10 border border-linear-red border-opacity-20 rounded-md p-4 text-linear-red mb-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div>
                <h4 className="font-medium">Error Loading Environments</h4>
                <p>{error}</p>
              </div>
            </div>
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-linear-accent border-t-transparent"></div>
              <p className="mt-3 text-linear-text-secondary text-sm">Loading environments...</p>
            </div>
          </div>
        ) : (
          <EnvironmentList
            environments={environments}
            onDelete={handleDelete}
            emptyMessage={
              <div className="text-center py-12">
                <svg className="w-12 h-12 mx-auto text-linear-text-secondary opacity-20 mb-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 9V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V9M21 9L12 3L3 9M21 9L12 15L3 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h3 className="text-lg font-medium text-linear-text mb-1">No environments found</h3>
                <p className="text-linear-text-secondary mb-4">Create a new environment to get started</p>
                <Link to="/create">
                  <Button variant="primary" size="md">
                    Create Environment
                  </Button>
                </Link>
              </div>
            }
          />
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
