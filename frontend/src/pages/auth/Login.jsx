// frontend/src/pages/auth/Login.jsx
import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  InputAdornment,
  IconButton,
  Avatar,
  Link as MuiLink
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  LocalHospital,
  Login as LoginIcon
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      // Wait a moment for UX
      setTimeout(() => {
        if (result.success) {
          const role = String(result.user.role || '').replace('ROLE_', '').toUpperCase();
          if (role === 'ADMIN') navigate('/dashboard/admin');
          else if (role === 'DOCTOR') navigate('/dashboard/doctor');
          else navigate('/dashboard/patient');
        } else {
          setError(result.error?.message || 'Invalid credentials');
        }
      }, 500); 
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      if (!error) setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', // Soft Sky gradient
        py: 4
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={12}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 4,
            background: '#ffffff',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Decorative Top Bar */}
          <Box sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            height: '6px', 
            background: 'linear-gradient(90deg, #0284c7 0%, #10b981 100%)' 
          }} />

          <Avatar sx={{ m: 1, bgcolor: 'primary.main', width: 56, height: 56, mb: 2 }}>
            <LocalHospital fontSize="large" />
          </Avatar>
          
          <Typography component="h1" variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
            MediHub
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Welcome back! Please login to continue.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, mb: 2 }}>
               <MuiLink href="#" variant="body2" underline="hover" color="primary">
                 Forgot password?
               </MuiLink>
            </Box>
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              startIcon={<LoginIcon />}
              sx={{ 
                mt: 1, 
                mb: 3, 
                py: 1.5,
                fontSize: '1rem'
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <Link to="/register" style={{ color: '#0284c7', textDecoration: 'none', fontWeight: 600 }}>
                  Register here
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
