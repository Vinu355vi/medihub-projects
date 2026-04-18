// frontend/src/pages/Home.jsx
import React from 'react';
import {
  Container,
  Grid,
  Typography,
  Button,
  Card,
  CardContent,
  Box,
  IconButton,
} from '@mui/material';
import {
  LocalHospital,
  Schedule,
  Medication,
  Security,
  People,
  TrendingUp,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

const Home = () => {
  const features = [
    {
      icon: <Schedule fontSize="large" />,
      title: 'Smart Appointment Booking',
      description: 'AI-powered scheduling with real-time availability',
    },
    {
      icon: <Medication fontSize="large" />,
      title: 'Online Pharmacy',
      description: 'Medicine delivery with drug interaction alerts',
    },
    {
      icon: <Security fontSize="large" />,
      title: 'Secure & Private',
      description: 'Bank-level security for your medical data',
    },
    {
      icon: <TrendingUp fontSize="large" />,
      title: 'AI Health Insights',
      description: 'Personalized health recommendations',
    },
  ];

  return (
    <Container maxWidth="xl">
      {/* Hero Section */}
      <Box
        sx={{
          pt: 8,
          pb: 6,
          textAlign: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 4,
          color: 'white',
          mb: 8,
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom>
          Welcome to MediHub
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 4 }}>
          AI-Powered Hospital Management System
        </Typography>
        <Box sx={{ mt: 4 }}>
          <Button
            variant="contained"
            color="secondary"
            size="large"
            component={Link}
            to="/book-appointment"
            sx={{ mr: 2 }}
          >
            Book Appointment
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            size="large"
            component={Link}
            to="/pharmacy"
          >
            Visit Pharmacy
          </Button>
        </Box>
      </Box>

      {/* Features Section */}
      <Typography variant="h4" component="h2" gutterBottom align="center" sx={{ mb: 6 }}>
        Why Choose MediHub?
      </Typography>
      <Grid container spacing={4} sx={{ mb: 8 }}>
        {features.map((feature, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Box sx={{ color: 'primary.main', mb: 2 }}>
                  {feature.icon}
                </Box>
                <Typography gutterBottom variant="h5" component="h3">
                  {feature.title}
                </Typography>
                <Typography>
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Stats Section */}
      <Box sx={{ bgcolor: 'grey.100', p: 4, borderRadius: 2, mb: 8 }}>
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h4" gutterBottom>
              Transforming Healthcare with AI
            </Typography>
            <Typography variant="body1" paragraph>
              MediHub combines cutting-edge artificial intelligence with 
              robust hospital management to deliver superior patient care, 
              optimize operations, and ensure data security.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              component={Link}
              to="/register"
            >
              Get Started
            </Button>
          </Grid>
          <Grid item xs={12} md={6}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h3" color="primary">
                      99%
                    </Typography>
                    <Typography variant="body2">
                      System Uptime
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h3" color="primary">
                      50k+
                    </Typography>
                    <Typography variant="body2">
                      Patients Served
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h3" color="primary">
                      200+
                    </Typography>
                    <Typography variant="body2">
                      Doctors
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h3" color="primary">
                      24/7
                    </Typography>
                    <Typography variant="body2">
                      Support
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Home;