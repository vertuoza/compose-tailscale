import React, { useState, useRef, useEffect } from 'react';

interface StatusFilterDropdownProps {
  selectedStatuses: string[];
  onStatusChange: (statuses: string[]) => void;
  disabled?: boolean;
}

const statusOptions = [
  { value: 'creating', label: 'Creating', color: 'text-blue-600' },
  { value: 'running', label: 'Running', color: 'text-green-600' },
  { value: 'error', label: 'Error', color: 'text-red-600' },
  { value: 'removed', label: 'Removed', color: 'text-gray-600' },
];

const StatusFilterDropdown: React.FC<StatusFilterDropdownProps> = ({
  selectedStatuses,
  onStatusChange,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleStatusToggle = (status: string) => {
    if (selectedStatuses.includes(status)) {
      onStatusChange(selectedStatuses.filter(s => s !== status));
    } else {
      onStatusChange([...selectedStatuses, status]);
    }
  };

  const handleSelectAll = () => {
    onStatusChange(statusOptions.map(option => option.value));
  };

  const handleClearAll = () => {
    onStatusChange([]);
  };

  const getDisplayText = () => {
    if (selectedStatuses.length === 0) {
      return 'No filters';
    } else if (selectedStatuses.length === 1) {
      const status = statusOptions.find(option => option.value === selectedStatuses[0]);
      return status?.label || selectedStatuses[0];
    } else if (selectedStatuses.length === statusOptions.length) {
      return 'All statuses';
    } else {
      return `${selectedStatuses.length} statuses`;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="bg-linear-dark-lighter border border-linear-border rounded px-3 py-1.5 text-sm text-linear-text focus:outline-none focus:ring-1 focus:ring-linear-accent disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between min-w-[140px]"
      >
        <span>{getDisplayText()}</span>
        <svg
          className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full min-w-[200px] bg-linear-dark-lighter border border-linear-border rounded-md shadow-lg z-50">
          <div className="p-2">
            {/* Select All / Clear All buttons */}
            <div className="flex justify-between mb-2 pb-2 border-b border-linear-border">
              <button
                onClick={handleSelectAll}
                className="text-xs text-linear-accent hover:text-linear-accent-hover"
              >
                Select All
              </button>
              <button
                onClick={handleClearAll}
                className="text-xs text-linear-text-secondary hover:text-linear-text"
              >
                Clear All
              </button>
            </div>

            {/* Status options */}
            {statusOptions.map(option => (
              <label
                key={option.value}
                className="flex items-center px-2 py-1 hover:bg-linear-dark rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedStatuses.includes(option.value)}
                  onChange={() => handleStatusToggle(option.value)}
                  className="mr-2 rounded border-linear-border text-linear-accent focus:ring-linear-accent focus:ring-1"
                />
                <span className={`w-2 h-2 rounded-full mr-2 ${
                  option.value === 'creating' ? 'bg-blue-500' :
                  option.value === 'running' ? 'bg-green-500' :
                  option.value === 'error' ? 'bg-red-500' :
                  'bg-gray-500'
                }`}></span>
                <span className="text-sm text-linear-text">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusFilterDropdown;
