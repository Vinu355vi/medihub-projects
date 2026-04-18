// frontend/src/pages/dashboard/DoctorDashboard.jsx
import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Tabs,
  Tab,
} from '@mui/material';
import {
  AccessTime,
  CalendarToday,
  TrendingUp,
  LocalHospital,
  CheckCircle,
  Refresh,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { appointmentAPI } from '../../services/api';
import DoctorSchedule from '../../components/dashboard/DoctorSchedule';
import PatientQueue from '../../components/dashboard/PatientQueue';
import StatsCard from '../../components/common/StatsCard';
import { useAlert } from '../../context/AlertContext';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [tabValue, setTabValue] = useState(0);
  const [stats, setStats] = useState({
    todayAppointments: 0,
    completedToday: 0,
    waitingPatients: 0,
    averageRating: 0,
  });
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const urgencyRank = (appointment) => {
    const urgency = String(
      appointment?.triageUrgencySnapshot
      || appointment?.triagePriority
      || 'ROUTINE'
    ).toUpperCase();
    if (urgency.includes('CRITICAL')) return 4;
    if (urgency.includes('URGENT')) return 3;
    if (urgency.includes('SEMI')) return 2;
    return 1;
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];

    const [todayRes, upcomingRes] = await Promise.allSettled([
      appointmentAPI.getDoctorSchedule(today),
      appointmentAPI.getUpcomingAppointments(),
    ]);

    if (todayRes.status === 'fulfilled') {
      setTodayAppointments(Array.isArray(todayRes.value.data) ? todayRes.value.data : []);
    } else {
      setTodayAppointments([]);
      showAlert('Failed to load today\'s schedule', 'error');
    }

    if (upcomingRes.status === 'fulfilled') {
      setUpcomingAppointments(Array.isArray(upcomingRes.value.data) ? upcomingRes.value.data : []);
    } else {
      setUpcomingAppointments([]);
      showAlert('Failed to load upcoming appointments', 'error');
    }

    const todayList = todayRes.status === 'fulfilled' && Array.isArray(todayRes.value.data) ? todayRes.value.data : [];
    setStats({
      todayAppointments: todayList.length,
      completedToday: todayList.filter((a) => a.status === 'COMPLETED').length,
      waitingPatients: todayList.filter((a) => a.status === 'CHECKED_IN' || a.status === 'IN_PROGRESS').length,
      averageRating: 0,
    });

    setLoading(false);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleCheckIn = async (appointmentId) => {
    try {
      await appointmentAPI.checkInAppointment(appointmentId);
      fetchDashboardData();
    } catch (error) {
      showAlert('Error checking in patient', 'error');
    }
  };

  const handleComplete = async (appointmentId) => {
    try {
      await appointmentAPI.completeAppointment(appointmentId, { diagnosis: '', prescription: '', notes: '' });
      fetchDashboardData();
    } catch (error) {
      showAlert('Error completing appointment', 'error');
    }
  };

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

  const sortedTodayAppointments = [...todayAppointments].sort((a, b) => {
    const urgencyDiff = urgencyRank(b) - urgencyRank(a);
    if (urgencyDiff !== 0) return urgencyDiff;
    return new Date(a.appointmentTime).getTime() - new Date(b.appointmentTime).getTime();
  });

  const sortedUpcomingAppointments = [...upcomingAppointments].sort((a, b) => {
    const urgencyDiff = urgencyRank(b) - urgencyRank(a);
    if (urgencyDiff !== 0) return urgencyDiff;
    return new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime();
  });

  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2, bgcolor: 'primary.main', color: 'white' }}>
        <Grid container alignItems="center" spacing={2}>
          <Grid item>
            <Avatar sx={{ width: 80, height: 80, bgcolor: 'white' }}>
              <LocalHospital sx={{ fontSize: 40, color: 'primary.main' }} />
            </Avatar>
          </Grid>
          <Grid item xs>
            <Typography variant="h4" gutterBottom>
              Welcome, Dr. {user?.name}!
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Real-time schedule and appointment overview for your account
            </Typography>
          </Grid>
          <Grid item>
            <Button variant="contained" color="secondary" startIcon={<Refresh />} onClick={fetchDashboardData}>
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard title="Today's Appointments" value={stats.todayAppointments} icon={<CalendarToday />} subtitle="Total scheduled" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard title="Completed" value={stats.completedToday} icon={<CheckCircle />} subtitle="Today" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard title="Waiting" value={stats.waitingPatients} icon={<AccessTime />} subtitle="In queue" />
        </Grid>
      </Grid>

      <Paper sx={{ mb: 4, borderRadius: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Today's Schedule" />
          <Tab label="Patient Queue" />
          <Tab label="Upcoming Appointments" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {tabValue === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Time</TableCell>
                        <TableCell>Patient</TableCell>
                        <TableCell>Reason</TableCell>
                        <TableCell>Priority</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sortedTodayAppointments.map((appointment) => (
                        <TableRow key={appointment.id}>
                          <TableCell>
                            {new Date(appointment.appointmentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar sx={{ width: 32, height: 32, mr: 1 }}>{appointment.patientName?.charAt(0)}</Avatar>
                              {appointment.patientName}
                            </Box>
                          </TableCell>
                          <TableCell>{appointment.visitReason || 'Consultation'}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              <Chip label={appointment.triagePriority || 'ROUTINE'} size="small" />
                              <Chip label={appointment.triageUrgencySnapshot || 'Routine'} size="small" color="warning" />
                              <Chip label={`Risk ${appointment.triageRiskScoreSnapshot || appointment.triageScore || '-'}`} size="small" variant="outlined" />
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip label={appointment.status} size="small" color={getStatusColor(appointment.status)} />
                          </TableCell>
                          <TableCell>
                            {appointment.status === 'CONFIRMED' && (
                              <Button size="small" variant="outlined" onClick={() => handleCheckIn(appointment.id)}>
                                Check In
                              </Button>
                            )}
                            {appointment.status === 'IN_PROGRESS' && (
                              <Button size="small" variant="contained" color="success" onClick={() => handleComplete(appointment.id)}>
                                Complete
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              <Grid item xs={12} md={4}>
                <DoctorSchedule appointments={todayAppointments} />
              </Grid>
            </Grid>
          )}

          {tabValue === 1 && (
            <PatientQueue appointments={sortedTodayAppointments.filter((a) => a.status === 'CHECKED_IN' || a.status === 'IN_PROGRESS')} />
          )}

          {tabValue === 2 && (
            <Grid container spacing={3}>
              {sortedUpcomingAppointments.map((appointment) => (
                <Grid item xs={12} md={6} key={appointment.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6">{appointment.patientName}</Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Chip label={appointment.triagePriority || 'ROUTINE'} size="small" />
                          <Chip label={appointment.triageUrgencySnapshot || 'Routine'} size="small" color="warning" />
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {new Date(appointment.appointmentDate).toLocaleDateString()} at{' '}
                        {new Date(appointment.appointmentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Risk Score: {appointment.triageRiskScoreSnapshot || appointment.triageScore || '-'}
                      </Typography>
                      <Typography variant="body2">{appointment.symptoms || 'No symptoms listed'}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default DoctorDashboard;
