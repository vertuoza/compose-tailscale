import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Environment } from '../../services/api';

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  environments: Environment[];
}

const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  title,
  subtitle,
  environments,
}) => {
  return (
    <div className="flex h-screen bg-linear-dark text-linear-text">
      <Sidebar environments={environments} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} subtitle={subtitle} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
