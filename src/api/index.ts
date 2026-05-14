import axios from 'axios';

const api = axios.create({
  // Toutes les requêtes passent par le proxy Vite (/api → http://localhost:8080).
  // Cela garantit que le cookie HttpOnly jwt (même origine) est toujours envoyé.
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
});

export default api;
