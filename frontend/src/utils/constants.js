// frontend/src/utils/constants.js
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const ROLES = {
  PATIENT: 'ROLE_PATIENT',
  DOCTOR: 'ROLE_DOCTOR',
  ADMIN: 'ROLE_ADMIN',
};

export const APPOINTMENT_STATUS = {
  SCHEDULED: 'SCHEDULED',
  CONFIRMED: 'CONFIRMED',
  CHECKED_IN: 'CHECKED_IN',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
  RESCHEDULED: 'RESCHEDULED',
};

export const TRIAGE_PRIORITY = {
  CRITICAL: 'CRITICAL',
  URGENT: 'URGENT',
  SEMI_URGENT: 'SEMI_URGENT',
  ROUTINE: 'ROUTINE',
};

export const ORDER_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PROCESSING: 'PROCESSING',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
};

export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
};

export const DRUG_INTERACTION_TYPES = {
  SEVERE: 'SEVERE',
  MODERATE: 'MODERATE',
  MINOR: 'MINOR',
};

export const BLOOD_GROUPS = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
];

export const GENDERS = [
  'MALE', 'FEMALE', 'OTHER'
];

export const DAYS_OF_WEEK = [
  'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'
];

export const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
];

export const MEDICINE_CATEGORIES = [
  'Antibiotics',
  'Pain Relievers',
  'Vitamins',
  'Diabetes',
  'Cardiology',
  'Respiratory',
  'Dermatology',
  'Gastrointestinal',
  'Neurology',
  'Psychiatry',
  'Oncology',
  'Hormones',
  'Antivirals',
  'Antifungals',
  'Antihistamines',
  'Others'
];

export const NOTIFICATION_TYPES = {
  APPOINTMENT: 'APPOINTMENT',
  PRESCRIPTION: 'PRESCRIPTION',
  ORDER: 'ORDER',
  PAYMENT: 'PAYMENT',
  SYSTEM: 'SYSTEM',
  ALERT: 'ALERT',
};

export const AI_FEATURES = {
  TRIAGE_SCORING: 'TRIAGE_SCORING',
  DRUG_INTERACTION: 'DRUG_INTERACTION',
  DEMAND_PREDICTION: 'DEMAND_PREDICTION',
  LOGIN_ANOMALY: 'LOGIN_ANOMALY',
  DOCTOR_RECOMMENDATION: 'DOCTOR_RECOMMENDATION',
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access forbidden.',
  NOT_FOUND: 'Resource not found.',
  VALIDATION_ERROR: 'Please check your input.',
  UNKNOWN_ERROR: 'An unknown error occurred.',
};

export const SUCCESS_MESSAGES = {
  APPOINTMENT_BOOKED: 'Appointment booked successfully!',
  PRESCRIPTION_SAVED: 'Prescription saved successfully!',
  ORDER_PLACED: 'Order placed successfully!',
  PAYMENT_SUCCESSFUL: 'Payment successful!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  SETTINGS_SAVED: 'Settings saved successfully!',
};

export const LOCAL_STORAGE_KEYS = {
  TOKEN: 'medihub_token',
  USER: 'medihub_user',
  THEME: 'medihub_theme',
  LANGUAGE: 'medihub_language',
  CART: 'medihub_cart',
};

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
};

export const LANGUAGES = {
  EN: 'en',
  ES: 'es',
  FR: 'fr',
  DE: 'de',
};

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  
  // Users
  USERS: '/users',
  USER_PROFILE: '/users/profile',
  CHANGE_PASSWORD: '/users/change-password',
  
  // Patients
  PATIENTS: '/patients',
  PATIENT_PROFILE: '/patients/profile',
  PATIENT_HISTORY: '/patients/history',
  
  // Doctors
  DOCTORS: '/doctors',
  DOCTOR_PROFILE: '/doctors/profile',
  DOCTOR_AVAILABILITY: '/doctors/availability',
  DOCTOR_SCHEDULE: '/doctors/schedule',
  
  // Appointments
  APPOINTMENTS: '/appointments',
  APPOINTMENT_BOOK: '/appointments/book',
  APPOINTMENT_CANCEL: '/appointments/cancel',
  APPOINTMENT_RESCHEDULE: '/appointments/reschedule',
  AVAILABLE_SLOTS: '/appointments/available-slots',
  
  // Pharmacy
  PHARMACY_PRODUCTS: '/pharmacy/products',
  PHARMACY_ORDERS: '/pharmacy/orders',
  PHARMACY_CART: '/pharmacy/cart',
  CHECK_INTERACTION: '/pharmacy/check-interaction',
  
  // AI Services
  AI_TRIAGE: '/ai/triage',
  AI_RECOMMENDATION: '/ai/recommendation',
  AI_PREDICTION: '/ai/prediction',
  
  // Analytics
  ANALYTICS_STATS: '/analytics/stats',
  ANALYTICS_REPORTS: '/analytics/reports',
  
  // File Upload
  UPLOAD: '/upload',
  UPLOAD_PRESCRIPTION: '/upload/prescription',
  UPLOAD_REPORT: '/upload/report',
};

export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[0-9]{10}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  NAME: /^[a-zA-Z\s]{2,100}$/,
  PINCODE: /^[0-9]{6}$/,
  LICENSE_NUMBER: /^[A-Z0-9]{6,20}$/,
};

export const DATE_FORMATS = {
  DISPLAY_DATE: 'DD MMM YYYY',
  DISPLAY_TIME: 'hh:mm A',
  DISPLAY_DATETIME: 'DD MMM YYYY, hh:mm A',
  API_DATE: 'YYYY-MM-DD',
  API_TIME: 'HH:mm:ss',
  API_DATETIME: 'YYYY-MM-DDTHH:mm:ss',
};

export const CHART_COLORS = {
  PRIMARY: '#1976d2',
  SECONDARY: '#dc004e',
  SUCCESS: '#2e7d32',
  WARNING: '#ed6c02',
  ERROR: '#d32f2f',
  INFO: '#0288d1',
  PATIENT: '#4caf50',
  DOCTOR: '#2196f3',
  ADMIN: '#f44336',
  APPOINTMENT: '#9c27b0',
  PHARMACY: '#ff9800',
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
export const MAX_CART_ITEMS = 20;
export const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
export const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes