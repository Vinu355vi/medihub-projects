import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, Chip } from '@mui/material';

const DoctorSchedule = ({ appointments = [] }) => {
  if (!appointments.length) {
    return (
      <Box>
        <Typography color="text.secondary">No appointments scheduled for today.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>Today&apos;s Time Slots</Typography>
      <List dense>
        {appointments.map((appointment) => (
          <ListItem key={appointment.id} divider>
            <ListItemText
              primary={appointment.patientName || 'Patient'}
              secondary={`${new Date(appointment.appointmentTime).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })} - ${appointment.visitReason || 'Consultation'}`}
            />
            <Chip size="small" label={appointment.status || 'SCHEDULED'} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default DoctorSchedule;
