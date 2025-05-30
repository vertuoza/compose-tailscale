import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEnvironment, pollEnvironmentStatus, CreateEnvironmentRequest, Environment } from '../../services/api';
import Button from '../common/Button';

interface ServiceInput {
  name: string;
  image_url: string;
}

// List of available services from vertuoza-compose/docker-compose.yml
const availableServices = [
  'kernel',
  'kernel-migrations',
  'client-space',
  'identity',
  'identity-migrations',
  'auth',
  'work',
  'work-migrations',
  'ai',
  'ai-migrations',
  'gateway',
  'vertuosoft',
  'front',
  'planning'
];

const CreateEnvironmentForm: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CreateEnvironmentRequest>({
    repository_name: '',
    pr_number: 0,
    services: [], // Start with empty services array
    environment_type: 'qa', // Default to QA environment
  });
  const [loading, setLoading] = useState(false);
  const [creationStatus, setCreationStatus] = useState<'idle' | 'creating' | 'polling' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [createdEnvironment, setCreatedEnvironment] = useState<Environment | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'pr_number' ? parseInt(value) || 0 : value,
    });
  };

  const handleServiceChange = (index: number, field: keyof ServiceInput, value: string) => {
    const updatedServices = [...formData.services];
    updatedServices[index] = {
      ...updatedServices[index],
      [field]: value,
    };
    setFormData({
      ...formData,
      services: updatedServices,
    });
  };

  const addService = () => {
    setFormData({
      ...formData,
      services: [...formData.services, { name: '', image_url: '' }],
    });
  };

  const removeService = (index: number) => {
    // Allow removing any service, even if it's the only one
    const updatedServices = [...formData.services];
    updatedServices.splice(index, 1);
    setFormData({
      ...formData,
      services: updatedServices,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form based on environment type
    if (formData.environment_type === 'qa') {
      if (!formData.repository_name || !formData.repository_name.trim()) {
        setError('Repository name is required for QA environments');
        return;
      }

      if (!formData.pr_number || formData.pr_number <= 0) {
        setError('PR number must be greater than 0 for QA environments');
        return;
      }
    }

    // Validate services if any are provided
    if (formData.services.length > 0) {
      for (const service of formData.services) {
        if (!service.name.trim() || !service.image_url.trim()) {
          setError('All service fields are required');
          return;
        }
      }
    }

    try {
      setLoading(true);
      setError(null);
      setCreationStatus('creating');

      // Create the environment (this will return quickly with status 'creating')
      const environment = await createEnvironment(formData);
      setCreatedEnvironment(environment);

      // Start polling for status updates
      setCreationStatus('polling');
      const finalEnvironment = await pollEnvironmentStatus(environment.id);
      setCreatedEnvironment(finalEnvironment);

      // Check the final status
      if (finalEnvironment.status === 'running') {
        setCreationStatus('success');
        // Navigate to the dashboard on success after a short delay
        setTimeout(() => navigate('/'), 2000);
      } else if (finalEnvironment.status === 'error') {
        setCreationStatus('error');
        setError(`Environment creation failed: ${finalEnvironment.status}`);
      }
    } catch (err) {
      console.error('Error creating environment:', err);
      setCreationStatus('error');
      setError('Failed to create environment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-linear-dark-lighter rounded-lg border border-linear-border p-6">
      <h2 className="text-xl font-semibold mb-4">Create New Environment</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-900 bg-opacity-20 border border-red-800 rounded text-linear-error">
          {error}
        </div>
      )}

      {creationStatus === 'success' && (
        <div className="mb-4 p-3 bg-green-900 bg-opacity-20 border border-green-800 rounded text-green-400">
          Environment created successfully! Redirecting to dashboard...
        </div>
      )}

      {(creationStatus === 'creating' || creationStatus === 'polling') && createdEnvironment && (
        <div className="mb-4 p-3 bg-blue-900 bg-opacity-20 border border-blue-800 rounded text-blue-400">
          <p>Creating environment: <strong>{createdEnvironment.id}</strong></p>
          <p className="mt-2">Status: {creationStatus === 'creating' ? 'Initializing...' : 'Setting up containers...'}</p>
          {createdEnvironment.url && (
            <p className="mt-2">URL: <a href={createdEnvironment.url} target="_blank" rel="noopener noreferrer" className="underline">{createdEnvironment.url}</a></p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-linear-text-secondary mb-1">
            Environment Type
          </label>
          <div className="relative">
            <select
              name="environment_type"
              value={formData.environment_type}
              onChange={handleInputChange}
              className="w-full bg-linear-dark border border-linear-border rounded px-3 pr-8 py-1.5 text-linear-text focus:outline-none focus:ring-1 focus:ring-linear-accent appearance-none"
            >
              <option value="qa">QA</option>
              <option value="demo">DEMO</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-linear-text-secondary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>
        </div>

        {/* Conditional fields for QA environment */}
        {formData.environment_type === 'qa' && (
          <>
            <div className="mb-4">
              <label className="block text-linear-text-secondary mb-1">
                Repository Name
              </label>
              <input
                type="text"
                name="repository_name"
                value={formData.repository_name}
                onChange={handleInputChange}
                className="w-full bg-linear-dark border border-linear-border rounded p-2 text-linear-text focus:outline-none focus:ring-1 focus:ring-linear-accent"
                placeholder="e.g., my-project"
              />
            </div>

            <div className="mb-4">
              <label className="block text-linear-text-secondary mb-1">
                PR Number
              </label>
              <input
                type="number"
                name="pr_number"
                value={formData.pr_number || ''}
                onChange={handleInputChange}
                className="w-full bg-linear-dark border border-linear-border rounded p-2 text-linear-text focus:outline-none focus:ring-1 focus:ring-linear-accent"
                placeholder="e.g., 123"
                min="1"
              />
            </div>
          </>
        )}


        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="text-linear-text-secondary">Service Overrides</label>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addService}
            >
              Add Service Override
            </Button>
          </div>

          {formData.services.map((service, index) => (
            <div key={index} className="mb-4 p-4 border border-linear-border rounded">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-linear-text">Service #{index + 1}</h4>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => removeService(index)}
                >
                  Remove
                </Button>
              </div>

              <div className="mb-3">
                <label className="block text-linear-text-secondary mb-1">
                  Service Name
                </label>
                <div className="relative">
                  <select
                    value={service.name}
                    onChange={(e) => handleServiceChange(index, 'name', e.target.value)}
                    className="w-full bg-linear-dark border border-linear-border rounded px-3 pr-8 py-1.5 text-linear-text focus:outline-none focus:ring-1 focus:ring-linear-accent appearance-none"
                  >
                    <option value="">Select a service</option>
                    {availableServices.map((serviceName) => (
                      <option key={serviceName} value={serviceName}>
                        {serviceName}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-linear-text-secondary">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-linear-text-secondary mb-1">
                  Image URL
                </label>
                <input
                  type="text"
                  value={service.image_url}
                  onChange={(e) => handleServiceChange(index, 'image_url', e.target.value)}
                  className="w-full bg-linear-dark border border-linear-border rounded p-2 text-linear-text focus:outline-none focus:ring-1 focus:ring-linear-accent"
                  placeholder="e.g., docker.io/myorg/myimage:latest"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            variant="secondary"
            className="mr-2"
            onClick={() => navigate('/')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? (creationStatus === 'polling' ? 'Setting up environment...' : 'Creating...') : 'Create Environment'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateEnvironmentForm;
