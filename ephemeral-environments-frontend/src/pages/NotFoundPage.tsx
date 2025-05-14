import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getEnvironments, Environment } from '../services/api';
import AppLayout from '../components/layout/AppLayout';
import Button from '../components/common/Button';

const NotFoundPage: React.FC = () => {
  const [environments, setEnvironments] = useState<Environment[]>([]);

  useEffect(() => {
    const fetchEnvironments = async () => {
      try {
        const data = await getEnvironments();
        setEnvironments(data);
      } catch (err) {
        console.error('Error fetching environments for sidebar:', err);
      }
    };

    fetchEnvironments();
  }, []);

  return (
    <AppLayout
      title="Page Not Found"
      subtitle="The page you're looking for doesn't exist"
      environments={environments}
    >
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-9xl font-bold text-linear-accent mb-4">404</div>
        <h2 className="text-2xl font-semibold mb-6">Page Not Found</h2>
        <p className="text-linear-text-secondary mb-8 text-center max-w-md">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <Link to="/">
          <Button>
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </AppLayout>
  );
};

export default NotFoundPage;
