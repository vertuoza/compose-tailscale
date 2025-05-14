import React, { useState, useEffect } from 'react';
import { getEnvironmentLogs, EnvironmentLog } from '../../services/api';
import Button from '../common/Button';

interface EnvironmentLogsProps {
  environmentId: string;
  onClose: () => void;
}

const EnvironmentLogs: React.FC<EnvironmentLogsProps> = ({
  environmentId,
  onClose,
}) => {
  const [logs, setLogs] = useState<EnvironmentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const logsData = await getEnvironmentLogs(environmentId);
        setLogs(logsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching logs:', err);
        setError('Failed to load logs. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [environmentId]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-linear-dark-lighter rounded-lg border border-linear-border w-full max-w-3xl max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-linear-border flex justify-between items-center">
          <h2 className="text-xl font-semibold">Logs: {environmentId}</h2>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-linear-accent"></div>
            </div>
          ) : error ? (
            <div className="text-linear-error p-4 text-center">{error}</div>
          ) : logs.length === 0 ? (
            <div className="text-linear-text-secondary p-4 text-center">No logs found</div>
          ) : (
            <div className="space-y-2">
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
    </div>
  );
};

export default EnvironmentLogs;
