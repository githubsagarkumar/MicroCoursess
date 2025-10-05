import axios from 'axios';

// Set the base URL for API calls. Use env var if provided (CRA uses REACT_APP_*) with a sensible fallback.
const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
axios.defaults.baseURL = apiBaseUrl;

export default axios;
