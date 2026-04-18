// frontend/src/pages/auth/Register.jsx
import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
} from '@mui/material';
import {
  Person,
  LocalHospital,
  MedicalServices,
  AssignmentInd,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { validateEmail, validatePassword, validatePhone } from '../../utils/validators';

const steps = ['Account Info', 'Personal Details', 'Medical Info', 'Confirmation'];

const Register = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    // Step 1
    email: '',
    password: '',
    confirmPassword: '',
    role: 'PATIENT',
    
    // Step 2
    name: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    
    // Step 3
    bloodGroup: '',
    allergies: '',
    medicalHistory: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    insuranceProvider: '',
    insuranceNumber: '',
    specialization: '',
    licenseNumber: '',
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 0:
        const emailError = validateEmail(formData.email.trim());
        if (emailError) newErrors.email = emailError;
        
        const passwordError = validatePassword(formData.password);
        if (passwordError) newErrors.password = passwordError;
        
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
        break;
        
      case 1:
        if (!formData.name) newErrors.name = 'Name is required';
        const phoneError = validatePhone(formData.phone);
        if (phoneError) newErrors.phone = phoneError;
        if (!formData.gender) newErrors.gender = 'Gender is required';
        break;
        
      case 2:
        if (formData.role === 'DOCTOR') {
          if (!formData.specialization) newErrors.specialization = 'Specialization is required';
          if (!formData.licenseNumber) newErrors.licenseNumber = 'License number is required';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setServerError('');

    try {
      // Prepare user data
      const userData = {
        email: formData.email.trim(),
        password: formData.password,
        name: formData.name,
        role: formData.role,
        phone: formData.phone,
        gender: formData.gender,
        address: formData.address,
        dateOfBirth: formData.dateOfBirth || null,
      };

      // Add patient-specific data if role is PATIENT
      if (formData.role === 'PATIENT') {
        userData.patientData = {
          bloodGroup: formData.bloodGroup,
          allergies: formData.allergies,
          medicalHistory: formData.medicalHistory,
          emergencyContactName: formData.emergencyContactName,
          emergencyContactPhone: formData.emergencyContactPhone,
          insuranceProvider: formData.insuranceProvider,
          insuranceNumber: formData.insuranceNumber,
        };
      } else if (formData.role === 'DOCTOR') {
        userData.doctorData = {
          specialization: formData.specialization,
          licenseNumber: formData.licenseNumber,
        };
      }

      const result = await register(userData);
      
      if (result.success) {
        navigate('/login', {
          state: { message: 'Registration successful! Please login.' },
        });
      } else {
        setServerError(result.error?.message || 'Registration failed');
      }
    } catch (err) {
      setServerError('An error occurred during registration');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Email Address"
                name="email"
                value={formData.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
                InputProps={{
                  startAdornment: <Person sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Role</InputLabel>
                <Select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  label="Role"
                >
                  <MenuItem value="PATIENT">Patient</MenuItem>
                  <MenuItem value="DOCTOR">Doctor</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
              />
            </Grid>
          </Grid>
        );
        
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={!!errors.name}
                helperText={errors.name}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                error={!!errors.phone}
                helperText={errors.phone}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!errors.gender}>
                <InputLabel>Gender</InputLabel>
                <Select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  label="Gender"
                >
                  <MenuItem value="MALE">Male</MenuItem>
                  <MenuItem value="FEMALE">Female</MenuItem>
                  <MenuItem value="OTHER">Other</MenuItem>
                </Select>
                {errors.gender && <FormHelperText>{errors.gender}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                multiline
                rows={3}
                value={formData.address}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        );
        
      case 2:
        return (
          <Grid container spacing={3}>
            {formData.role === 'DOCTOR' ? (
              <>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    label="Specialization"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    error={!!errors.specialization}
                    helperText={errors.specialization}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    label="License Number"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    error={!!errors.licenseNumber}
                    helperText={errors.licenseNumber}
                  />
                </Grid>
              </>
            ) : (
              <>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Blood Group</InputLabel>
                    <Select
                      name="bloodGroup"
                      value={formData.bloodGroup}
                      onChange={handleChange}
                      label="Blood Group"
                    >
                      <MenuItem value="A+">A+</MenuItem>
                      <MenuItem value="A-">A-</MenuItem>
                      <MenuItem value="B+">B+</MenuItem>
                      <MenuItem value="B-">B-</MenuItem>
                      <MenuItem value="AB+">AB+</MenuItem>
                      <MenuItem value="AB-">AB-</MenuItem>
                      <MenuItem value="O+">O+</MenuItem>
                      <MenuItem value="O-">O-</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Allergies (if any)"
                    name="allergies"
                    multiline
                    rows={2}
                    value={formData.allergies}
                    onChange={handleChange}
                    placeholder="List any allergies separated by commas"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Medical History"
                    name="medicalHistory"
                    multiline
                    rows={4}
                    value={formData.medicalHistory}
                    onChange={handleChange}
                    placeholder="Previous illnesses, surgeries, chronic conditions, etc."
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Emergency Contact Name"
                    name="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Emergency Contact Phone"
                    name="emergencyContactPhone"
                    value={formData.emergencyContactPhone}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Insurance Provider"
                    name="insuranceProvider"
                    value={formData.insuranceProvider}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Insurance Number"
                    name="insuranceNumber"
                    value={formData.insuranceNumber}
                    onChange={handleChange}
                  />
                </Grid>
              </>
            )}
          </Grid>
        );
        
      case 3:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <AssignmentInd sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Review Your Information
            </Typography>
            <Paper sx={{ p: 3, mt: 3, textAlign: 'left' }}>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Account Information:</strong>
              </Typography>
              <Typography variant="body2">Email: {formData.email}</Typography>
              <Typography variant="body2">Role: {formData.role}</Typography>
              
              <Typography variant="subtitle1" sx={{ mt: 2 }} gutterBottom>
                <strong>Personal Details:</strong>
              </Typography>
              <Typography variant="body2">Name: {formData.name}</Typography>
              <Typography variant="body2">Phone: {formData.phone}</Typography>
              <Typography variant="body2">Gender: {formData.gender}</Typography>
              
              {formData.role === 'PATIENT' && (
                <>
                  <Typography variant="subtitle1" sx={{ mt: 2 }} gutterBottom>
                    <strong>Medical Information:</strong>
                  </Typography>
                  <Typography variant="body2">Blood Group: {formData.bloodGroup || 'Not specified'}</Typography>
                  <Typography variant="body2">Allergies: {formData.allergies || 'None'}</Typography>
                </>
              )}
              {formData.role === 'DOCTOR' && (
                <>
                  <Typography variant="subtitle1" sx={{ mt: 2 }} gutterBottom>
                    <strong>Professional Information:</strong>
                  </Typography>
                  <Typography variant="body2">Specialization: {formData.specialization || 'Not specified'}</Typography>
                  <Typography variant="body2">License Number: {formData.licenseNumber || 'Not specified'}</Typography>
                </>
              )}
            </Paper>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
              By registering, you agree to our Terms of Service and Privacy Policy.
            </Typography>
          </Box>
        );
        
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          marginTop: 4,
          marginBottom: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: { xs: 3, md: 4 },
            width: '100%',
            borderRadius: 2,
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <LocalHospital sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography component="h1" variant="h4" gutterBottom>
              Join MediHub
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Create your healthcare account in simple steps
            </Typography>
          </Box>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {serverError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {serverError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            {renderStepContent(activeStep)}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                sx={{ mr: 1 }}
              >
                Back
              </Button>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                {activeStep === steps.length - 1 ? (
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                  >
                    Next
                  </Button>
                )}
              </Box>
            </Box>

            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link to="/login" style={{ textDecoration: 'none' }}>
                  Sign in here
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;
