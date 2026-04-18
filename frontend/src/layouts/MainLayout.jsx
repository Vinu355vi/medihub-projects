// frontend/src/layouts/MainLayout.jsx
import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  useScrollTrigger,
  Slide,
  Avatar,
  Menu,
  MenuItem,
  Grid,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home,
  LocalHospital,
  CalendarToday,
  Medication,
  Person,
  ExitToApp,
  Dashboard,
  PersonAdd,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 240;

function HideOnScroll(props) {
  const { children } = props;
  const trigger = useScrollTrigger();
  
  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

const MainLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const normalizedRole = String(user?.role || '').replace('ROLE_', '').toUpperCase();
  const isAdmin = normalizedRole === 'ADMIN';

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate('/');
  };

  const menuItems = [
    { text: 'Home', icon: <Home />, path: '/' },
    { text: 'Doctors', icon: <LocalHospital />, path: '/doctors' },
    { text: 'Appointments', icon: <CalendarToday />, path: '/book-appointment' },
    { text: 'Pharmacy', icon: <Medication />, path: '/pharmacy' },
  ];

  const drawer = (
    <Box sx={{ width: drawerWidth }}>
      <Toolbar>
        <Typography variant="h6" noWrap>
          MediHub
        </Typography>
      </Toolbar>
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            component={Link}
            to={item.path}
            onClick={handleDrawerToggle}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
        
        {isAuthenticated ? (
          <>
            <ListItem
              button
              component={Link}
              to="/dashboard"
              onClick={handleDrawerToggle}
            >
              <ListItemIcon><Dashboard /></ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItem>
            <ListItem
              button
              onClick={() => {
                handleDrawerToggle();
                handleLogout();
              }}
            >
              <ListItemIcon><ExitToApp /></ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </>
        ) : (
          <>
            <ListItem
              button
              component={Link}
              to="/login"
              onClick={handleDrawerToggle}
            >
              <ListItemIcon><Person /></ListItemIcon>
              <ListItemText primary="Login" />
            </ListItem>
            <ListItem
              button
              component={Link}
              to="/register"
              onClick={handleDrawerToggle}
            >
              <ListItemIcon><PersonAdd /></ListItemIcon>
              <ListItemText primary="Register" />
            </ListItem>
          </>
        )}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <HideOnScroll>
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
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
            
            <Typography
              variant="h6"
              component={Link}
              to="/"
              sx={{
                flexGrow: 1,
                textDecoration: 'none',
                color: 'inherit',
                fontWeight: 'bold',
              }}
            >
              MediHub
            </Typography>
            
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              {menuItems.map((item) => (
                <Button
                  key={item.text}
                  color="inherit"
                  component={Link}
                  to={item.path}
                  startIcon={item.icon}
                >
                  {item.text}
                </Button>
              ))}
            </Box>
            
            {isAuthenticated ? (
              <>
                <IconButton
                  onClick={handleMenuOpen}
                  sx={{ ml: 2 }}
                  color="inherit"
                >
                  <Avatar
                    sx={{ width: 32, height: 32 }}
                    src={user?.profileImageUrl}
                    alt={user?.name}
                  >
                    {user?.name?.charAt(0)}
                  </Avatar>
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                >
                  <MenuItem component={Link} to="/dashboard" onClick={handleMenuClose}>
                    Dashboard
                  </MenuItem>
                  {!isAdmin && (
                    <MenuItem component={Link} to="/dashboard/profile" onClick={handleMenuClose}>
                      Profile
                    </MenuItem>
                  )}
                  <MenuItem onClick={handleLogout}>Logout</MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Button
                  color="inherit"
                  component={Link}
                  to="/login"
                  sx={{ ml: 2 }}
                >
                  Login
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  component={Link}
                  to="/register"
                  sx={{ ml: 2 }}
                >
                  Register
                </Button>
              </>
            )}
          </Toolbar>
        </AppBar>
      </HideOnScroll>
      
      <Box component="nav">
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box component="main" sx={{ flexGrow: 1, mt: 8 }}>
        <Outlet />
      </Box>
      
      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          backgroundColor: (theme) =>
            theme.palette.mode === 'light'
              ? theme.palette.grey[200]
              : theme.palette.grey[800],
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} sm={4}>
              <Typography variant="h6" gutterBottom>
                MediHub
              </Typography>
              <Typography variant="body2">
                AI-powered Hospital Management System for modern healthcare.
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="h6" gutterBottom>
                Quick Links
              </Typography>
              <List dense>
                <ListItem button component={Link} to="/doctors">
                  Find Doctors
                </ListItem>
                <ListItem button component={Link} to="/pharmacy">
                  Online Pharmacy
                </ListItem>
                <ListItem button component={Link} to="/about">
                  About Us
                </ListItem>
              </List>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="h6" gutterBottom>
                Contact
              </Typography>
              <Typography variant="body2">
                Email: support@medihub.com
              </Typography>
              <Typography variant="body2">
                Phone: +1 (555) 123-4567
              </Typography>
            </Grid>
          </Grid>
          <Box mt={3}>
            <Typography variant="body2" align="center">
              © {new Date().getFullYear()} MediHub. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default MainLayout;
