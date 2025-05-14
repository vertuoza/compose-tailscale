import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: '/api/environments', // This will use the proxy in development and the nginx config in production
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface Service {
  name: string;
  imageUrl: string;
}

export interface Environment {
  id: string;
  repositoryName: string;
  services: Service[];
  prNumber: number;
  status: 'running' | 'error' | 'removed';
  url: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnvironmentLog {
  id: number;
  environment_id: string;
  action: string;
  status: string;
  message: string;
  created_at: string;
}

export interface CreateEnvironmentRequest {
  repository_name: string;
  pr_number: number;
  services: {
    name: string;
    image_url: string;
  }[];
}

// API functions
export const getEnvironments = async (filters?: {
  status?: string;
  repository_name?: string;
  pr_number?: number;
}): Promise<Environment[]> => {
  const response = await api.get('/', { params: filters });
  return response.data.environments;
};

export const getEnvironment = async (id: string): Promise<Environment> => {
  const response = await api.get(`/${id}`);
  return response.data;
};

export const getEnvironmentLogs = async (id: string): Promise<EnvironmentLog[]> => {
  const response = await api.get(`/${id}/logs`);
  return response.data.logs;
};

export const createEnvironment = async (data: CreateEnvironmentRequest): Promise<Environment> => {
  const response = await api.post('/', data);
  return response.data;
};

export const deleteEnvironment = async (id: string): Promise<{ id: string; status: string; message: string }> => {
  const response = await api.delete(`/${id}`);
  return response.data;
};

export default api;
