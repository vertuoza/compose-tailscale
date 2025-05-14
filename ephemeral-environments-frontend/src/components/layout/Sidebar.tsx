import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Environment } from '../../services/api';

interface SidebarProps {
  environments: Environment[];
}

const Sidebar: React.FC<SidebarProps> = ({ environments }) => {
  const location = useLocation();

  // Group environments by service (repository name)
  const serviceGroups = useMemo(() => {
    const groups: Record<string, Environment[]> = {};

    environments.forEach(env => {
      const { repositoryName } = env;
      if (!groups[repositoryName]) {
        groups[repositoryName] = [];
      }
      groups[repositoryName].push(env);
    });

    return groups;
  }, [environments]);

  return (
    <div className="w-64 h-screen bg-linear-dark-lighter border-r border-linear-border flex flex-col">
      <div className="p-4 border-b border-linear-border">
        <h1 className="text-xl font-semibold text-linear-text">Environments</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <div className="mb-4">
          <Link
            to="/"
            className={`sidebar-item ${location.pathname === '/' ? 'active' : ''}`}
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            Dashboard
          </Link>
        </div>

        <div className="mb-2">
          <h2 className="text-xs font-semibold text-linear-text-secondary uppercase tracking-wider px-4 py-2">
            Services
          </h2>

          {Object.entries(serviceGroups).map(([serviceName, envs]) => (
            <div key={serviceName} className="mb-2">
              <Link
                to={`/service/${serviceName}`}
                className={`sidebar-item ${location.pathname === `/service/${serviceName}` ? 'active' : ''}`}
              >
                <div className="w-2 h-2 rounded-full bg-linear-accent mr-2"></div>
                {serviceName} ({envs.length})
              </Link>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-linear-border">
        <Link
          to="/create"
          className="btn btn-primary w-full flex items-center justify-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New Environment
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;
