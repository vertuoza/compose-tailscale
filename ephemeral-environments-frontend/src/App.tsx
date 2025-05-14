import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Pages
import Dashboard from './pages/Dashboard';
import ServicePage from './pages/ServicePage';
import EnvironmentDetailPage from './pages/EnvironmentDetailPage';
import CreateEnvironmentPage from './pages/CreateEnvironmentPage';
import NotFoundPage from './pages/NotFoundPage';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/service/:serviceName" element={<ServicePage />} />
          <Route path="/environment/:id" element={<EnvironmentDetailPage />} />
          <Route path="/create" element={<CreateEnvironmentPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
