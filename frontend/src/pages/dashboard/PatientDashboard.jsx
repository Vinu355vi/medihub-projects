import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Avatar,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  CalendarToday,
  LocalHospital,
  Medication,
  AccessTime,
  TrendingUp,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { patientAPI } from '../../services/api';
import AppointmentCalendar from '../../components/dashboard/AppointmentCalendar';
import HealthStatsChart from '../../components/dashboard/HealthStatsChart';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    completedAppointments: 0,
    pendingPrescriptions: 0,
    healthScore: 85,
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, appointmentsRes] = await Promise.all([
        patientAPI.getDashboardStats(),
        patientAPI.getRecentAppointments(),
      ]);
      setStats(statsRes.data);
      setRecentAppointments(appointmentsRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, color, subtitle }) => (
    <Card sx={{ height: '100%', borderRadius: 2, boxShadow: 2 }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar sx={{ bgcolor: `${color}.light`, mr: 2 }}>
            <Icon sx={{ color: `${color}.dark` }} />
          </Avatar>
          <Typography variant="h6" color="text.secondary">
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" gutterBottom>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return <LinearProgress />;
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Welcome Section */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Grid container alignItems="center" spacing={2}>
          <Grid item>
            <Avatar sx={{ width: 80, height: 80, bgcolor: 'white' }}>
              <LocalHospital sx={{ fontSize: 40, color: '#667eea' }} />
            </Avatar>
          </Grid>
          <Grid item xs>
            <Typography variant="h4" color="white" gutterBottom>
              Welcome back, {user?.name}!
            </Typography>
            <Typography variant="body1" color="white" sx={{ opacity: 0.9 }}>
              Your health journey matters. Stay on track with your appointments and medications.
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="secondary"
              size="large"
              onClick={() => navigate('/book-appointment')}
            >
              Book Appointment
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Stats Grid */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={CalendarToday}
            title="Upcoming"
            value={stats.upcomingAppointments}
            color="primary"
            subtitle="Appointments"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={AccessTime}
            title="Completed"
            value={stats.completedAppointments}
            color="success"
            subtitle="Visits"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={Medication}
            title="Pending"
            value={stats.pendingPrescriptions}
            color="warning"
            subtitle="Prescriptions"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={TrendingUp}
            title="Health Score"
            value={`${stats.healthScore}%`}
            color="info"
            subtitle="Overall wellness"
          />
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Left Column - Appointments */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Recent Appointments
            </Typography>
            <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
              {recentAppointments.map((appointment) => (
                <Card key={appointment.id} sx={{ mb: 2, p: 2 }}>
                  <Grid container alignItems="center" spacing={2}>
                    <Grid item>
                      <Avatar src={appointment.doctor?.image} />
                    </Grid>
                    <Grid item xs>
                      <Typography variant="subtitle1">
                        Dr. {appointment.doctor?.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {appointment.specialization}
                      </Typography>
                    </Grid>
                    <Grid item>
                      <Chip
                        label={appointment.status}
                        color={
                          appointment.status === 'COMPLETED' ? 'success' :
                          appointment.status === 'PENDING' ? 'warning' : 'default'
                        }
                        size="small"
                      />
                    </Grid>
                    <Grid item>
                      <Typography variant="body2">
                        {new Date(appointment.date).toLocaleDateString()}
                      </Typography>
                    </Grid>
                  </Grid>
                </Card>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Right Column - Calendar & Health */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Appointment Calendar
            </Typography>
            <AppointmentCalendar />
          </Paper>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Health Trends
            </Typography>
            <HealthStatsChart />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PatientDashboard;
