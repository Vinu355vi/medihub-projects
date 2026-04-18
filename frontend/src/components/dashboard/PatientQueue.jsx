import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, Chip } from '@mui/material';

const PatientQueue = ({ appointments = [] }) => {
  if (!appointments.length) {
    return <Typography color="text.secondary">No patients in queue.</Typography>;
  }

  return (
    <Box>
      <List>
        {appointments.map((appointment) => (
          <ListItem key={appointment.id} divider>
            <ListItemText
              primary={appointment.patientName || 'Patient'}
              secondary={appointment.visitReason || 'Consultation'}
            />
            <Chip label={appointment.status} size="small" />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default PatientQueue;
