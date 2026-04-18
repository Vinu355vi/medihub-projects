import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Font Imports
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/poppins/300.css';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';

import { AuthProvider } from './context/AuthContext';
import { AlertProvider } from './context/AlertContext';

// Layout Components
import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Public Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Doctors from './pages/Doctors';
import Pharmacy from './pages/Pharmacy';
import BookAppointment from './pages/BookAppointment';

// Protected Pages
import PatientDashboard from './pages/dashboard/PatientDashboard';
import DoctorDashboard from './pages/dashboard/DoctorDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import Profile from './pages/dashboard/Profile';
import Appointments from './pages/dashboard/Appointments';
import MedicalRecords from './pages/dashboard/MedicalRecords';
import Users from './pages/dashboard/Users';
import DashboardPharmacy from './pages/dashboard/DashboardPharmacy';
import Schedule from './pages/dashboard/Schedule';
import Patients from './pages/dashboard/Patients';
import AIPage from './pages/dashboard/AI';

// Services
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import RoleBasedRedirect from './components/auth/RoleBasedRedirect';

// Professional & Modern Medical Theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#0284c7', // Sky 600 - Trustworthy Blue
      light: '#38bdf8',
      dark: '#0369a1',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#10b981', // Emerald 500 - Health/Success
      light: '#34d399',
      dark: '#059669',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8fafc', // Slate 50 - Clean, modern background
      paper: '#ffffff',
    },
    text: {
      primary: '#1e293b', // Slate 800 - High contrast, softer than black
      secondary: '#64748b', // Slate 500
    },
    success: {
      main: '#22c55e',
    },
    error: {
      main: '#ef4444',
    },
    warning: {
      main: '#f59e0b',
    },
    info: {
      main: '#3b82f6',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"Poppins", sans-serif',
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
    },
    h2: {
      fontFamily: '"Poppins", sans-serif',
      fontWeight: 600,
      fontSize: '2rem',
      lineHeight: 1.3,
    },
    h3: {
      fontFamily: '"Poppins", sans-serif',
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    h4: {
      fontFamily: '"Poppins", sans-serif',
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h5: {
      fontFamily: '"Poppins", sans-serif',
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h6: {
      fontFamily: '"Poppins", sans-serif',
      fontWeight: 600,
      fontSize: '1rem',
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      color: '#475569',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      color: '#334155',
    },
    button: {
      fontFamily: '"Inter", sans-serif',
      fontWeight: 600,
      textTransform: 'none', // Modern convention
      letterSpacing: '0.02em',
    },
  },
  shape: {
    borderRadius: 12, // Softer, more friendly UI
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          padding: '10px 24px',
          transition: 'all 0.2s ease-in-out',
          boxShadow: 'none',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #0369a1 0%, #0284c7 100%)',
          },
        },
        containedSecondary: {
            background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
            '&:hover': {
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
            },
        }
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', // Soft shadow
          transition: 'box-shadow 0.3s ease-in-out, transform 0.3s ease-in-out',
          '&:hover': {
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '10px',
            backgroundColor: '#ffffff',
            '& fieldset': {
              borderColor: '#e2e8f0', // Slate 200
            },
            '&:hover fieldset': {
              borderColor: '#94a3b8', // Slate 400
            },
            '&.Mui-focused fieldset': {
              borderColor: '#0284c7', // Primary
              borderWidth: '2px',
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#1e293b',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
          borderRight: '1px solid #f1f5f9',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          margin: '4px 8px',
          padding: '10px 16px',
          '&.Mui-selected': {
            backgroundColor: alpha('#0284c7', 0.1),
            color: '#0284c7',
            '&:hover': {
              backgroundColor: alpha('#0284c7', 0.15),
            },
            '& .MuiListItemIcon-root': {
              color: '#0284c7',
            },
          },
          '&:hover': {
            backgroundColor: '#f8fafc',
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: '40px',
          color: '#64748b',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <AuthProvider>
          <AlertProvider>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<MainLayout />}>
                  <Route index element={<Home />} />
                  <Route path="login" element={<Login />} />
                  <Route path="register" element={<Register />} />
                  <Route path="doctors" element={<Doctors />} />
                  <Route path="pharmacy" element={<Pharmacy />} />
                  <Route path="book-appointment" element={<BookAppointment />} />
                </Route>

                {/* Protected Dashboard Routes */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={<RoleBasedRedirect />} />
                  <Route path="patient" element={<PatientDashboard />} />
                  <Route path="doctor" element={<DoctorDashboard />} />
                  <Route path="admin" element={<AdminDashboard />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="appointments" element={<Appointments />} />
                  <Route path="medical-records" element={<MedicalRecords />} />
                  <Route path="analytics" element={<Navigate to="/dashboard/admin" replace />} />
                  <Route path="users" element={<Users />} />
                  <Route path="pharmacy" element={<DashboardPharmacy />} />
                  <Route path="ai" element={<AIPage />} />
                  <Route path="schedule" element={<Schedule />} />
                  <Route path="patients" element={<Patients />} />
                </Route>

                {/* 404 Route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Router>
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop />
          </AlertProvider>
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
