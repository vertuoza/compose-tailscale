import React, { useState, useEffect } from 'react';
import { getEnvironments, Environment } from '../services/api';
import AppLayout from '../components/layout/AppLayout';
import CreateEnvironmentForm from '../components/environments/CreateEnvironmentForm';

const CreateEnvironmentPage: React.FC = () => {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEnvironments = async () => {
      try {
        setLoading(true);
        const data = await getEnvironments();
        setEnvironments(data);
      } catch (err) {
        console.error('Error fetching environments for sidebar:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEnvironments();
  }, []);

  return (
    <AppLayout
      title="Create Environment"
      subtitle="Create a new ephemeral environment"
      environments={environments}
    >
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-linear-accent"></div>
        </div>
      ) : (
        <CreateEnvironmentForm />
      )}
    </AppLayout>
  );
};

export default CreateEnvironmentPage;
