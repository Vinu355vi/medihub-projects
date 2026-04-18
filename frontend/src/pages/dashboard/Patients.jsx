import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  IconButton,
  TextField,
  InputAdornment,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid
} from '@mui/material';
import { Search, Visibility } from '@mui/icons-material';
import { patientAPI } from '../../services/api';
import { useAlert } from '../../context/AlertContext';

const Patients = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [newPatient, setNewPatient] = useState({
    name: '',
    email: '',
    password: '',
  });

  const [patientsData, setPatientsData] = useState([]);
  const { showAlert } = useAlert();

  const loadPatients = () => {
    patientAPI.getPatients()
      .then(res => setPatientsData(res.data))
      .catch(() => showAlert('Failed to load patients', 'error'));
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const handleCreatePatient = async () => {
    if (!newPatient.name || !newPatient.email || !newPatient.password) {
      showAlert('All fields are required', 'warning');
      return;
    }
    try {
      await patientAPI.createPatient(newPatient);
      showAlert('Patient created successfully', 'success');
      setOpenAddDialog(false);
      setNewPatient({ name: '', email: '', password: '' });
      loadPatients();
    } catch (error) {
      const msg = error?.response?.data?.message || 'Failed to create patient';
      showAlert(msg, 'error');
    }
  };

  const filteredPatients = patientsData.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewPatient = (patient) => {
    setSelectedPatient(patient);
    setOpenViewDialog(true);
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          My Patients
        </Typography>
        <Button variant="contained" color="primary" onClick={() => setOpenAddDialog(true)}>
          Add New Patient
        </Button>
      </Box>

      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search patients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell>Patient Name</TableCell>
              <TableCell>ID</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPatients.map((patient) => (
              <TableRow key={patient.id} hover>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar>{patient.name.charAt(0)}</Avatar>
                    <Typography variant="subtitle2">{patient.name}</Typography>
                  </Box>
                </TableCell>
                <TableCell>{patient.id}</TableCell>
                <TableCell>
                  <IconButton color="primary" onClick={() => handleViewPatient(patient)}>
                    <Visibility />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Patient Details</DialogTitle>
        <DialogContent dividers>
          {selectedPatient && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">ID</Typography>
                <Typography variant="body1">{selectedPatient.id}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Name</Typography>
                <Typography variant="body1">{selectedPatient.name || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Email</Typography>
                <Typography variant="body1">{selectedPatient.email || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Role</Typography>
                <Typography variant="body1">{selectedPatient.role || '-'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Status</Typography>
                <Typography variant="body1">{selectedPatient.status || '-'}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Patient</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Name"
                value={newPatient.name}
                onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={newPatient.email}
                onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={newPatient.password}
                onChange={(e) => setNewPatient({ ...newPatient, password: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
          <Button onClick={handleCreatePatient} variant="contained" color="primary">Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Patients;
