import React, { useState, useEffect } from 'react';
import { getServerLogs } from '../../services/api';
import Modal from './Modal';

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

  return (
    <Modal title="Server Logs" onClose={onClose}>
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
    </Modal>
  );
};

export default ServerLogsModal;
