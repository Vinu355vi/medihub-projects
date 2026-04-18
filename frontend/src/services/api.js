import axios from 'axios';
import { LOCAL_STORAGE_KEYS } from '../utils/constants';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create a separate instance for non-/api endpoints (like pharmacy)
const baseApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const requestWithFallback = async (instance, requests) => {
  let lastError;
  for (const makeRequest of requests) {
    try {
      return await makeRequest(instance);
    } catch (error) {
      lastError = error;
      if (error?.response?.status !== 404) {
        throw error;
      }
    }
  }
  throw lastError;
};

// Request interceptor for adding token
const addTokenInterceptor = (config) => {
  const token = localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

const errorInterceptor = (error) => {
  return Promise.reject(error);
};

// Response interceptor for handling errors
const responseSuccessInterceptor = (response) => response;
const responseErrorInterceptor = (error) => {
  if (error.response?.status === 401) {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.TOKEN);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.USER);
    window.location.href = '/login';
  }
  return Promise.reject(error);
};

// Apply interceptors to both instances
api.interceptors.request.use(addTokenInterceptor, errorInterceptor);
api.interceptors.response.use(responseSuccessInterceptor, responseErrorInterceptor);

baseApi.interceptors.request.use(addTokenInterceptor, errorInterceptor);
baseApi.interceptors.response.use(responseSuccessInterceptor, responseErrorInterceptor);

// Auth Services
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
};

// Patient Services
export const patientAPI = {
  getMyProfile: () => api.get('/patient/me'),
  updateMyProfile: (data) => api.put('/patient/me', data),
  getDashboardStats: () => api.get('/patient/dashboard/stats'),
  getRecentAppointments: () => api.get('/patient/appointments/recent'),
  getAppointments: () => api.get('/patient/appointments'),
  getPatients: () => api.get('/users', { params: { role: 'PATIENT' } }),
  createPatient: (data) => api.post('/users', { ...data, role: 'PATIENT' }),
};

// Appointment Services
export const appointmentAPI = {
  bookAppointment: (bookingRequest) => api.post('/appointments/book', bookingRequest),
  getAvailableSlots: (doctorId, date) => api.get(`/appointments/available-slots/${doctorId}`, { params: { date } }),
  getUpcomingAppointments: () => api.get('/appointments/upcoming'),
  rescheduleAppointment: (appointmentId, data) => api.post(`/appointments/reschedule/${appointmentId}`, data),
  cancelAppointment: (appointmentId, reason) => api.post(`/appointments/cancel/${appointmentId}`, reason ? { reason } : {}),
  getDoctorSchedule: (date) => api.get('/appointments/doctor/schedule', { params: { date } }),
  checkInAppointment: (appointmentId) => api.post(`/appointments/check-in/${appointmentId}`),
  completeAppointment: (appointmentId, details) => api.post(`/appointments/complete/${appointmentId}`, details),
  confirmAppointment: (appointmentId) => api.post(`/appointments/confirm/${appointmentId}`),
};

// Medical Record Services
export const medicalRecordAPI = {
  getRecords: (patientId) => {
    if (patientId) return api.get(`/medical-records/${patientId}`);
    return api.get('/medical-records');
  },
  addRecord: (data) => api.post('/medical-records', data),
  updateRecord: (id, data) => api.put(`/medical-records/${id}`, data),
  deleteRecord: (id) => api.delete(`/medical-records/${id}`),
};

// Doctor Services
export const doctorAPI = {
  getAllDoctors: (params) =>
    requestWithFallback(api, [
      (client) => client.get('/doctors', { params }),
      (client) => client.get('/doctor', { params }),
    ]),
  getSpecializations: () =>
    requestWithFallback(api, [
      (client) => client.get('/doctors/specializations'),
      (client) => client.get('/doctor/specializations'),
      async (client) => {
        const doctorsResponse = await client.get('/doctors');
        const doctors = Array.isArray(doctorsResponse.data) ? doctorsResponse.data : [];
        const unique = [...new Set(doctors.map((d) => d?.specialization).filter(Boolean))];
        return { ...doctorsResponse, data: unique };
      },
    ]),
  getMyProfile: () =>
    requestWithFallback(api, [
      (client) => client.get('/doctors/me'),
      (client) => client.get('/doctor/me'),
      async (client) => {
        const me = await axios.get(`${BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN) || ''}`,
          },
        });
        return { ...me, data: { ...me.data, specialization: '', license: '' } };
      },
    ]),
  updateMyProfile: (data) =>
    requestWithFallback(api, [
      (client) => client.put('/doctors/me', data),
      (client) => client.put('/doctor/me', data),
    ]),
};

// Pharmacy Services
export const pharmacyAPI = {
  getProducts: () => baseApi.get('/pharmacy/products'),
  getOrders: () => baseApi.get('/pharmacy/orders'),
  createProduct: (data) => baseApi.post('/pharmacy/products', data),
  deleteProduct: (productId) => baseApi.delete(`/pharmacy/products/${productId}`),
  getCart: () => baseApi.get('/pharmacy/cart'),
  addToCart: (productId, quantity = 1) => baseApi.post('/pharmacy/cart/items', { productId, quantity }),
  updateCartItem: (cartItemId, quantity) => baseApi.put(`/pharmacy/cart/items/${cartItemId}`, { quantity }),
  removeCartItem: (cartItemId) => baseApi.delete(`/pharmacy/cart/items/${cartItemId}`),
  clearCart: () => baseApi.delete('/pharmacy/cart/clear'),
  checkoutCart: () => baseApi.post('/pharmacy/orders'),
  updateOrderStatus: (orderId, status) => baseApi.patch(`/pharmacy/orders/${orderId}/status`, { status }),
};

// AI Services
export const aiAPI = {
  getTriageScore: (symptoms, patientAge) => api.post('/ai/triage-score', { symptoms, patientAge }),
  getDoctorRecommendation: (data) => api.post('/ai/doctor-recommendation', data),
  getDemandPrediction: (productId) => api.get(`/ai/demand-prediction/${productId}`),
  getDemandForecast: (limit = 10) => api.get('/ai/demand-prediction/forecast', { params: { limit } }),
  getAnomalyDetection: () => api.get('/ai/anomaly-detection'),
};

// Medical Record Services (Removed duplicate)
// export const medicalRecordAPI = {
//   getRecords: () => api.get('/medical-records'),
//   getPatientRecords: (patientId) => api.get(`/medical-records/${patientId}`),
//   addRecord: (record) => api.post('/medical-records', record),
// };

// User Management Services
export const userAPI = {
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  getUsers: (params) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  deleteUser: (id) => api.delete(`/users/${id}`),
};

// Inventory Services
export const inventoryAPI = {
  getInventory: () => api.get('/inventory'),
  updateStock: (id, stock) => api.put(`/inventory/${id}`, { stock }),
};

// Analytics Services
export const analyticsAPI = {
  getAppointmentAnalytics: () => api.get('/analytics/appointments'),
  getHealthMetrics: () => api.get('/analytics/health-metrics'),
};

export default api;
