import React from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  return (
    <div className="bg-linear-dark-lighter p-6 border-b border-linear-border">
      <h1 className="text-2xl font-semibold text-linear-text">{title}</h1>
      {subtitle && (
        <p className="text-linear-text-secondary mt-1">{subtitle}</p>
      )}
    </div>
  );
};

export default Header;
