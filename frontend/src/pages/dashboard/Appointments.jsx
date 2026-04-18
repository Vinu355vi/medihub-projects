// frontend/src/pages/dashboard/Appointments.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  CalendarToday,
  AccessTime,
  Person,
  LocalHospital,
  CheckCircle,
  Cancel,
  Refresh,
  Search,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { appointmentAPI, doctorAPI, patientAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const Appointments = () => {
  const { user, isDoctor, isPatient } = useAuth();
  const { showAlert } = useAlert();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState(dayjs());
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduleSlots, setRescheduleSlots] = useState([]);
  const [doctorProfileId, setDoctorProfileId] = useState(null);
  const [rescheduling, setRescheduling] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    dateFrom: null,
    dateTo: null,
    search: '',
  });

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    const loadDoctorProfile = async () => {
      if (!isDoctor) return;
      try {
        const response = await doctorAPI.getMyProfile();
        if (response?.data?.id) {
          setDoctorProfileId(response.data.id);
        }
      } catch {
        setDoctorProfileId(null);
      }
    };

    loadDoctorProfile();
  }, [isDoctor]);

  useEffect(() => {
    filterAppointments();
  }, [appointments, filters]);

  // Use patientAPI.getAppointments for all appointments
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await patientAPI.getAppointments();
      setAppointments(response.data);
      setFilteredAppointments(response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAppointments = () => {
    let filtered = [...appointments];

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(app => app.status === filters.status);
    }

    // Filter by date range
    if (filters.dateFrom) {
      filtered = filtered.filter(app => 
        dayjs(app.appointmentDate).isSameOrAfter(filters.dateFrom, 'day')
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(app => 
        dayjs(app.appointmentDate).isSameOrBefore(filters.dateTo, 'day')
      );
    }

    // Filter by search
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(app =>
        app.doctorName.toLowerCase().includes(searchTerm) ||
        app.patientName.toLowerCase().includes(searchTerm) ||
        app.symptoms.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredAppointments(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleBookAppointment = () => {
    if (!isPatient) {
      showAlert('Only patients can book appointments', 'warning');
      return;
    }
    navigate('/book-appointment');
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      await appointmentAPI.cancelAppointment(appointmentId, 'Patient cancelled');
      fetchAppointments(); // Refresh list
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    }
  };

  const handleConfirmAppointment = async (appointmentId) => {
    if (!window.confirm('Confirm this appointment?')) {
      return;
    }
    try {
      await appointmentAPI.confirmAppointment(appointmentId);
      showAlert('Appointment confirmed', 'success');
      fetchAppointments();
    } catch (error) {
      console.error('Error confirming appointment:', error);
      showAlert('Failed to confirm appointment', 'error');
    }
  };

  const handleReschedule = (appointment) => {
    setSelectedAppointment(appointment);
    setRescheduleDate(dayjs(appointment.appointmentDate));
    setRescheduleTime('');
    setRescheduleReason('');
    setRescheduleSlots([]);
    setOpenDialog(true);
  };

  const handleViewDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setOpenDetailsDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedAppointment(null);
    setRescheduleDate(dayjs());
    setRescheduleTime('');
    setRescheduleReason('');
    setRescheduleSlots([]);
  };

  const handleCloseDetailsDialog = () => {
    setOpenDetailsDialog(false);
    setSelectedAppointment(null);
  };

  const handleConfirmReschedule = async () => {
    if (!selectedAppointment?.id) return;
    if (!rescheduleDate || !rescheduleTime) {
      showAlert('Please choose new date and time', 'warning');
      return;
    }

    try {
      setRescheduling(true);
      await appointmentAPI.rescheduleAppointment(selectedAppointment.id, {
        date: rescheduleDate.format('YYYY-MM-DD'),
        time: rescheduleTime,
        reason: rescheduleReason,
      });
      showAlert('Appointment rescheduled successfully', 'success');
      handleCloseDialog();
      fetchAppointments();
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to reschedule appointment';
      showAlert(message, 'error');
    } finally {
      setRescheduling(false);
    }
  };

  useEffect(() => {
    const loadRescheduleSlots = async () => {
      if (!openDialog || !rescheduleDate) return;
      const effectiveDoctorId = selectedAppointment?.doctorId || doctorProfileId;
      if (!effectiveDoctorId) return;
      try {
        const response = await appointmentAPI.getAvailableSlots(
          effectiveDoctorId,
          rescheduleDate.format('YYYY-MM-DD')
        );
        const slots = Array.isArray(response.data?.availableSlots) ? response.data.availableSlots : [];
        setRescheduleSlots(slots);
      } catch {
        setRescheduleSlots([]);
        showAlert('Unable to load available slots for selected date', 'error');
      }
    };
    loadRescheduleSlots();
  }, [openDialog, selectedAppointment?.doctorId, doctorProfileId, rescheduleDate]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'SCHEDULED': return 'default';
      case 'CONFIRMED': return 'primary';
      case 'CHECKED_IN': return 'warning';
      case 'IN_PROGRESS': return 'info';
      case 'COMPLETED': return 'success';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'CRITICAL': return 'error';
      case 'URGENT': return 'warning';
      case 'SEMI_URGENT': return 'info';
      case 'ROUTINE': return 'success';
      default: return 'default';
    }
  };

  const upcomingAppointments = filteredAppointments.filter(app =>
    dayjs(app.appointmentDate).isSameOrAfter(dayjs()) &&
    (app.status === 'SCHEDULED' || app.status === 'CONFIRMED')
  );

  const pastAppointments = filteredAppointments.filter(app =>
    dayjs(app.appointmentDate).isBefore(dayjs()) ||
    app.status === 'COMPLETED' ||
    app.status === 'CANCELLED'
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1">
            Appointments
          </Typography>
          {isPatient && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleBookAppointment}
            >
              Book Appointment
            </Button>
          )}
        </Box>
      </Paper>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Search"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="SCHEDULED">Scheduled</MenuItem>
                <MenuItem value="CONFIRMED">Confirmed</MenuItem>
                <MenuItem value="CHECKED_IN">Checked In</MenuItem>
                <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <DatePicker
              label="From Date"
              value={filters.dateFrom}
              onChange={(date) => handleFilterChange('dateFrom', date)}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <DatePicker
              label="To Date"
              value={filters.dateTo}
              onChange={(date) => handleFilterChange('dateTo', date)}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CalendarToday sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4">{appointments.length}</Typography>
              <Typography variant="body2" color="text.secondary">
                Total Appointments
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4">
                {appointments.filter(a => a.status === 'COMPLETED').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AccessTime sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4">
                {upcomingAppointments.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upcoming
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Cancel sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
              <Typography variant="h4">
                {appointments.filter(a => a.status === 'CANCELLED').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Cancelled
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Upcoming Appointments */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Upcoming Appointments
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date & Time</TableCell>
                <TableCell>Doctor</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {upcomingAppointments.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {new Date(appointment.appointmentDate).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(appointment.appointmentTime).toLocaleTimeString()}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Person sx={{ mr: 1, color: 'action.active' }} />
                      {appointment.doctorName}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {appointment.symptoms?.substring(0, 50)}...
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={appointment.triagePriority || 'ROUTINE'}
                      size="small"
                      color={getPriorityColor(appointment.triagePriority)}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={appointment.status}
                      size="small"
                      color={getStatusColor(appointment.status)}
                    />
                  </TableCell>
                  <TableCell>
                    {appointment.status === 'SCHEDULED' || appointment.status === 'CONFIRMED' ? (
                      <Box>
                         {appointment.status === 'SCHEDULED' && (
                             <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              sx={{ mr: 1 }}
                              onClick={() => handleConfirmAppointment(appointment.id)}
                            >
                              Confirm
                            </Button>
                        )}
                        <Button
                          size="small"
                          variant="outlined"
                          sx={{ mr: 1 }}
                          onClick={() => handleReschedule(appointment)}
                        >
                          Reschedule
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => handleCancelAppointment(appointment.id)}
                        >
                          Cancel
                        </Button>
                      </Box>
                    ) : (
                      <Button size="small" variant="outlined" onClick={() => handleViewDetails(appointment)}>
                        View Details
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Past Appointments */}
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Appointment History
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Doctor</TableCell>
                <TableCell>Diagnosis</TableCell>
                <TableCell>Prescription</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pastAppointments.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell>
                    {new Date(appointment.appointmentDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{appointment.doctorName}</TableCell>
                  <TableCell>
                    {appointment.diagnosis?.substring(0, 50) || 'No diagnosis'}
                  </TableCell>
                  <TableCell>
                    {appointment.prescription ? 'Available' : 'Not provided'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={appointment.status}
                      size="small"
                      color={getStatusColor(appointment.status)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button size="small" variant="outlined" onClick={() => handleViewDetails(appointment)}>
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Reschedule Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Reschedule Appointment</DialogTitle>
        <DialogContent>
          {selectedAppointment && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body1" gutterBottom>
                Current appointment: {new Date(selectedAppointment.appointmentDate).toLocaleDateString()} at{' '}
                {new Date(selectedAppointment.appointmentTime).toLocaleTimeString()}
              </Typography>
              
                <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12}>
                  <DatePicker
                    label="New Date"
                    value={rescheduleDate}
                    onChange={(value) => {
                      setRescheduleDate(value || dayjs());
                      setRescheduleTime('');
                    }}
                    minDate={dayjs()}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>New Time Slot</InputLabel>
                    <Select
                      label="New Time Slot"
                      value={rescheduleTime}
                      onChange={(e) => setRescheduleTime(e.target.value)}
                    >
                      {rescheduleSlots.map((slot) => (
                        <MenuItem key={slot} value={slot}>{slot}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Reason for Rescheduling"
                    value={rescheduleReason}
                    onChange={(e) => setRescheduleReason(e.target.value)}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleConfirmReschedule} variant="contained" disabled={rescheduling}>
            Confirm Reschedule
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDetailsDialog} onClose={handleCloseDetailsDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Appointment Details</DialogTitle>
        <DialogContent dividers>
          {selectedAppointment && (
            <Box>
              <Typography><strong>ID:</strong> {selectedAppointment.id}</Typography>
              <Typography><strong>Doctor:</strong> {selectedAppointment.doctorName || '-'}</Typography>
              <Typography><strong>Patient:</strong> {selectedAppointment.patientName || '-'}</Typography>
              <Typography><strong>Date:</strong> {new Date(selectedAppointment.appointmentDate).toLocaleDateString()}</Typography>
              <Typography><strong>Time:</strong> {new Date(selectedAppointment.appointmentTime).toLocaleTimeString()}</Typography>
              <Typography><strong>Status:</strong> {selectedAppointment.status || '-'}</Typography>
              <Typography><strong>Reason:</strong> {selectedAppointment.type || selectedAppointment.symptoms || '-'}</Typography>
              <Typography><strong>Diagnosis:</strong> {selectedAppointment.diagnosis || '-'}</Typography>
              <Typography><strong>Prescription:</strong> {selectedAppointment.prescription || '-'}</Typography>
              <Typography><strong>Priority:</strong> {selectedAppointment.triagePriority || '-'}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailsDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Appointments;
