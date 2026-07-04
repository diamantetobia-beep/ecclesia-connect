import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext'; // ← import du contexte

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider> {/* ← enveloppe l'application */}
      <App />
    </AuthProvider>
  </StrictMode>,
);