// frontend/src/layouts/DashboardLayout.jsx
import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  Button,
  Divider,
  Stack,
  Chip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  CalendarToday,
  LocalHospital,
  Medication,
  People,
  Psychology,
  Logout,
  Person,
  NotificationsOutlined,
  SettingsOutlined,
  ChevronRight
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 280;

const DashboardLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const normalizedRole = String(user?.role || '').replace('ROLE_', '').toUpperCase();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleProfileMenuClose();
    navigate('/login');
  };

  // Menu items based on user role
  const getMenuItems = () => {
    let baseItems = [
      { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
      { text: 'Appointments', icon: <CalendarToday />, path: '/dashboard/appointments' },
      { text: 'Medical Records', icon: <LocalHospital />, path: '/dashboard/medical-records' },
    ];

    if (normalizedRole === 'DOCTOR') {
      baseItems.push(
        { text: 'My Schedule', icon: <CalendarToday />, path: '/dashboard/schedule' },
        { text: 'Patients', icon: <People />, path: '/dashboard/patients' },
        { text: 'Profile', icon: <Person />, path: '/dashboard/profile' }
      );
    } else if (normalizedRole === 'ADMIN') {
      baseItems.splice(1, 0, { text: 'Users', icon: <People />, path: '/dashboard/users' });
      baseItems.push(
        { text: 'AI Insights', icon: <Psychology />, path: '/dashboard/ai' },
        { text: 'Pharmacy', icon: <Medication />, path: '/dashboard/pharmacy' }
      );
    } else {
       // Patient
       baseItems.push(
        { text: 'Pharmacy', icon: <Medication />, path: '/dashboard/pharmacy' },
        { text: 'AI Health', icon: <Psychology />, path: '/dashboard/ai' },
        { text: 'Profile', icon: <Person />, path: '/dashboard/profile' }
       );
    }

    return baseItems;
  };

  const menuItems = getMenuItems();

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Sidebar Header */}
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h5" color="primary" sx={{ fontWeight: 700, letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocalHospital sx={{ fontSize: 32 }} /> MediHub
        </Typography>
      </Box>
      <Divider sx={{ mx: 2, mb: 2 }} />
      
      {/* Navigation */}
      <Box sx={{ flexGrow: 1, px: 2 }}>
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                component={Link}
                to={item.path}
                selected={location.pathname === item.path}
                onClick={() => setMobileOpen(false)}
                sx={{
                    borderRadius: '12px',
                    color: location.pathname === item.path ? 'primary.main' : 'text.secondary',
                    bgcolor: location.pathname === item.path ? 'primary.soft' : 'transparent',
                    '&.Mui-selected': {
                        bgcolor: 'rgba(2, 132, 199, 0.1)',
                        color: 'primary.main',
                        '&:hover': {
                            bgcolor: 'rgba(2, 132, 199, 0.15)',
                        }
                    }
                }}
              >
                <ListItemIcon sx={{ 
                    color: location.pathname === item.path ? 'primary.main' : 'text.secondary',
                    minWidth: 40
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{ 
                        fontWeight: location.pathname === item.path ? 600 : 500,
                        fontSize: '0.95rem'
                    }} 
                />
                {location.pathname === item.path && <ChevronRight fontSize="small" />}
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* User Profile Summary in Sidebar */}
      <Box sx={{ p: 2, bgcolor: 'background.default', m: 2, borderRadius: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
            <Avatar src={user?.profileImageUrl} alt={user?.name} sx={{ width: 40, height: 40, bgcolor: 'secondary.main' }}>
                {user?.name?.charAt(0)}
            </Avatar>
            <Box sx={{ overflow: 'hidden' }}>
                <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600 }}>{user?.name}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                    {user?.role?.replace('ROLE_', '')}
                </Typography>
            </Box>
        </Stack>
        <Button 
            fullWidth 
            variant="outlined" 
            color="error"
            size="small" 
            startIcon={<Logout />} 
            onClick={handleLogout}
            sx={{ mt: 2, borderRadius: 2 }}
        >
            Logout
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <CssBaseline />
      
      {/* Top App Bar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid',
          borderColor: 'divider',
          color: 'text.primary'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" noWrap component="div" sx={{ color: 'text.primary', fontWeight: 600 }}>
                {menuItems.find(item => item.path === location.pathname)?.text || 'Dashboard'}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
              <IconButton color="inherit" size="large">
                <NotificationsOutlined />
              </IconButton>
              <IconButton color="inherit" size="large">
                <SettingsOutlined />
              </IconButton>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Sidebar Navigation */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: 'none',
              boxShadow: '4px 0 24px rgba(0,0,0,0.05)'
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default DashboardLayout;
