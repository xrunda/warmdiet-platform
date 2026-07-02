type AuthExpiredListener = () => void;

const authExpiredListeners = new Set<AuthExpiredListener>();

export function subscribeToAuthExpired(listener: AuthExpiredListener): () => void {
  authExpiredListeners.add(listener);
  return () => authExpiredListeners.delete(listener);
}

export function notifyAuthExpired(): void {
  authExpiredListeners.forEach((listener) => listener());
}

export function shouldRefreshDemoSession(patientId: string | undefined, isDevelopment: boolean): boolean {
  return isDevelopment && patientId === 'patient_test_001';
}
