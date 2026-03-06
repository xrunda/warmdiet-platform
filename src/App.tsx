import React from 'react';
import { useAuth } from './hooks/useAuth';
import { LoginForm } from './components/hospitals/LoginForm';
import { HospitalDashboard } from './components/hospitals/Dashboard';
import { ToastProvider } from './components/common/Toast';

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">加载中...</div>
      </div>
    );
  }

  return (
    <ToastProvider>
      {!isAuthenticated ? (
        <LoginForm />
      ) : (
        <HospitalDashboard />
      )}
    </ToastProvider>
  );
}

export default App;