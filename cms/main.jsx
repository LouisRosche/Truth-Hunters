/**
 * Truth Hunters - Claims Manager (CMS)
 * Simple interface for adding/editing claims
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClaimsManager } from './ClaimsManager';
import '../src/styles/index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClaimsManager />
  </StrictMode>
);
