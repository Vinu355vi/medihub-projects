import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  TextField,
  InputAdornment,
  Chip,
  Rating,
  Alert,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { doctorAPI } from '../services/api';

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');

  useEffect(() => {
    loadSpecializations();
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [selectedSpecialization]);

  const loadSpecializations = async () => {
    try {
      const response = await doctorAPI.getSpecializations();
      setSpecializations(Array.isArray(response.data) ? response.data : []);
    } catch (e) {
      setSpecializations([]);
    }
  };

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError('');
      const params = selectedSpecialization ? { specialty: selectedSpecialization } : undefined;
      const response = await doctorAPI.getAllDoctors(params);
      setDoctors(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setDoctors([]);
      setError(error?.response?.data?.message || 'Unable to fetch doctors right now.');
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter((doctor) => {
    const name = (doctor?.name || '').toLowerCase();
    const specialization = (doctor?.specialization || '').toLowerCase();
    const q = searchTerm.toLowerCase();
    return name.includes(q) || specialization.includes(q);
  });

  return (
    <Container sx={{ py: 4, maxWidth: '1200px', mx: 'auto' }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Our Specialists
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          Meet our team of experienced doctors dedicated to your health
        </Typography>
        
        <TextField
          fullWidth
          placeholder="Search by name or specialization..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ maxWidth: 600, mt: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />

        <TextField
          select
          value={selectedSpecialization}
          onChange={(e) => setSelectedSpecialization(e.target.value)}
          sx={{ maxWidth: 360, mt: 2, ml: { xs: 0, md: 2 } }}
          label="Filter by Specialization"
        >
          <MenuItem value="">All Specializations</MenuItem>
          {specializations.map((item) => (
            <MenuItem key={item} value={item}>{item}</MenuItem>
          ))}
        </TextField>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      <Grid container spacing={4}>
        {!loading && filteredDoctors.map((doctor) => (
          <Grid item key={doctor.id} xs={12} sm={6} md={4} lg={3}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', transition: '0.3s', '&:hover': { transform: 'translateY(-5px)', boxShadow: 6 } }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h6" component="h2" fontWeight="bold">
                  {doctor.name}
                </Typography>
                <Chip 
                  label={doctor.specialization || 'General Medicine'} 
                  color="primary" 
                  size="small" 
                  sx={{ mb: 1, borderRadius: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  Experience: {doctor.experience || 0} years
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {doctor.availability || 'Available'}
                </Typography>
              </CardContent>
              <Box sx={{ p: 2, pt: 0 }}>
                <Button 
                  component={Link} 
                  to="/book-appointment" 
                  variant="outlined" 
                  fullWidth
                >
                  Book Appointment
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {!loading && !error && filteredDoctors.length === 0 && (
        <Typography align="center" color="text.secondary" sx={{ py: 6 }}>
          No doctors found for the selected filter.
        </Typography>
      )}
    </Container>
  );
};

export default Doctors;
