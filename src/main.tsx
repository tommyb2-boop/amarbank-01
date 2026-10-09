import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);

// Register Service Worker for PWA installability on Android & modern browsers
if ('serviceWorker' in navigator && typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        // Successfully registered service worker
        console.log('Amar Bank Service Worker registered with scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('Amar Bank Service Worker registration failed:', err);
      });
  });
}
