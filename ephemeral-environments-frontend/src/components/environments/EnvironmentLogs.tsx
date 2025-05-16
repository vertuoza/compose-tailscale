import React, { useState, useEffect } from 'react';
import { getEnvironmentLogs, EnvironmentLog } from '../../services/api';
import Modal from '../common/Modal';

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
    <Modal title={`Logs: ${environmentId}`} onClose={onClose} maxWidth="max-w-3xl">
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
    </Modal>
  );
};

export default EnvironmentLogs;
