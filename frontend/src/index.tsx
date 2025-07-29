import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import 'katex/dist/katex.min.css';
import App from './App';
import './i18n'; // Importar configuração do i18n

// Variables d'environnement par défaut
if (!process.env.REACT_APP_API_URL) {
  process.env.REACT_APP_API_URL = 'http://localhost:5000';
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);