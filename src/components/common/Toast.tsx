/**
 * Toast 通知组件
 */

import React from 'react';
import { useToast } from '../../hooks/useToast';

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  const getToastStyle = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`${getToastStyle(toast.type)} text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105 flex items-center gap-3`}
        >
          <span className="text-xl">
            {toast.type === 'success' && '✓'}
            {toast.type === 'error' && '✕'}
            {toast.type === 'warning' && '⚠'}
            {toast.type === 'info' && 'ℹ'}
          </span>
          <span>{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-2 hover:opacity-70"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

// Toast Provider
export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ToastContainer />
    </>
  );
}