import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  Card,
  CardContent,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Divider,
} from '@mui/material';
import {
  Person,
  Event,
  CheckCircle,
  MedicalServices,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import { aiAPI, appointmentAPI, doctorAPI, patientAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const BookAppointment = () => {
  const { user, isAuthenticated } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const [specializations, setSpecializations] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [patientId, setPatientId] = useState(null);
  const [triage, setTriage] = useState(null);
  const [recommendedDoctors, setRecommendedDoctors] = useState([]);
  const [slotConflict, setSlotConflict] = useState(null);

  const [formData, setFormData] = useState({
    department: '',
    doctorId: '',
    date: dayjs(),
    time: '',
    reason: '',
    patientAge: '',
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const steps = ['Select Service', 'Patient Details', 'Confirm'];

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setErrorMessage('');
        const [specializationsResponse, patientResponse] = await Promise.all([
          doctorAPI.getSpecializations(),
          patientAPI.getMyProfile(),
        ]);

        setSpecializations(Array.isArray(specializationsResponse.data) ? specializationsResponse.data : []);
        setPatientId(patientResponse.data?.id ?? null);
        setFormData((prev) => ({
          ...prev,
          name: patientResponse.data?.name || user?.name || prev.name,
          email: patientResponse.data?.email || user?.email || prev.email,
        }));

        const storedTriage = localStorage.getItem('aiTriageContext');
        if (storedTriage) {
          try {
            const parsed = JSON.parse(storedTriage);
            if (parsed?.symptoms) {
              setFormData((prev) => ({ ...prev, reason: parsed.symptoms }));
            }
            if (parsed?.triageScore) {
              setTriage(parsed.triageScore);
            }
          } catch (ignored) {
            // Ignore malformed local AI context.
          }
        }
      } catch (error) {
        if (!isAuthenticated) {
          setErrorMessage('Please login as a patient to book appointments.');
          return;
        }
        const apiMessage = error?.response?.data?.message;
        setErrorMessage(apiMessage || 'Unable to load booking details.');
      }
    };

    loadInitialData();
  }, [isAuthenticated, user?.email, user?.name]);

  useEffect(() => {
    const loadDoctorsBySpecialization = async () => {
      if (!formData.department) {
        setDoctors([]);
        setFormData((prev) => ({ ...prev, doctorId: '', time: '' }));
        return;
      }

      try {
        const response = await doctorAPI.getAllDoctors({ specialty: formData.department });
        setDoctors(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        setDoctors([]);
        setErrorMessage(error?.response?.data?.message || 'Unable to load doctors for this specialization.');
      }

      setFormData((prev) => ({ ...prev, doctorId: '', time: '' }));
      setTimeSlots([]);
    };

    loadDoctorsBySpecialization();
  }, [formData.department]);

  useEffect(() => {
    const loadSlots = async () => {
      if (!formData.doctorId || !formData.date) {
        setTimeSlots([]);
        setFormData((prev) => ({ ...prev, time: '' }));
        return;
      }

      try {
        const response = await appointmentAPI.getAvailableSlots(
          Number(formData.doctorId),
          formData.date.format('YYYY-MM-DD')
        );
        const slots = Array.isArray(response.data?.availableSlots) ? response.data.availableSlots : [];
        setTimeSlots(slots);
        setFormData((prev) => ({
          ...prev,
          time: slots.includes(prev.time) ? prev.time : '',
        }));
      } catch (error) {
        setTimeSlots([]);
        setFormData((prev) => ({ ...prev, time: '' }));
        setErrorMessage(error?.response?.data?.message || 'Unable to load available slots.');
      }
    };

    loadSlots();
  }, [formData.doctorId, formData.date]);

  useEffect(() => {
    if (!formData.reason || formData.reason.trim().length < 3) {
      setTriage(null);
      setRecommendedDoctors([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const [triageRes, recommendationRes] = await Promise.all([
          aiAPI.getTriageScore(formData.reason, formData.patientAge ? Number(formData.patientAge) : undefined),
          aiAPI.getDoctorRecommendation({
            symptoms: formData.reason,
            specialization: formData.department || undefined,
          }),
        ]);

        setTriage(triageRes.data?.triageScore || null);
        const recRows = Array.isArray(recommendationRes.data?.recommendations)
          ? recommendationRes.data.recommendations
          : [];
        setRecommendedDoctors(recRows);
      } catch {
        setTriage(null);
        setRecommendedDoctors([]);
      }
    }, 450);

    return () => clearTimeout(timeout);
  }, [formData.reason, formData.patientAge, formData.department]);

  const selectedDoctor = useMemo(
    () => doctors.find((doctor) => String(doctor.id) === String(formData.doctorId)),
    [doctors, formData.doctorId]
  );

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleDateChange = (newDate) => {
    setFormData((prev) => ({ ...prev, date: newDate || dayjs() }));
  };

  const handleSubmit = async () => {
    if (!patientId) {
      setErrorMessage('Patient profile not found. Please login with a patient account.');
      return;
    }

    try {
      setSaving(true);
      setErrorMessage('');

      await appointmentAPI.bookAppointment({
        doctorId: Number(formData.doctorId),
        patientId,
        appointmentDate: formData.date.format('YYYY-MM-DD'),
        appointmentTime: formData.time,
        visitReason: formData.reason,
        symptoms: formData.reason,
      });

      setSlotConflict(null);
      setActiveStep(0);
      setDoctors([]);
      setTimeSlots([]);
      setFormData({
        department: '',
        doctorId: '',
        date: dayjs(),
        time: '',
        reason: '',
        patientAge: '',
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
      });
      setTriage(null);
      setRecommendedDoctors([]);
      toast.success('Appointment booked successfully');
    } catch (error) {
      const conflictPayload = error?.response?.status === 409 ? error?.response?.data : null;
      if (conflictPayload?.recommendedSlots) {
        setSlotConflict(conflictPayload);
      }
      const message = conflictPayload?.message || error?.response?.data?.message || 'Failed to book appointment.';
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Specialization"
                value={formData.department}
                onChange={handleChange('department')}
              >
                {specializations.length > 0 ? (
                  specializations.map((specialization) => (
                    <MenuItem key={specialization} value={specialization}>{specialization}</MenuItem>
                  ))
                ) : (
                  <MenuItem value="" disabled>No specializations available</MenuItem>
                )}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Doctor"
                value={formData.doctorId}
                onChange={handleChange('doctorId')}
                disabled={!formData.department}
              >
                {doctors.length > 0 ? (
                  doctors.map((doctor) => (
                    <MenuItem key={doctor.id} value={doctor.id}>{doctor.name}</MenuItem>
                  ))
                ) : (
                  <MenuItem value="" disabled>No doctors available</MenuItem>
                )}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ width: '100%' }}>
                <DatePicker
                  label="Appointment Date"
                  value={formData.date}
                  onChange={handleDateChange}
                  slotProps={{ textField: { fullWidth: true } }}
                  minDate={dayjs()}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Time Slot"
                value={formData.time}
                onChange={handleChange('time')}
                disabled={!formData.doctorId}
              >
                {timeSlots.length > 0 ? (
                  timeSlots.map((time) => (
                    <MenuItem key={time} value={time}>{time}</MenuItem>
                  ))
                ) : (
                  <MenuItem value="" disabled>No available time slots</MenuItem>
                )}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Reason for Visit"
                value={formData.reason}
                onChange={handleChange('reason')}
                placeholder="Briefly describe your symptoms or reason for appointment..."
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Patient Age"
                value={formData.patientAge}
                onChange={handleChange('patientAge')}
              />
            </Grid>
            {triage && (
              <Grid item xs={12} md={8}>
                <Alert severity={triage.urgencyLevel === 'Critical' ? 'error' : triage.urgencyLevel === 'Urgent' ? 'warning' : 'info'}>
                  Risk Score: {triage.riskScore} | Urgency: {triage.urgencyLevel} | {triage.recommendedAction}
                </Alert>
              </Grid>
            )}
            {recommendedDoctors.length > 0 && (
              <Grid item xs={12}>
                <Alert severity="success">
                  AI Recommended: {recommendedDoctors[0]?.doctor?.name || 'Specialist'} ({recommendedDoctors[0]?.doctor?.specialization || '-'})
                  {recommendedDoctors[0]?.doctor?.id && (
                    <Button
                      size="small"
                      sx={{ ml: 2 }}
                      onClick={() => setFormData((prev) => ({ ...prev, doctorId: recommendedDoctors[0].doctor.id }))}
                    >
                      Use Recommendation
                    </Button>
                  )}
                </Alert>
              </Grid>
            )}
            {slotConflict?.recommendedSlots?.length > 0 && (
              <Grid item xs={12}>
                <Alert severity="warning">
                  Requested slot is unavailable. Suggested slots:
                  <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {slotConflict.recommendedSlots.map((slot, idx) => (
                      <Button
                        key={`${slot.date}-${slot.time}-${idx}`}
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            date: dayjs(slot.date),
                            time: slot.time,
                            doctorId: slot.doctorId || prev.doctorId,
                          }));
                          setSlotConflict(null);
                        }}
                      >
                        {slot.date} {slot.time}
                      </Button>
                    ))}
                  </Box>
                </Alert>
              </Grid>
            )}
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom color="primary">
                Please provide patient information
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Full Name"
                value={formData.name}
                onChange={handleChange('name')}
                InputProps={{
                  startAdornment: <Person sx={{ color: 'action.active', mr: 1 }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={formData.phone}
                onChange={handleChange('phone')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email Address"
                value={formData.email}
                onChange={handleChange('email')}
                type="email"
              />
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              Please review your appointment details before confirming.
            </Alert>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom><MedicalServices sx={{ mr: 1, verticalAlign: 'middle' }} /> Service Details</Typography>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="body2" color="text.secondary">Specialization</Typography>
                    <Typography variant="body1" gutterBottom>{formData.department || '-'}</Typography>

                    <Typography variant="body2" color="text.secondary">Doctor</Typography>
                    <Typography variant="body1" gutterBottom>{selectedDoctor?.name || '-'}</Typography>

                    <Typography variant="body2" color="text.secondary">Reason</Typography>
                    <Typography variant="body1">{formData.reason || '-'}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom><Event sx={{ mr: 1, verticalAlign: 'middle' }} /> Date & Time</Typography>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="body2" color="text.secondary">Date</Typography>
                    <Typography variant="body1" gutterBottom>{formData.date.format('dddd, MMMM D, YYYY')}</Typography>

                    <Typography variant="body2" color="text.secondary">Time</Typography>
                    <Typography variant="body1">{formData.time || '-'}</Typography>
                  </CardContent>
                </Card>
                <Box mt={2}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom><Person sx={{ mr: 1, verticalAlign: 'middle' }} /> Patient</Typography>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="body1">{formData.name || '-'}</Typography>
                      <Typography variant="body2" color="text.secondary">{formData.phone || '-'} | {formData.email || '-'}</Typography>
                    </CardContent>
                  </Card>
                </Box>
              </Grid>
            </Grid>
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" align="center" gutterBottom color="primary">
        Book an Appointment
      </Typography>
      <Typography variant="h6" align="center" color="text.secondary" paragraph>
        Schedule your visit with our specialists in just a few steps.
      </Typography>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage('')}>
          {errorMessage}
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 5 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box>
          {renderStepContent(activeStep)}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4, gap: 2 }}>
            <Button
              disabled={activeStep === 0 || saving}
              onClick={handleBack}
              variant="outlined"
            >
              Back
            </Button>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                startIcon={<CheckCircle />}
                disabled={saving || !patientId}
              >
                Confirm Appointment
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={
                  saving ||
                  (activeStep === 0 && (!formData.department || !formData.doctorId || !formData.time)) ||
                  (activeStep === 1 && (!formData.name || !formData.phone || !formData.email))
                }
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

    </Container>
  );
};

export default BookAppointment;
