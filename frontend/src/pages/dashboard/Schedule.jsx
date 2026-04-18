import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Alert,
} from '@mui/material';
import { ChevronLeft, ChevronRight, AccessTime } from '@mui/icons-material';
import dayjs from 'dayjs';
import { appointmentAPI } from '../../services/api';
import { useAlert } from '../../context/AlertContext';

const Schedule = () => {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [scheduleData, setScheduleData] = useState([]);
  const { showAlert } = useAlert();

  useEffect(() => {
    loadSchedule();
  }, [selectedDate]);

  const loadSchedule = async () => {
    try {
      const response = await appointmentAPI.getDoctorSchedule(selectedDate.format('YYYY-MM-DD'));
      setScheduleData(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setScheduleData([]);
      showAlert('Failed to load schedule', 'error');
    }
  };

  const handlePrevDay = () => setSelectedDate((d) => d.subtract(1, 'day'));
  const handleNextDay = () => setSelectedDate((d) => d.add(1, 'day'));

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          My Schedule
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={handlePrevDay}><ChevronLeft /></IconButton>
          <Typography variant="h6">{selectedDate.format('dddd, MMMM D, YYYY')}</Typography>
          <IconButton onClick={handleNextDay}><ChevronRight /></IconButton>
        </Box>
      </Box>

      {!scheduleData.length && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No appointments scheduled for this day.
        </Alert>
      )}

      <Grid container spacing={3}>
        {scheduleData.map((slot) => (
          <Grid item xs={12} md={4} key={slot.id}>
            <Card elevation={2} sx={{ borderLeft: 6, borderColor: 'primary.main' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <AccessTime color="action" fontSize="small" />
                    <Typography variant="h6">
                      {new Date(`${slot.appointmentDate}T${slot.appointmentTime}`).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Typography>
                  </Box>
                  <Chip label={slot.status || 'SCHEDULED'} size="small" color="primary" />
                </Box>

                <Typography variant="subtitle1" fontWeight="bold">
                  {slot.patientName || 'Patient'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {slot.visitReason || 'Consultation'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Schedule;
