import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEnvironment, CreateEnvironmentRequest } from '../../services/api';
import Button from '../common/Button';

interface ServiceInput {
  name: string;
  image_url: string;
}

const CreateEnvironmentForm: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CreateEnvironmentRequest>({
    repository_name: '',
    pr_number: 0,
    services: [{ name: '', image_url: '' }],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    if (formData.services.length > 1) {
      const updatedServices = [...formData.services];
      updatedServices.splice(index, 1);
      setFormData({
        ...formData,
        services: updatedServices,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!formData.repository_name.trim()) {
      setError('Repository name is required');
      return;
    }

    if (formData.pr_number <= 0) {
      setError('PR number must be greater than 0');
      return;
    }

    // Validate services
    for (const service of formData.services) {
      if (!service.name.trim() || !service.image_url.trim()) {
        setError('All service fields are required');
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      await createEnvironment(formData);

      // Navigate to the dashboard on success
      navigate('/');
    } catch (err) {
      console.error('Error creating environment:', err);
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

      <form onSubmit={handleSubmit}>
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

        <div className="mb-6">
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

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="text-linear-text-secondary">Services</label>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addService}
            >
              Add Service
            </Button>
          </div>

          {formData.services.map((service, index) => (
            <div key={index} className="mb-4 p-4 border border-linear-border rounded">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-linear-text">Service #{index + 1}</h4>
                {formData.services.length > 1 && (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => removeService(index)}
                  >
                    Remove
                  </Button>
                )}
              </div>

              <div className="mb-3">
                <label className="block text-linear-text-secondary mb-1">
                  Service Name
                </label>
                <input
                  type="text"
                  value={service.name}
                  onChange={(e) => handleServiceChange(index, 'name', e.target.value)}
                  className="w-full bg-linear-dark border border-linear-border rounded p-2 text-linear-text focus:outline-none focus:ring-1 focus:ring-linear-accent"
                  placeholder="e.g., api"
                />
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
            {loading ? 'Creating...' : 'Create Environment'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateEnvironmentForm;
