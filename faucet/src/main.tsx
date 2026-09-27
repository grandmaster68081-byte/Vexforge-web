import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';
import './scene-v2.css';
import './kivora-v4/kivora-v4.css';
import './kivora-v4/integration.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
