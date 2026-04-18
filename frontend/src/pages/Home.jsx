// frontend/src/pages/Home.jsx
import React from 'react';
import { Box, Container, Typography, Button, Grid, Paper, Card, CardContent, CardMedia, Stack } from '@mui/material';
import { Link } from 'react-router-dom';
import { LocalHospital, AccessTime, Security, Speed, CheckCircle } from '@mui/icons-material';

const Home = () => {
  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 12,
          mb: 6,
          background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Abstract Background Shapes */}
        <Box sx={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            zIndex: 0
        }} />
        <Box sx={{
            position: 'absolute',
            bottom: -50,
            left: -50,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
            zIndex: 0
        }} />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h1" gutterBottom sx={{ fontSize: { xs: '2.5rem', md: '3.5rem' }, fontWeight: 800 }}>
                Healthcare <br/> Use Simplified.
              </Typography>
              <Typography variant="h5" paragraph sx={{ opacity: 0.9, fontWeight: 300, mb: 4, lineHeight: 1.6 }}>
                Your complete healthcare management solution. Connect with doctors, manage appointments, and access your medical records securely.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  component={Link}
                  to="/login"
                  sx={{ 
                    px: 4, 
                    py: 1.8, 
                    fontSize: '1.1rem',
                    boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                  }}
                >
                  Get Started Now
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  size="large"
                  component={Link}
                  to="/doctors"
                  sx={{ 
                    px: 4, 
                    py: 1.8, 
                    fontSize: '1.1rem', 
                    borderWidth: 2,
                    '&:hover': { borderWidth: 2, bgcolor: 'rgba(255,255,255,0.1)' } 
                  }}
                >
                  Find Doctors
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Box
                component="img"
                src="https://images.unsplash.com/photo-1538108149393-fbbd81895907?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                alt="Hospital"
                sx={{
                  width: '100%',
                  borderRadius: 8,
                  boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                  transform: 'perspective(1000px) rotateY(-5deg)',
                  transition: 'transform 0.5s',
                  '&:hover': {
                    transform: 'perspective(1000px) rotateY(0deg)',
                  }
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ mb: 10 }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="h6" color="primary" sx={{ fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', mb: 2 }}>
                Why Choose Us
            </Typography>
            <Typography variant="h3" fontWeight={700}>
                Better Healthcare Experience
            </Typography>
        </Box>
        
        <Grid container spacing={4}>
          {[
            { 
               icon: <AccessTime sx={{ fontSize: 48, color: 'white' }} />, 
               title: '24/7 Availability', 
               desc: 'Book appointments anytime, anywhere. Our system is always available.',
               color: '#0ea5e9' // Sky
            },
            { 
               icon: <LocalHospital sx={{ fontSize: 48, color: 'white' }} />, 
               title: 'Expert Doctors', 
               desc: 'Access a wide network of qualified and experienced specialists.',
               color: '#10b981' // Emerald
            },
            { 
               icon: <Security sx={{ fontSize: 48, color: 'white' }} />, 
               title: 'Secure Records', 
               desc: 'Your medical history is safe with our enterprise-grade security.',
               color: '#8b5cf6' // Violet
            }
          ].map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card sx={{ 
                height: '100%', 
                textAlign: 'left', 
                p: 3, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'flex-start',
                transition: 'transform 0.3s',
                '&:hover': { transform: 'translateY(-8px)' }
              }}>
                <Box sx={{ 
                    width: 80, 
                    height: 80, 
                    borderRadius: 4, 
                    bgcolor: feature.color, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    mb: 3,
                    boxShadow: `0 8px 16px ${feature.color}40`
                }}>
                  {feature.icon}
                </Box>
                <CardContent sx={{ p: 0 }}>
                  <Typography variant="h5" gutterBottom fontWeight={600}>
                    {feature.title}
                  </Typography>
                  <Typography color="text.secondary" lineHeight={1.7}>
                    {feature.desc}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
      
      {/* Stats Section moved to bottom or removed to keep clean - I will omit the original truncated code which had stats logic perhaps */}
    </Box>
  );
};

export default Home;


