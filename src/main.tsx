import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Capture beforeinstallprompt immediately at top-level before React renders
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    (window as any).__deferredPWAInstallPrompt = e;
    console.log('PWA: Early beforeinstallprompt captured!');
  });
}

createRoot(document.getElementById('root')!).render(<App />);

// Register Service Worker for PWA installability on Android & modern browsers
if ('serviceWorker' in navigator && typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('Amar Bank Service Worker registered with scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('Amar Bank Service Worker registration failed:', err);
      });
  });
}
