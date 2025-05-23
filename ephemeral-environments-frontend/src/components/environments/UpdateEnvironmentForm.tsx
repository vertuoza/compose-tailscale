import React, { useState } from 'react';
import { updateEnvironment, CreateEnvironmentRequest, Environment } from '../../services/api';
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

interface UpdateEnvironmentFormProps {
  environment: Environment;
  onSuccess: (updatedEnvironment: Environment) => void;
  onCancel: () => void;
}

const UpdateEnvironmentForm: React.FC<UpdateEnvironmentFormProps> = ({
  environment,
  onSuccess,
  onCancel
}) => {
  // Initialize form data with current environment data
  const [formData, setFormData] = useState<CreateEnvironmentRequest>({
    repository_name: environment.repositoryName || '',
    pr_number: environment.prNumber || 0,
    environment_type: environment.environmentType,
    services: environment.services.map(service => ({
      name: service.name,
      image_url: service.imageUrl
    }))
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    const updatedServices = [...formData.services];
    updatedServices.splice(index, 1);
    setFormData({
      ...formData,
      services: updatedServices,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

      // Update the environment
      const updatedEnvironment = await updateEnvironment(environment.id, formData);
      onSuccess(updatedEnvironment);
    } catch (err) {
      console.error('Error updating environment:', err);
      setError('Failed to update environment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-linear-dark-lighter rounded-lg border border-linear-border p-6">
      <h2 className="text-xl font-semibold mb-4">Update Environment: {environment.id}</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-900 bg-opacity-20 border border-red-800 rounded text-linear-error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
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

          {formData.services.length === 0 ? (
            <div className="p-4 border border-linear-border rounded text-center text-linear-text-secondary">
              No service overrides configured. Click "Add Service Override" to add one.
            </div>
          ) : (
            formData.services.map((service, index) => (
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
            ))
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Environment'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UpdateEnvironmentForm;
