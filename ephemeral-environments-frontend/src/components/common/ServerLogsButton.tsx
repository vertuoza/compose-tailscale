import React, { useState } from 'react';
import { Environment } from '../../services/api';
import ServerLogsModal from './ServerLogsModal';

interface ServerLogsButtonProps {
  environments: Environment[];
}

const ServerLogsButton: React.FC<ServerLogsButtonProps> = ({ environments }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string | null>(null);

  // Get the first running environment, if any
  const runningEnvironment = environments.find(env => env.status === 'running');

  const handleClick = () => {
    if (runningEnvironment) {
      setSelectedEnvironmentId(runningEnvironment.id);
      setShowModal(true);
    } else {
      alert('No running environments found to show logs for.');
    }
  };

  return (
    <>
      <div
        className="flex items-center text-sm text-linear-text-secondary px-2 py-1.5 cursor-pointer hover:bg-linear-dark-lighter rounded"
        onClick={handleClick}
      >
        <svg className="w-4 h-4 mr-2 opacity-60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Server Logs
      </div>

      {showModal && selectedEnvironmentId && (
        <ServerLogsModal
          environmentId={selectedEnvironmentId}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

export default ServerLogsButton;
