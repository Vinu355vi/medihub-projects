import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Grid, Paper } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { analyticsAPI } from '../../services/api';
import { useAlert } from '../../context/AlertContext';

const COLORS = ['#1976d2', '#2e7d32', '#ed6c02', '#d32f2f', '#6a1b9a'];

const Analytics = () => {
  const { showAlert } = useAlert();
  const [appointmentByDoctor, setAppointmentByDoctor] = useState([]);
  const [appointmentByStatus, setAppointmentByStatus] = useState([]);
  const [healthMetricsData, setHealthMetricsData] = useState([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [appointmentsRes, healthRes] = await Promise.all([
          analyticsAPI.getAppointmentAnalytics(),
          analyticsAPI.getHealthMetrics(),
        ]);

        const appointmentData = appointmentsRes.data || {};
        const byDoctor = appointmentData.byDoctor || {};
        const byStatus = appointmentData.byStatus || {};

        setAppointmentByDoctor(
          Object.entries(byDoctor).map(([name, appointments]) => ({
            name,
            appointments: Number(appointments || 0),
          }))
        );

        setAppointmentByStatus(
          Object.entries(byStatus).map(([name, value]) => ({
            name,
            value: Number(value || 0),
          }))
        );

        const metrics = Array.isArray(healthRes.data?.metrics) ? healthRes.data.metrics : [];
        setHealthMetricsData(
          metrics.map((metric, index) => ({
            index: index + 1,
            metric: metric.metric || `metric-${index + 1}`,
            value: Number(metric.value || 0),
          }))
        );
      } catch (error) {
        setAppointmentByDoctor([]);
        setAppointmentByStatus([]);
        setHealthMetricsData([]);
        showAlert('Failed to load analytics', 'error');
      }
    };

    fetchAnalytics();
  }, []);

  const hasAppointmentDoctorData = useMemo(() => appointmentByDoctor.length > 0, [appointmentByDoctor]);
  const hasAppointmentStatusData = useMemo(() => appointmentByStatus.length > 0, [appointmentByStatus]);
  const hasHealthMetricsData = useMemo(() => healthMetricsData.length > 0, [healthMetricsData]);

  return (
    <Box p={3}>
      <Typography variant="h4" component="h1" gutterBottom>
        Analytics Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Appointments by Doctor
            </Typography>
            <Box height={300}>
              {hasAppointmentDoctorData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={appointmentByDoctor}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="appointments" fill="#1976d2" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Typography color="text.secondary">No real-time appointment data available.</Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Appointment Status Distribution
            </Typography>
            <Box height={300}>
              {hasAppointmentStatusData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={appointmentByStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {appointmentByStatus.map((entry, index) => (
                        <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Typography color="text.secondary">No real-time status data available.</Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Health Metrics
            </Typography>
            <Box height={320}>
              {hasHealthMetricsData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={healthMetricsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="metric" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#2e7d32" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Typography color="text.secondary">No real-time health metrics available.</Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Analytics;
