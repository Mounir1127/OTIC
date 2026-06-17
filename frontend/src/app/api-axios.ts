import axios from 'axios';
import { environment } from '../environments/environment';

const api = axios.create({
    baseURL: environment.apiUrl
});

// Optional: Add interceptors for tokens
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers['x-auth-token'] = token;
    }
    return config;
});

export default api;
