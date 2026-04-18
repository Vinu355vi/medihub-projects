// frontend/src/utils/validators.js
import { VALIDATION_RULES } from './constants';

export const validateEmail = (email) => {
  if (!email) return 'Email is required';
  if (!VALIDATION_RULES.EMAIL.test(email)) return 'Invalid email format';
  return '';
};

export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!VALIDATION_RULES.PASSWORD.test(password)) {
    return 'Password must contain uppercase, lowercase, number and special character';
  }
  return '';
};

export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) return 'Please confirm your password';
  if (password !== confirmPassword) return 'Passwords do not match';
  return '';
};

export const validateName = (name) => {
  if (!name) return 'Name is required';
  if (!VALIDATION_RULES.NAME.test(name)) return 'Name must be 2-100 characters';
  return '';
};

export const validatePhone = (phone) => {
  if (!phone) return 'Phone number is required';
  if (!VALIDATION_RULES.PHONE.test(phone)) return 'Invalid phone number';
  return '';
};

export const validateDateOfBirth = (date) => {
  if (!date) return 'Date of birth is required';
  const dob = new Date(date);
  const today = new Date();
  if (dob >= today) return 'Date of birth must be in the past';
  const age = today.getFullYear() - dob.getFullYear();
  if (age < 0 || age > 150) return 'Invalid age';
  return '';
};

export const validateRequired = (value, fieldName) => {
  if (!value) return `${fieldName} is required`;
  return '';
};

export const validateMinLength = (value, minLength, fieldName) => {
  if (value.length < minLength) {
    return `${fieldName} must be at least ${minLength} characters`;
  }
  return '';
};

export const validateMaxLength = (value, maxLength, fieldName) => {
  if (value.length > maxLength) {
    return `${fieldName} must be less than ${maxLength} characters`;
  }
  return '';
};

export const validateNumeric = (value, fieldName) => {
  if (isNaN(value)) return `${fieldName} must be a number`;
  return '';
};

export const validatePositiveNumber = (value, fieldName) => {
  if (value <= 0) return `${fieldName} must be positive`;
  return '';
};

export const validateAppointmentDate = (date) => {
  if (!date) return 'Appointment date is required';
  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (selectedDate < today) return 'Appointment date cannot be in the past';
  if (selectedDate > new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000)) {
    return 'Appointments can only be booked up to 90 days in advance';
  }
  return '';
};

export const validateAppointmentTime = (time, date) => {
  if (!time) return 'Appointment time is required';
  
  const appointmentDateTime = new Date(`${date}T${time}`);
  const now = new Date();
  
  // If appointment is today, check if time is in future
  if (date === now.toISOString().split('T')[0]) {
    const selectedTime = new Date(now.toDateString() + ' ' + time);
    if (selectedTime <= now) {
      return 'Appointment time must be in the future';
    }
  }
  
  return '';
};

export const validateSymptoms = (symptoms) => {
  if (!symptoms) return 'Symptoms description is required';
  if (symptoms.length < 10) return 'Please provide more details about symptoms';
  if (symptoms.length > 1000) return 'Symptoms description is too long';
  return '';
};

export const validateAddress = (address) => {
  if (!address) return 'Address is required';
  if (address.length < 10) return 'Please provide complete address';
  return '';
};

export const validatePincode = (pincode) => {
  if (!pincode) return 'Pincode is required';
  if (!VALIDATION_RULES.PINCODE.test(pincode)) return 'Invalid pincode';
  return '';
};

export const validateLicenseNumber = (license) => {
  if (!license) return 'License number is required';
  if (!VALIDATION_RULES.LICENSE_NUMBER.test(license)) {
    return 'Invalid license number format';
  }
  return '';
};

export const validatePrice = (price) => {
  if (!price) return 'Price is required';
  if (isNaN(price)) return 'Price must be a number';
  if (price <= 0) return 'Price must be positive';
  if (price > 1000000) return 'Price is too high';
  return '';
};

export const validateStock = (stock) => {
  if (!stock && stock !== 0) return 'Stock quantity is required';
  if (isNaN(stock)) return 'Stock must be a number';
  if (stock < 0) return 'Stock cannot be negative';
  if (stock > 1000000) return 'Stock quantity is too high';
  return '';
};

export const validateFile = (file, options = {}) => {
  const { maxSize = 10 * 1024 * 1024, allowedTypes = [] } = options;
  
  if (!file) return 'File is required';
  if (file.size > maxSize) return `File size must be less than ${maxSize / (1024 * 1024)}MB`;
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return `File type must be one of: ${allowedTypes.join(', ')}`;
  }
  return '';
};

export const validateForm = (formData, validationRules) => {
  const errors = {};
  
  Object.keys(validationRules).forEach((field) => {
    const rules = validationRules[field];
    const value = formData[field];
    
    rules.forEach((rule) => {
      const error = rule(value, formData);
      if (error && !errors[field]) {
        errors[field] = error;
      }
    });
  });
  
  return errors;
};

export const hasValidationErrors = (errors) => {
  return Object.keys(errors).some(key => errors[key] !== '');
};

// Common validation rule sets
export const validationRules = {
  login: {
    email: [validateEmail],
    password: [validatePassword],
  },
  register: {
    email: [validateEmail],
    password: [validatePassword],
    confirmPassword: [(value, formData) => validateConfirmPassword(formData.password, value)],
    name: [validateName],
    phone: [validatePhone],
    dateOfBirth: [validateDateOfBirth],
  },
  appointment: {
    date: [validateAppointmentDate],
    time: [validateAppointmentTime],
    symptoms: [validateSymptoms],
  },
  patientProfile: {
    name: [validateName],
    phone: [validatePhone],
    address: [validateAddress],
    emergencyContactPhone: [validatePhone],
  },
  doctorProfile: {
    name: [validateName],
    phone: [validatePhone],
    licenseNumber: [validateLicenseNumber],
    consultationFee: [validatePrice],
  },
  pharmacyProduct: {
    name: [validateRequired],
    price: [validatePrice],
    stockQuantity: [validateStock],
    category: [validateRequired],
  },
};

export default {
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validateName,
  validatePhone,
  validateDateOfBirth,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validateNumeric,
  validatePositiveNumber,
  validateAppointmentDate,
  validateAppointmentTime,
  validateSymptoms,
  validateAddress,
  validatePincode,
  validateLicenseNumber,
  validatePrice,
  validateStock,
  validateFile,
  validateForm,
  hasValidationErrors,
  validationRules,
};