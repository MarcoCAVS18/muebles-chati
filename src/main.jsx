import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/bricolage-grotesque/wdth.css';
import '@fontsource-variable/instrument-sans';
import '@fontsource/permanent-marker';
import App from './App.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(<App />);
