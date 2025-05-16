import React, { useState, useEffect } from 'react';
import { getServerLogs } from '../../services/api';
import Button from './Button';

interface ServerLogsModalProps {
  environmentId: string;
  onClose: () => void;
}

const ServerLogsModal: React.FC<ServerLogsModalProps> = ({ environmentId, onClose }) => {
  const [logs, setLogs] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const logsData = await getServerLogs(environmentId);
        setLogs(logsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching server logs:', err);
        setError('Failed to load server logs. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [environmentId]);

  // Handle click outside to close the modal
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if the backdrop itself was clicked, not its children
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-linear-dark-lighter rounded-lg border border-linear-border w-full max-w-4xl max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-linear-border flex justify-between items-center">
          <h2 className="text-xl font-semibold">Server Logs</h2>
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
          ) : logs ? (
            <pre className="font-mono text-sm whitespace-pre-wrap text-linear-text">{logs}</pre>
          ) : (
            <div className="text-linear-text-secondary p-4 text-center">No logs found</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServerLogsModal;
