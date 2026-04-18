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
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Search, Visibility, Print, Edit, Delete, Add } from '@mui/icons-material';
import { medicalRecordAPI } from '../../services/api';
import { useAlert } from '../../context/AlertContext';

const toText = (value) => (value == null ? '' : String(value));

const normalizeRecord = (record) => ({
  id: record.id ?? record.recordId ?? '-',
  patient: record.patient ?? (record.patientId ? `Patient #${record.patientId}` : 'Unknown Patient'),
  doctor: record.doctor ?? '-',
  date: record.date ?? record.recordDate ?? '-',
  diagnosis: record.diagnosis ?? record.description ?? '-',
  type: record.type ?? record.recordType ?? 'GENERAL',
  files: Array.isArray(record.files) ? record.files : [],
  raw: record,
});

const MedicalRecords = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [recordsData, setRecordsData] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editData, setEditData] = useState({});
  const [newRecordData, setNewRecordData] = useState({ patientId: '', date: '', description: '', files: [] });
  const { showAlert } = useAlert();

  const loadRecords = () => {
    medicalRecordAPI
      .getRecords()
      .then((res) => {
        const incoming = Array.isArray(res.data) ? res.data : [];
        setRecordsData(incoming.map(normalizeRecord));
      })
      .catch(() => showAlert('Failed to load medical records', 'error'));
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
        await medicalRecordAPI.deleteRecord(id);
        showAlert('Record deleted successfully', 'success');
        loadRecords();
    } catch (error) {
        showAlert('Failed to delete record', 'error');
    }
  };

  const handleEditClick = (record) => {
    setEditData({ ...record.raw });
    setEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    try {
        await medicalRecordAPI.updateRecord(editData.id || editData.recordId, {
            description: editData.diagnosis || editData.description,
            date: editData.date || editData.recordDate
        });
        showAlert('Record updated successfully', 'success');
        setEditDialogOpen(false);
        loadRecords();
    } catch (error) {
        showAlert('Failed to update record', 'error');
    }
  };

  const handleAddSave = async () => {
    try {
        if (!newRecordData.patientId || !newRecordData.description) {
            showAlert('Patient ID and Description/Diagnosis are required', 'warning');
            return;
        }
        await medicalRecordAPI.addRecord({
            patientId: newRecordData.patientId,
            date: newRecordData.date || new Date().toISOString().split('T')[0],
            description: newRecordData.description,
            files: newRecordData.files
        });
        showAlert('Record added successfully', 'success');
        setAddDialogOpen(false);
        setNewRecordData({ patientId: '', date: '', description: '', files: [] });
        loadRecords();
    } catch (error) {
        showAlert('Failed to add record', 'error');
    }
  };

  const filteredData = useMemo(() => {
    const needle = toText(searchTerm).toLowerCase();
    if (!needle) {
      return recordsData;
    }

    return recordsData.filter((record) => {
      const patient = toText(record.patient).toLowerCase();
      const id = toText(record.id).toLowerCase();
      return patient.includes(needle) || id.includes(needle);
    });
  }, [recordsData, searchTerm]);

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Medical Records
        </Typography>
        <Box display="flex" gap={1}>
        <Button variant="contained" color="secondary" onClick={() => setAddDialogOpen(true)} startIcon={<Add />}>
          Add Record
        </Button>
        <Button variant="contained" color="primary" startIcon={<Print />} onClick={() => window.print()}>
          Print Report
        </Button>
        </Box>
      </Box>

      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search records by patient or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell><strong>Record ID</strong></TableCell>
              <TableCell><strong>Patient Name</strong></TableCell>
              <TableCell><strong>Doctor</strong></TableCell>
              <TableCell><strong>Date</strong></TableCell>
              <TableCell><strong>Diagnosis</strong></TableCell>
              <TableCell><strong>Type</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.map((record) => (
              <TableRow key={record.id} hover>
                <TableCell>{record.id}</TableCell>
                <TableCell>{record.patient}</TableCell>
                <TableCell>{record.doctor}</TableCell>
                <TableCell>{record.date}</TableCell>
                <TableCell>{record.diagnosis}</TableCell>
                <TableCell>
                  <Chip label={record.type} color="primary" variant="outlined" size="small" />
                </TableCell>
                <TableCell>
                  <IconButton color="primary" title="View Details" onClick={() => setSelectedRecord(record)}>
                    <Visibility />
                  </IconButton>
                  <IconButton color="info" title="Edit" onClick={() => handleEditClick(record)}>
                    <Edit />
                  </IconButton>
                  <IconButton color="error" title="Delete" onClick={() => handleDelete(record.id)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={Boolean(selectedRecord)} onClose={() => setSelectedRecord(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Medical Record Details</DialogTitle>
        <DialogContent>
          {selectedRecord && (
            <Box sx={{ pt: 1 }}>
              <Typography><strong>ID:</strong> {selectedRecord.id}</Typography>
              <Typography><strong>Patient:</strong> {selectedRecord.patient}</Typography>
              <Typography><strong>Doctor:</strong> {selectedRecord.doctor}</Typography>
              <Typography><strong>Date:</strong> {selectedRecord.date}</Typography>
              <Typography><strong>Diagnosis:</strong> {selectedRecord.diagnosis}</Typography>
              <Typography><strong>Type:</strong> {selectedRecord.type}</Typography>
              <Typography><strong>Files:</strong> {selectedRecord.files.length ? selectedRecord.files.join(', ') : 'None'}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedRecord(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Medical Record</DialogTitle>
        <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                    label="Diagnosis/Description"
                    fullWidth
                    multiline
                    rows={3}
                    value={editData.diagnosis || editData.description || ''}
                    onChange={(e) => setEditData({ ...editData, diagnosis: e.target.value, description: e.target.value })}
                />
                <TextField
                    label="Date"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={editData.date || editData.recordDate || ''}
                    onChange={(e) => setEditData({ ...editData, date: e.target.value, recordDate: e.target.value })}
                />
            </Box>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditSave} variant="contained" color="primary">Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Medical Record</DialogTitle>
        <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                    label="Patient ID"
                    fullWidth
                    type="number"
                    value={newRecordData.patientId}
                    onChange={(e) => setNewRecordData({ ...newRecordData, patientId: e.target.value })}
                />
                 <TextField
                    label="Date"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={newRecordData.date}
                    onChange={(e) => setNewRecordData({ ...newRecordData, date: e.target.value })}
                />
                <TextField
                    label="Diagnosis/Description"
                    fullWidth
                    multiline
                    rows={3}
                    value={newRecordData.description}
                    onChange={(e) => setNewRecordData({ ...newRecordData, description: e.target.value })}
                />
            </Box>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddSave} variant="contained" color="primary">Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MedicalRecords;
