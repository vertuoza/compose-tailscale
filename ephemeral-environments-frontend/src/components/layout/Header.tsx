import React from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  return (
    <div className="bg-linear-dark-lighter border-b border-linear-border">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-xl font-medium text-linear-text">{title}</h1>
          {subtitle && (
            <p className="text-sm text-linear-text-secondary mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
