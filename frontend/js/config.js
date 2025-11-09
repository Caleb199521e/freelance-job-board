// Shared frontend configuration
// API_BASE points to the backend API root (includes /api)
// In production you can set window.__API_BASE__ before this script loads to override.
window.API_BASE = window.__API_BASE__ || 'http://localhost:5000/api';
// Also expose a global variable for easy access in inline scripts
var API_BASE = window.API_BASE;


