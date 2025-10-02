// src/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8080/api/', // تأكد ان الباك اند بيشتغل على ده
  withCredentials: true, // لو بتستخدم sessions أو cookies
});

export default api;
