// frontend/src/components/charts/HealthMetricsChart.jsx
import React from 'react';
import { Paper, Typography, Box, Grid } from '@mui/material';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const HealthMetricsChart = ({ patientId, metrics = [] }) => {
  // Sample data - replace with actual API call
  const bloodPressureData = [
    { date: 'Jan', systolic: 120, diastolic: 80 },
    { date: 'Feb', systolic: 118, diastolic: 78 },
    { date: 'Mar', systolic: 122, diastolic: 82 },
    { date: 'Apr', systolic: 119, diastolic: 79 },
    { date: 'May', systolic: 121, diastolic: 81 },
    { date: 'Jun', systolic: 117, diastolic: 77 },
  ];

  const weightData = [
    { date: 'Jan', weight: 70 },
    { date: 'Feb', weight: 69.5 },
    { date: 'Mar', weight: 69 },
    { date: 'Apr', weight: 68.5 },
    { date: 'May', weight: 68 },
    { date: 'Jun', weight: 67.5 },
  ];

  const bmiData = [
    { date: 'Jan', bmi: 24.5 },
    { date: 'Feb', bmi: 24.3 },
    { date: 'Mar', bmi: 24.1 },
    { date: 'Apr', bmi: 23.9 },
    { date: 'May', bmi: 23.7 },
    { date: 'Jun', bmi: 23.5 },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 2 }}>
          <Typography variant="body2">{`Date: ${label}`}</Typography>
          {payload.map((entry, index) => (
            <Typography key={index} variant="body2" style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}`}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Blood Pressure Trend
          </Typography>
          <Box sx={{ width: '100%', height: 200 }}>
            <ResponsiveContainer>
              <AreaChart data={bloodPressureData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="systolic" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                <Area type="monotone" dataKey="diastolic" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>

      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Weight Trend (kg)
          </Typography>
          <Box sx={{ width: '100%', height: 200 }}>
            <ResponsiveContainer>
              <LineChart data={weightData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="weight" stroke="#ff7300" />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>

      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            BMI Trend
          </Typography>
          <Box sx={{ width: '100%', height: 200 }}>
            <ResponsiveContainer>
              <LineChart data={bmiData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="bmi" stroke="#387908" />
                <Line type="monotone" dataKey="normal" stroke="#82ca9d" strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default HealthMetricsChart;