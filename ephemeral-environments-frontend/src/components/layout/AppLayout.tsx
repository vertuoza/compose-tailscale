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
    <div className="flex h-screen bg-linear-dark text-linear-text overflow-hidden">
      <Sidebar environments={environments} />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Background pattern overlay */}
        <div className="absolute inset-0 opacity-5 pointer-events-none z-0"
             style={{
               backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
               backgroundSize: '30px 30px'
             }}
        ></div>

        <Header title={title} subtitle={subtitle} />
        <main className="flex-1 overflow-y-auto p-6 relative z-10">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
