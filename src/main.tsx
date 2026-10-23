// React entry point — mounts the App component into the #root DOM element.
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
// Global stylesheet: theme tokens (Light/Dark/System), continuous document
// flow (window-level vertical scrollbar scrolls the A4 preview) + print rules
// (window.print() prints the hidden .print-doc tree, one A4 block per page).
import './app.css';

// Locate the root DOM node and create a React 18 root
const root = ReactDOM.createRoot(document.getElementById('root')!);

// Render the App wrapped in StrictMode for development warnings
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
