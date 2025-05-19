import axios from 'axios';

// Get API base URL from environment variable or use default
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api/environments';

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Log the API base URL being used (helpful for debugging)
console.log(`Using API base URL: ${API_BASE_URL}`);

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
  environmentType?: 'qa' | 'demo';
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
  environment_type?: 'qa' | 'demo';
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

export const getServerLogs = async (id: string): Promise<string> => {
  const response = await api.get(`/${id}/server-logs`);
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
