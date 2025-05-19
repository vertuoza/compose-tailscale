import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEnvironment, getEnvironments, deleteEnvironment, Environment, EnvironmentLog, getEnvironmentLogs } from '../services/api';
import AppLayout from '../components/layout/AppLayout';
import Button from '../components/common/Button';
import StatusBadge from '../components/common/StatusBadge';
import ServerLogsModal from '../components/common/ServerLogsModal';

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

  return (
    <AppLayout
      title={environment ? `Environment: ${environment.id}` : 'Environment Details'}
      subtitle={environment ? `Repository: ${environment.repositoryName}, PR: #${environment.prNumber}` : 'Loading...'}
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
          <div className="bg-linear-dark-lighter rounded-lg border border-linear-border p-6 mb-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-linear-text">{environment.id}</h2>
                <div className="mt-2 text-linear-text-secondary">
                  <p>Repository: {environment.repositoryName}</p>
                  <p>PR: #{environment.prNumber}</p>
                  <p>Environment Type: <span className="uppercase">{environment.environmentType || 'qa'}</span></p>
                  <p>Created: {new Date(environment.createdAt).toLocaleString()}</p>
                  <p>Updated: {new Date(environment.updatedAt).toLocaleString()}</p>
                </div>
              </div>
              <StatusBadge status={environment.status} />
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
