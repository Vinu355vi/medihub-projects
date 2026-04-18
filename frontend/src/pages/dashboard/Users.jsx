import React, { useEffect, useMemo, useState } from 'react';
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
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Stack,
} from '@mui/material';
import { Edit, Delete, Refresh, CheckCircle, Visibility } from '@mui/icons-material';
import { userAPI } from '../../services/api';
import { useAlert } from '../../context/AlertContext';

const normalizeUser = (user) => ({
  id: user.id,
  name: user.name || 'Unknown User',
  email: user.email || '-',
  role: user.role || 'PATIENT',
  status: user.status || 'inactive',
});

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formUser, setFormUser] = useState({ name: '', email: '', role: 'PATIENT', status: 'active' });
  const { showAlert } = useAlert();

  const fetchUsers = async (silent = false) => {
    try {
      if (silent) {
        setSyncing(true);
      } else {
        setLoading(true);
      }

      const res = await userAPI.getUsers();
      const incoming = Array.isArray(res.data) ? res.data : [];
      const normalized = incoming
        .map(normalizeUser)
        .sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
      setUsers(normalized);
    } catch {
      if (!silent) {
        showAlert('Failed to load users', 'error');
      }
    } finally {
      if (silent) {
        setSyncing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchUsers();

    const interval = setInterval(() => {
      fetchUsers(true);
    }, 15000);

    const onFocus = () => fetchUsers(true);
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const tableUsers = useMemo(() => users, [users]);

  const handleDelete = async (user) => {
    const isActive = user.status === 'active';
    const confirmMessage = isActive
      ? 'Set this user to inactive?'
      : 'Permanently delete this inactive user?';

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await userAPI.deleteUser(user.id);
      showAlert(response?.data?.message || 'User updated', 'success');
      fetchUsers(true);
    } catch (error) {
      const message = error?.response?.data?.error || error?.response?.data?.message || 'Delete failed';
      showAlert(message, 'error');
    }
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setFormUser({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    });
    setOpenEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser?.id) {
      return;
    }

    try {
      await userAPI.updateUser(selectedUser.id, formUser);
      setOpenEditDialog(false);
      showAlert('User updated', 'success');
      fetchUsers(true);
    } catch {
      showAlert('Update failed', 'error');
    }
  };

  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === 'active' ? 'inactive' : 'active';

    try {
      await userAPI.updateUser(user.id, { status: nextStatus });
      showAlert('Status updated', 'success');
      fetchUsers(true);
    } catch {
      showAlert('Failed to update status', 'error');
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h4" component="h1">
          User Management
        </Typography>
        <Button
          variant="outlined"
          startIcon={syncing ? <CircularProgress size={16} /> : <Refresh />}
          onClick={() => fetchUsers(true)}
        >
          Refresh
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper elevation={3}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell>User</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tableUsers.filter(u => (u.role || '').toUpperCase() !== 'ADMIN').map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar>{(user.name || '?').charAt(0)}</Avatar>
                        {user.name}
                      </Box>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role}
                        color={user.role === 'DOCTOR' ? 'primary' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.status}
                        color={user.status === 'active' ? 'success' : 'default'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <IconButton size="small" onClick={() => handleOpenEdit(user)} title="View">
                          <Visibility />
                        </IconButton>
                        {user.status !== 'active' && (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<CheckCircle />}
                            onClick={() => handleToggleStatus(user)}
                          >
                            Set Active
                          </Button>
                        )}
                        <IconButton size="small" color="error" onClick={() => handleDelete(user)} title="Delete">
                          <Delete />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>View User</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField fullWidth label="Name" margin="normal" value={formUser.name} InputProps={{ readOnly: true }} />
            <TextField fullWidth label="Email" margin="normal" value={formUser.email} InputProps={{ readOnly: true }} />
            <TextField fullWidth label="Role" margin="normal" value={formUser.role} InputProps={{ readOnly: true }} />
            <TextField fullWidth label="Status" margin="normal" value={formUser.status} InputProps={{ readOnly: true }} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users;
