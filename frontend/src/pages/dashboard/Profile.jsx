import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Avatar,
  TextField,
  Button,
  Divider,
  Card,
  Chip,
  MenuItem,
  Rating,
} from '@mui/material';
import { Edit, Email, Phone, LocationOn, Person } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { doctorAPI, userAPI } from '../../services/api';
import { useAlert } from '../../context/AlertContext';
import { SUCCESS_MESSAGES, LOCAL_STORAGE_KEYS } from '../../utils/constants';

const normalizeRole = (role) => String(role || '').replace('ROLE_', '').toUpperCase();

const Profile = () => {
  const { user, setUser } = useAuth();
  const { showAlert } = useAlert();
  const [editMode, setEditMode] = useState(false);
  const [specializations, setSpecializations] = useState([]);
  const role = normalizeRole(user?.role);

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    dob: user?.dob || '',
    specialization: user?.specialization || '',
    license: user?.license || '',
    yearsOfExperience: user?.yearsOfExperience || '',
    rating: user?.rating || 0,
    bloodGroup: user?.bloodGroup || '',
    height: user?.height || '',
    weight: user?.weight || '',
  });

  useEffect(() => {
    if (!user) return;

    setForm((prev) => ({
      ...prev,
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
    }));

    if (role === 'DOCTOR') {
      doctorAPI.getSpecializations()
        .then((res) => setSpecializations(Array.isArray(res.data) ? res.data : []))
        .catch(() => setSpecializations([]));

      doctorAPI.getMyProfile()
        .then((res) => {
          const doctor = res.data || {};
          setForm((prev) => ({
            ...prev,
            specialization: doctor.specialization || '',
            license: doctor.license || '',
            yearsOfExperience: doctor.yearsOfExperience || '',
            rating: doctor.rating || 0,
          }));
        })
        .catch(() => {});
    }
  }, [user?.id, role]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const userPayload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
      };

      const userResponse = await userAPI.updateUser(user.id, userPayload);
      const updatedUser = userResponse.data?.user || { ...user, ...userPayload };

      if (role === 'DOCTOR') {
        await doctorAPI.updateMyProfile({
          specialization: form.specialization,
          license: form.license,
          yearsOfExperience: form.yearsOfExperience,
        });
      }

      localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      setUser(updatedUser);
      setEditMode(false);
      showAlert(SUCCESS_MESSAGES.PROFILE_UPDATED || 'Profile updated successfully', 'success');
    } catch (error) {
      showAlert('Failed to update profile', 'error');
    }
  };

  if (!user) {
    return <Box p={3}><Typography>Loading profile...</Typography></Box>;
  }

  if (role === 'ADMIN') {
    return null;
  }

  return (
    <Box p={3}>
      <Typography variant="h4" component="h1" gutterBottom>
        Account Profile
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center', height: '100%' }}>
            <Avatar sx={{ width: 120, height: 120, mx: 'auto', mb: 2, bgcolor: 'primary.main', fontSize: '3rem' }}>
              {user.name ? user.name.charAt(0).toUpperCase() : <Person />}
            </Avatar>
            <Typography variant="h5" gutterBottom>{user.name || 'User Name'}</Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              {role}
            </Typography>
            <Chip label="Active" color="success" size="small" sx={{ mt: 1, mb: 3 }} />
            <Divider sx={{ my: 2 }} />
            <Box textAlign="left" sx={{ '& > div': { mb: 2 } }}>
              <Box display="flex" alignItems="center" gap={1}>
                <Email color="action" />
                <Typography variant="body1">{user.email || 'email@example.com'}</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Phone color="action" />
                <Typography variant="body1">{user.phone || '-'}</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <LocationOn color="action" />
                <Typography variant="body1">{user.address || '-'}</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">General Information</Typography>
              {editMode ? (
                <Button variant="contained" color="primary" onClick={handleSave}>Save</Button>
              ) : (
                <Button startIcon={<Edit />} variant="outlined" onClick={() => setEditMode(true)}>
                  Edit Profile
                </Button>
              )}
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Full Name" name="name" value={form.name} onChange={handleChange} InputProps={{ readOnly: !editMode }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Email Address" name="email" value={form.email} onChange={handleChange} InputProps={{ readOnly: !editMode }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Phone Number" name="phone" value={form.phone} onChange={handleChange} InputProps={{ readOnly: !editMode }} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Address" name="address" value={form.address} onChange={handleChange} multiline rows={2} InputProps={{ readOnly: !editMode }} />
              </Grid>
            </Grid>

            <Box mt={4}>
              <Typography variant="h6" gutterBottom>
                {role === 'DOCTOR' ? 'Professional Details' : 'Medical Summary'}
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {role === 'DOCTOR' && (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    {editMode ? (
                      <TextField
                        select
                        fullWidth
                        label="Specialization"
                        name="specialization"
                        value={form.specialization}
                        onChange={handleChange}
                      >
                        {specializations.map((item) => (
                          <MenuItem key={item} value={item}>{item}</MenuItem>
                        ))}
                      </TextField>
                    ) : (
                      <TextField fullWidth label="Specialization" value={form.specialization} InputProps={{ readOnly: true }} />
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="License Number"
                      name="license"
                      value={form.license}
                      onChange={handleChange}
                      InputProps={{ readOnly: !editMode }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Years of Experience"
                      name="yearsOfExperience"
                      type="number"
                      value={form.yearsOfExperience}
                      onChange={handleChange}
                      InputProps={{ readOnly: !editMode }}
                    />
                  </Grid>
                </Grid>
              )}

              {role === 'PATIENT' && (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}><TextField fullWidth label="Blood Group" name="bloodGroup" value={form.bloodGroup} onChange={handleChange} InputProps={{ readOnly: !editMode }} /></Grid>
                  <Grid item xs={12} sm={4}><TextField fullWidth label="Height" name="height" value={form.height} onChange={handleChange} InputProps={{ readOnly: !editMode }} /></Grid>
                  <Grid item xs={12} sm={4}><TextField fullWidth label="Weight" name="weight" value={form.weight} onChange={handleChange} InputProps={{ readOnly: !editMode }} /></Grid>
                </Grid>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile;
