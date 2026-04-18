import React, { useEffect, useMemo, useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  LinearProgress,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Stack,
  Alert,
} from '@mui/material';
import {
  People,
  LocalHospital,
  TrendingUp,
  Warning,
  Edit,
  Delete,
  Refresh,
  CheckCircle,
  BarChart as BarChartIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { aiAPI, inventoryAPI, patientAPI, userAPI } from '../../services/api';
import { useAlert } from '../../context/AlertContext';

const COLORS = ['#1976d2', '#2e7d32', '#ed6c02', '#d32f2f', '#6a1b9a'];

const AdminDashboard = () => {
  const { showAlert } = useAlert();
  const [tabValue, setTabValue] = useState(0);
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    totalRevenue: 0,
    activeUsers: 0,
    lowStockItems: 0,
  });
  const [users, setUsers] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingUser, setEditingUser] = useState({ name: '', email: '', role: 'PATIENT', status: 'active' });
  const [appointmentByDoctor, setAppointmentByDoctor] = useState([]);
  const [appointmentByStatus, setAppointmentByStatus] = useState([]);
  const [anomalies, setAnomalies] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const normalizeList = (payload) => {
    if (Array.isArray(payload)) {
      return payload;
    }
    if (Array.isArray(payload?.content)) {
      return payload.content;
    }
    if (Array.isArray(payload?.data)) {
      return payload.data;
    }
    return [];
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [statsRes, usersRes, inventoryRes, appointmentsRes, anomalyRes] = await Promise.all([
        patientAPI.getDashboardStats(),
        userAPI.getUsers(),
        inventoryAPI.getInventory(),
        patientAPI.getAppointments(),
        aiAPI.getAnomalyDetection().catch(() => ({ data: { anomalies: [] } })),
      ]);

      const statsData = statsRes.data || {};
      setStats({
        totalPatients: Number(statsData.totalPatients || 0),
        totalDoctors: Number(statsData.totalDoctors || 0),
        totalAppointments: Number(statsData.totalAppointments || 0),
        totalRevenue: Number(statsData.totalRevenue || 0),
        activeUsers: Number(statsData.activeUsers || 0),
        lowStockItems: Number(statsData.lowStockItems || 0),
      });

      const nextUsers = normalizeList(usersRes.data);
      setUsers(nextUsers);

      const inventoryItems = normalizeList(inventoryRes.data);
      const lowStock = inventoryItems
        .filter((item) => Number(item.stock || 0) < 10)
        .map((item) => ({
          id: item.id,
          name: item.name || `Item #${item.id}`,
          current: Number(item.stock || 0),
        }));

      const appointmentItems = normalizeList(appointmentsRes.data);
      const activeDoctors = nextUsers.filter(
        (u) => String(u.role || '').toUpperCase() === 'DOCTOR' && String(u.status || '').toLowerCase() === 'active'
      );
      const activeDoctorIds = new Set(activeDoctors.map((u) => String(u.id || '')).filter(Boolean));
      const activeDoctorNames = new Set(
        activeDoctors.map((u) => String(u.name || '').trim()).filter(Boolean)
      );
      const activeDoctorNameById = activeDoctors.reduce((acc, doctor) => {
        acc[String(doctor.id)] = doctor.name || `Doctor #${doctor.id}`;
        return acc;
      }, {});

      const filteredAppointmentsForDoctorChart = appointmentItems.filter((app) => {
        const doctorId = String(app.doctorId || '');
        const doctorName = String(app.doctorName || '').trim();
        const hasDoctorScope = activeDoctorIds.size > 0 || activeDoctorNames.size > 0;
        const isActiveDoctor =
          !hasDoctorScope ||
          (doctorId && activeDoctorIds.has(doctorId)) ||
          (!!doctorName && activeDoctorNames.has(doctorName));
        return isActiveDoctor;
      });

      const byDoctorMap = filteredAppointmentsForDoctorChart.reduce((acc, app) => {
        const doctorId = String(app.doctorId || '');
        const name = activeDoctorNameById[doctorId] || app.doctorName || 'Unknown';
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {});

      const byStatusBuckets = appointmentItems.reduce(
        (acc, app) => {
          const status = String(app.status || '').toUpperCase();
          if (status === 'COMPLETED') {
            acc.completed += 1;
          } else if (status === 'CANCELLED') {
            acc.cancelled += 1;
          } else {
            acc.upcoming += 1;
          }
          return acc;
        },
        { upcoming: 0, completed: 0, cancelled: 0 }
      );

      setAppointmentByDoctor(
        Object.entries(byDoctorMap)
          .map(([name, appointments]) => ({ name, appointments: Number(appointments || 0) }))
          .sort((a, b) => b.appointments - a.appointments)
          .slice(0, 8)
      );

      setAppointmentByStatus([
        { name: 'Appointment (Upcoming)', value: Number(byStatusBuckets.upcoming || 0) },
        { name: 'Completed', value: Number(byStatusBuckets.completed || 0) },
        { name: 'Cancelled', value: Number(byStatusBuckets.cancelled || 0) },
      ]);

      const activities = appointmentItems
        .slice()
        .sort((a, b) => dayjs(b.appointmentDate).valueOf() - dayjs(a.appointmentDate).valueOf())
        .slice(0, 6)
        .map((app) => ({
          id: `app-${app.id}`,
          user: app.patientName || 'Patient',
          action: `Appointment ${String(app.status || '').toLowerCase()}`,
          time: dayjs(app.appointmentDate).format('DD MMM YYYY, hh:mm A'),
          type: 'appointment',
        }));

      const stockActivities = lowStock.slice(0, 3).map((item) => ({
        id: `stock-${item.id}`,
        user: 'Inventory',
        action: `Low stock: ${item.name} (${item.current})`,
        time: dayjs().format('DD MMM YYYY, hh:mm A'),
        type: 'alert',
      }));

      const anomalyRows = Array.isArray(anomalyRes.data?.anomalies) ? anomalyRes.data.anomalies : [];
      setAnomalies(anomalyRows);

      setRecentActivities([...activities, ...stockActivities]);
    } catch (error) {
      showAlert('Failed to load admin dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (rowUser) => {
    setSelectedUser(rowUser);
    setEditingUser({
      name: rowUser.name || '',
      email: rowUser.email || '',
      role: rowUser.role || 'PATIENT',
      status: rowUser.status || 'active',
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
  };

  const handleSaveUser = async () => {
    if (!selectedUser?.id) {
      return;
    }

    try {
      const response = await userAPI.updateUser(selectedUser.id, editingUser);
      const updated = response.data?.user || { ...selectedUser, ...editingUser };
      setUsers((prev) => prev.map((item) => (item.id === selectedUser.id ? updated : item)));
      showAlert('User updated successfully', 'success');
      handleCloseDialog();
    } catch (error) {
      showAlert('Failed to update user', 'error');
    }
  };

  const handleDeleteUser = async (rowUser) => {
    const isActive = (rowUser.status || '').toLowerCase() === 'active';
    const confirmMessage = isActive
      ? 'Set this user to inactive?'
      : 'Permanently delete this inactive user?';

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await userAPI.deleteUser(rowUser.id);
      showAlert(response?.data?.message || 'User updated', 'success');
      fetchDashboardData();
    } catch (error) {
      const message = error?.response?.data?.error || error?.response?.data?.message || 'Failed to delete user';
      showAlert(message, 'error');
    }
  };

  const handleToggleStatus = async (rowUser) => {
    const nextStatus = rowUser.status === 'active' ? 'inactive' : 'active';

    try {
      await userAPI.updateUser(rowUser.id, { status: nextStatus });
      setUsers((prev) => prev.map((item) => (item.id === rowUser.id ? { ...item, status: nextStatus } : item)));
      showAlert('User status updated', 'success');
    } catch (error) {
      showAlert('Failed to update user status', 'error');
    }
  };

  const visibleUsers = useMemo(() => users, [users]);

  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2, bgcolor: 'primary.main', color: 'white' }}>
        <Grid container alignItems="center" spacing={2}>
          <Grid item>
            <Avatar sx={{ width: 80, height: 80, bgcolor: 'white' }}>
              <People sx={{ fontSize: 40, color: 'primary.main' }} />
            </Avatar>
          </Grid>
          <Grid item xs>
            <Typography variant="h4" gutterBottom>
              Admin Dashboard
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Real-time system overview and management controls
            </Typography>
          </Grid>
          <Grid item>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="contained" color="secondary" startIcon={<Refresh />} onClick={fetchDashboardData}>
                Refresh
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3} sx={{ mb: 4, justifyContent: 'center' }}>
        <Grid item xs={12} sm={6} md={6} lg={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <People sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4">{stats.totalPatients}</Typography>
              <Typography variant="body2" color="text.secondary">Total Patients</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={6} lg={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <LocalHospital sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4">{stats.totalDoctors}</Typography>
              <Typography variant="body2" color="text.secondary">Active Doctors</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={6} lg={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUp sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4">{stats.totalAppointments}</Typography>
              <Typography variant="body2" color="text.secondary">Appointments</Typography>
            </CardContent>
          </Card>
        </Grid>
        {/* <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <BarChartIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4">${Number(stats.totalRevenue || 0).toLocaleString()}</Typography>
              <Typography variant="body2" color="text.secondary">Revenue</Typography>
            </CardContent>
          </Card>
        </Grid> */}
        <Grid item xs={12} sm={6} md={6} lg={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <People sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4">{stats.activeUsers}</Typography>
              <Typography variant="body2" color="text.secondary">Active Users</Typography>
            </CardContent>
          </Card>
        </Grid>
        {/* <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Warning sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4">{stats.lowStockItems}</Typography>
              <Typography variant="body2" color="text.secondary">Low Stock</Typography>
            </CardContent>
          </Card>
        </Grid> */}
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Appointments by Doctor</Typography>
              {appointmentByDoctor.length === 0 ? (
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary">No data to display</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={appointmentByDoctor}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="appointments" fill="#1976d2" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Appointments by Status</Typography>
              {appointmentByStatus.reduce((sum, row) => sum + Number(row.value || 0), 0) === 0 ? (
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary">No data to display</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart margin={{ top: 12, right: 120, bottom: 12, left: 12 }}>
                    <Pie
                      data={appointmentByStatus}
                      cx="42%"
                      cy="50%"
                      labelLine={false}
                      label={false}
                      outerRadius={90}
                      dataKey="value"
                    >
                      {appointmentByStatus.map((entry, index) => (
                        <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend
                      layout="vertical"
                      verticalAlign="top"
                      align="right"
                      formatter={(value) => {
                        const row = appointmentByStatus.find((item) => item.name === value);
                        const count = Number(row?.value || 0);
                        return `${value}: ${count}`;
                      }}
                      wrapperStyle={{ top: 0, right: 8 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ mb: 4, borderRadius: 2 }}>
        <Tabs value={tabValue} onChange={(event, value) => setTabValue(value)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="User Management" />
          <Tab label="Recent Activities" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {tabValue === 0 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleUsers.map((tableUser) => (
                    <TableRow key={tableUser.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ width: 32, height: 32, mr: 1 }}>{tableUser.name?.charAt(0) || '?'}</Avatar>
                          {tableUser.name || '-'}
                        </Box>
                      </TableCell>
                      <TableCell>{tableUser.email || '-'}</TableCell>
                      <TableCell>
                        <Chip label={tableUser.role || '-'} size="small" color={tableUser.role === 'ADMIN' ? 'error' : tableUser.role === 'DOCTOR' ? 'primary' : 'default'} />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={tableUser.status || 'inactive'}
                          size="small"
                          color={(tableUser.status || '').toLowerCase() === 'active' ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          {(tableUser.status || '').toLowerCase() === 'active' ? (
                            <>
                              <IconButton size="small" onClick={() => handleEditUser(tableUser)}>
                                <Edit />
                              </IconButton>
                              <IconButton size="small" onClick={() => handleDeleteUser(tableUser)} color="error">
                                <Delete />
                              </IconButton>
                            </>
                          ) : (
                            <>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<CheckCircle />}
                                onClick={() => handleToggleStatus(tableUser)}
                              >
                                Set Active
                              </Button>
                              <IconButton size="small" onClick={() => handleDeleteUser(tableUser)} color="error">
                                <Delete />
                              </IconButton>
                            </>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {tabValue === 1 && (
            <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
              {anomalies.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  {anomalies.length} suspicious login pattern(s) detected. Review account activity.
                </Alert>
              )}
              {recentActivities.map((activity) => (
                <Paper key={activity.id} sx={{ p: 2, mb: 2 }}>
                  <Grid container alignItems="center" spacing={2}>
                    <Grid item>
                      <Avatar>{activity.user?.charAt(0) || 'U'}</Avatar>
                    </Grid>
                    <Grid item xs>
                      <Typography variant="body1"><strong>{activity.user}</strong> {activity.action}</Typography>
                      <Typography variant="body2" color="text.secondary">{activity.time}</Typography>
                    </Grid>
                    <Grid item>
                      <Chip label={activity.type} size="small" color={activity.type === 'alert' ? 'error' : 'primary'} />
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Box>
          )}
        </Box>
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Name"
              value={editingUser.name}
              onChange={(e) => setEditingUser((prev) => ({ ...prev, name: e.target.value }))}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Email"
              value={editingUser.email}
              onChange={(e) => setEditingUser((prev) => ({ ...prev, email: e.target.value }))}
              margin="normal"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Role</InputLabel>
              <Select
                value={editingUser.role}
                label="Role"
                onChange={(e) => setEditingUser((prev) => ({ ...prev, role: e.target.value }))}
              >
                <MenuItem value="PATIENT">Patient</MenuItem>
                <MenuItem value="DOCTOR">Doctor</MenuItem>
                <MenuItem value="ADMIN">Admin</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveUser} variant="contained">Save Changes</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard;
