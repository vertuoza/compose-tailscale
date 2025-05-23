import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEnvironment, getEnvironments, deleteEnvironment, Environment, EnvironmentLog, getEnvironmentLogs, pollEnvironmentStatus } from '../services/api';
import AppLayout from '../components/layout/AppLayout';
import Button from '../components/common/Button';
import StatusBadge from '../components/common/StatusBadge';
import ServerLogsModal from '../components/common/ServerLogsModal';
import UpdateEnvironmentForm from '../components/environments/UpdateEnvironmentForm';

const EnvironmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [environment, setEnvironment] = useState<Environment | null>(null);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [logs, setLogs] = useState<EnvironmentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showServerLogs, setShowServerLogs] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const pollingRef = useRef<boolean>(false);

  // Function to refresh environment data and logs
  const refreshEnvironmentData = useCallback(async () => {
    if (!id) return;

    try {
      const [environmentData, logsData] = await Promise.all([
        getEnvironment(id),
        getEnvironmentLogs(id)
      ]);

      setEnvironment(environmentData);
      setLogs(logsData);
      setError(null);

      return environmentData;
    } catch (err) {
      console.error('Error refreshing environment data:', err);
      setError('Failed to refresh environment data.');
      return null;
    }
  }, [id]);

  // Function to start polling for status updates
  const startPolling = useCallback(async () => {
    if (!id || pollingRef.current) return;

    pollingRef.current = true;
    setIsPolling(true);

    try {
      console.log('Starting status polling for environment:', id);

      // Use the existing pollEnvironmentStatus function
      const updatedEnvironment = await pollEnvironmentStatus(id, 10000, 24); // Poll every 10s for max 4 minutes

      if (pollingRef.current) {
        setEnvironment(updatedEnvironment);

        // Refresh logs after status change
        const logsData = await getEnvironmentLogs(id);
        setLogs(logsData);

        console.log('Polling completed. Final status:', updatedEnvironment.status);
      }
    } catch (err) {
      console.error('Error during polling:', err);
      // Continue with manual refresh on error
      await refreshEnvironmentData();
    } finally {
      pollingRef.current = false;
      setIsPolling(false);
    }
  }, [id, refreshEnvironmentData]);

  // Function to stop polling
  const stopPolling = useCallback(() => {
    pollingRef.current = false;
    setIsPolling(false);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch all environments for the sidebar
        const allEnvironments = await getEnvironments();
        setEnvironments(allEnvironments);

        // Fetch the specific environment details
        if (id) {
          const environmentData = await getEnvironment(id);
          setEnvironment(environmentData);

          // Fetch logs for this environment
          setLogsLoading(true);
          const logsData = await getEnvironmentLogs(id);
          setLogs(logsData);
          setLogsLoading(false);
        }

        setError(null);
      } catch (err) {
        console.error('Error fetching environment details:', err);
        setError('Failed to load environment details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Effect to start polling when environment is in "creating" status
  useEffect(() => {
    if (environment && environment.status === 'creating' && !isPolling && !pollingRef.current) {
      startPolling();
    }
  }, [environment, isPolling, startPolling]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  const handleDelete = async () => {
    if (!environment) return;

    if (window.confirm(`Are you sure you want to delete environment ${environment.id}?`)) {
      try {
        await deleteEnvironment(environment.id);
        navigate('/');
      } catch (err) {
        console.error('Error deleting environment:', err);
        alert('Failed to delete environment. Please try again.');
      }
    }
  };

  const handleUpdateSuccess = (updatedEnvironment: Environment) => {
    setEnvironment(updatedEnvironment);
    setShowUpdateForm(false);
    // Refresh logs after update
    refreshEnvironmentData();
  };

  const handleUpdateCancel = () => {
    setShowUpdateForm(false);
  };

  return (
    <AppLayout
      title={environment ? `Environment: ${environment.id}` : 'Environment Details'}
      subtitle={
        environment
          ? environment.repositoryName
            ? `Repository: ${environment.repositoryName}, PR: #${environment.prNumber}`
            : `Demo Environment ${environment.id.split('-')[1]}`
          : 'Loading...'
      }
      environments={environments}
    >
      {error ? (
        <div className="bg-red-900 bg-opacity-20 border border-red-800 rounded p-4 text-linear-error">
          {error}
        </div>
      ) : loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-linear-accent"></div>
        </div>
      ) : environment ? (
        <div>
          {showUpdateForm ? (
            <div className="mb-6">
              <UpdateEnvironmentForm
                environment={environment}
                onSuccess={handleUpdateSuccess}
                onCancel={handleUpdateCancel}
              />
            </div>
          ) : (
            <div className="bg-linear-dark-lighter rounded-lg border border-linear-border p-6 mb-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-linear-text">{environment.id}</h2>
                  <div className="mt-2 text-linear-text-secondary">
                    {environment.repositoryName && (
                      <>
                        <p>Repository: {environment.repositoryName}</p>
                        <p>PR: #{environment.prNumber}</p>
                      </>
                    )}
                    <p>Environment Type: <span className="uppercase">{environment.environmentType || 'qa'}</span></p>
                    <p>Created: {new Date(environment.createdAt).toLocaleString()}</p>
                    <p>Updated: {new Date(environment.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <StatusBadge status={environment.status} />
                  {isPolling && environment.status === 'creating' && (
                    <div className="flex items-center mt-2 text-sm text-linear-text-secondary">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-linear-accent border-t-transparent mr-2"></div>
                      <span>Monitoring creation progress...</span>
                    </div>
                  )}
                </div>
              </div>

              {environment.url && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">Environment URL</h3>
                  <a
                    href={environment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-linear-accent hover:underline"
                  >
                    {environment.url}
                  </a>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Services</h3>
                {environment.services.length === 0 ? (
                  <p className="text-linear-text-secondary">No services configured</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {environment.services.map((service, index) => (
                      <div key={index} className="bg-linear-dark p-4 rounded border border-linear-border">
                        <h4 className="font-medium">{service.name}</h4>
                        <p className="text-linear-text-secondary text-sm mt-1">Image: {service.imageUrl}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="secondary"
                  onClick={refreshEnvironmentData}
                  disabled={isPolling}
                  icon={
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M23 4V10H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M1 20V14H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M3.51 9.00008C4.01717 7.56686 4.87913 6.28548 6.01547 5.27549C7.1518 4.2655 8.52547 3.55984 10.0083 3.22433C11.4911 2.88883 13.0348 2.93442 14.4952 3.35685C15.9556 3.77928 17.2853 4.56479 18.36 5.64008L23 10.0001M1 14.0001L5.64 18.3601C6.71475 19.4354 8.04437 20.2209 9.50481 20.6433C10.9652 21.0657 12.5089 21.1113 13.9917 20.7758C15.4745 20.4403 16.8482 19.7346 17.9845 18.7247C19.1209 17.7147 19.9828 16.4333 20.49 15.0001" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  }
                >
                  {isPolling ? 'Auto-refreshing...' : 'Refresh'}
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => setShowUpdateForm(true)}
                  disabled={isPolling || environment.status === 'creating'}
                  icon={
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M18.5 2.50023C18.8978 2.1024 19.4374 1.87891 20 1.87891C20.5626 1.87891 21.1022 2.1024 21.5 2.50023C21.8978 2.89805 22.1213 3.43762 22.1213 4.00023C22.1213 4.56284 21.8978 5.1024 21.5 5.50023L12 15.0002L8 16.0002L9 12.0002L18.5 2.50023Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  }
                >
                  Update Environment
                </Button>

                {environment.status === 'running' && (
                  <Button
                    variant="secondary"
                    onClick={() => setShowServerLogs(true)}
                  >
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Server Logs
                  </Button>
                )}

                <Button
                  variant="danger"
                  onClick={handleDelete}
                >
                  Delete Environment
                </Button>
              </div>

              {showServerLogs && environment && (
                <ServerLogsModal
                  environmentId={environment.id}
                  onClose={() => setShowServerLogs(false)}
                />
              )}
            </div>
          )}

          <div className="bg-linear-dark-lighter rounded-lg border border-linear-border p-6">
            <h3 className="text-lg font-medium mb-4">Environment Logs</h3>

            {logsLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-linear-accent"></div>
              </div>
            ) : logs.length === 0 ? (
              <p className="text-linear-text-secondary text-center py-8">No logs available</p>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-3 rounded border ${
                      log.status === 'success'
                        ? 'border-green-800 bg-green-900 bg-opacity-20'
                        : 'border-red-800 bg-red-900 bg-opacity-20'
                    }`}
                  >
                    <div className="flex justify-between text-sm text-linear-text-secondary mb-1">
                      <span>Action: {log.action}</span>
                      <span>{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                    <div className="text-linear-text">{log.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-linear-text-secondary">
          Environment not found
        </div>
      )}
    </AppLayout>
  );
};

export default EnvironmentDetailPage;
