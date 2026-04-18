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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import { Search, Add, Warning } from '@mui/icons-material';
import { aiAPI, inventoryAPI } from '../../services/api';
import { useAlert } from '../../context/AlertContext';

const toText = (value) => (value == null ? '' : String(value));
const isPersistedInventoryId = (id) => Number.isFinite(Number(id));

const normalizeInventoryItem = (item) => {
  const stock = Number(item.stock || 0);
  return {
    id: item.id,
    name: item.name || 'Unknown Item',
    category: item.category || 'General',
    stock,
    unit: item.unit || 'units',
    status: stock > 100 ? 'In Stock' : stock > 0 ? 'Low Stock' : 'Out of Stock',
    expiry: item.expiry || '-',
  };
};

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [inventoryData, setInventoryData] = useState([]);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openPredictionDialog, setOpenPredictionDialog] = useState(false);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionData, setPredictionData] = useState(null);
  const [predictionItemName, setPredictionItemName] = useState('');
  const [newItem, setNewItem] = useState({ name: '', category: '', stock: '', unit: '' });
  const { showAlert } = useAlert();

  useEffect(() => {
    inventoryAPI
      .getInventory()
      .then((res) => {
        const incoming = Array.isArray(res.data) ? res.data : [];
        setInventoryData(incoming.map(normalizeInventoryItem));
      })
      .catch(() => {
        showAlert('Failed to load inventory. Using demo data.', 'warning');
        // Add fake inventory items if backend fails
        const mockInventory = [
          { id: 1, name: 'Surgical Masks', stock: 500, category: 'Medical Supplies', unit: 'box' },
          { id: 2, name: 'Gloves (Latex)', stock: 200, category: 'Medical Supplies', unit: 'box' },
          { id: 3, name: 'Syringes 5ml', stock: 1000, category: 'Medical Supplies', unit: 'pcs' },
          { id: 4, name: 'Paracetamol Bulk', stock: 50, category: 'Pharmaceuticals', unit: 'kg' }
        ];
        setInventoryData(mockInventory.map(normalizeInventoryItem));
      });
  }, []);

  const filteredData = useMemo(() => {
    const needle = toText(searchTerm).toLowerCase();
    if (!needle) {
      return inventoryData;
    }

    return inventoryData.filter((item) => toText(item.name).toLowerCase().includes(needle));
  }, [inventoryData, searchTerm]);

  const handleQuickStockUpdate = async (item) => {
    const value = window.prompt(`Update stock for ${item.name}`, String(item.stock));
    if (value == null) {
      return;
    }

    const nextStock = Number(value);
    if (!Number.isFinite(nextStock) || nextStock < 0) {
      showAlert('Please enter a valid stock value', 'warning');
      return;
    }

    try {
      if (!isPersistedInventoryId(item.id)) {
        setInventoryData((prev) =>
          prev.map((row) =>
            row.id === item.id
              ? normalizeInventoryItem({ ...row, stock: nextStock })
              : row
          )
        );
        showAlert('Updated local item stock (not saved to backend)', 'info');
        return;
      }

      await inventoryAPI.updateStock(item.id, nextStock);
      setInventoryData((prev) =>
        prev.map((row) =>
          row.id === item.id
            ? normalizeInventoryItem({ ...row, stock: nextStock })
            : row
        )
      );
      showAlert('Stock updated', 'success');
    } catch (error) {
      showAlert('Failed to update stock', 'error');
    }
  };

  const handleAddItem = () => {
    if (!newItem.name.trim()) {
      showAlert('Item name is required', 'warning');
      return;
    }

    const stock = Number(newItem.stock || 0);
    if (!Number.isFinite(stock) || stock < 0) {
      showAlert('Stock must be a valid non-negative number', 'warning');
      return;
    }

    const localItem = normalizeInventoryItem({
      id: `local-${Date.now()}`,
      name: newItem.name.trim(),
      category: newItem.category.trim() || 'General',
      stock,
      unit: newItem.unit.trim() || 'units',
      expiry: '-',
    });

    setInventoryData((prev) => [localItem, ...prev]);
    setOpenAddDialog(false);
    setNewItem({ name: '', category: '', stock: '', unit: '' });
    showAlert('Item added to dashboard view. Backend create endpoint is not available yet.', 'info');
  };

  const handlePredictDemand = async (item) => {
    try {
      setOpenPredictionDialog(true);
      setPredictionLoading(true);
      setPredictionData(null);
      setPredictionItemName(item.name);

      if (!isPersistedInventoryId(item.id)) {
        const stock = Number(item.stock || 0);
        const predictedDemand = Math.max(5, 30 - Math.min(stock, 25));
        setPredictionData({
          success: true,
          productId: item.id,
          predictedDemand,
          confidence: 0.65,
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          restockAdvice:
            stock <= 10
              ? 'Local item with low stock. Add this item to backend inventory/pharmacy to enable AI-backed forecasting.'
              : 'Local item demand estimated from current stock only.',
        });
        return;
      }

      const response = await aiAPI.getDemandPrediction(item.id);
      setPredictionData(response.data || null);
    } catch (error) {
      showAlert(error?.response?.data?.message || 'Failed to fetch demand prediction', 'error');
    } finally {
      setPredictionLoading(false);
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Inventory Management
        </Typography>
        <Button variant="contained" color="primary" startIcon={<Add />} onClick={() => setOpenAddDialog(true)}>
          Add Item
        </Button>
      </Box>

      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search inventory..."
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
              <TableCell><strong>ID</strong></TableCell>
              <TableCell><strong>Item Name</strong></TableCell>
              <TableCell><strong>Category</strong></TableCell>
              <TableCell><strong>Stock</strong></TableCell>
              <TableCell><strong>Unit</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Expiry Date</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell>{item.id}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    {item.stock}
                    {item.stock < 100 && <Warning color="warning" fontSize="small" sx={{ ml: 1 }} />}
                  </Box>
                </TableCell>
                <TableCell>{item.unit}</TableCell>
                <TableCell>
                  <Chip
                    label={item.status}
                    color={item.status === 'In Stock' ? 'success' : item.status === 'Low Stock' ? 'warning' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{item.expiry}</TableCell>
                <TableCell>
                  <Button size="small" variant="outlined" color="primary" sx={{ mr: 1 }} onClick={() => handleQuickStockUpdate(item)}>
                    Edit
                  </Button>
                  <Button size="small" variant="outlined" onClick={() => handlePredictDemand(item)}>
                    Predict Demand
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Inventory Item</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField fullWidth label="Name" margin="normal" value={newItem.name} onChange={(e) => setNewItem((prev) => ({ ...prev, name: e.target.value }))} />
            <TextField fullWidth label="Category" margin="normal" value={newItem.category} onChange={(e) => setNewItem((prev) => ({ ...prev, category: e.target.value }))} />
            <TextField fullWidth label="Stock" margin="normal" type="number" value={newItem.stock} onChange={(e) => setNewItem((prev) => ({ ...prev, stock: e.target.value }))} />
            <TextField fullWidth label="Unit" margin="normal" value={newItem.unit} onChange={(e) => setNewItem((prev) => ({ ...prev, unit: e.target.value }))} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddItem}>Add</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openPredictionDialog} onClose={() => setOpenPredictionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Demand Prediction: {predictionItemName}</DialogTitle>
        <DialogContent dividers>
          {predictionLoading && <CircularProgress size={24} />}
          {!predictionLoading && predictionData && (
            <Box>
              <Typography variant="body1">Predicted Demand: <strong>{predictionData.predictedDemand}</strong></Typography>
              <Typography variant="body2" color="text.secondary">Prediction Date: {predictionData.date}</Typography>
              <Typography variant="body2" color="text.secondary">Confidence: {predictionData.confidence}</Typography>
              <Typography variant="body1" sx={{ mt: 2 }}>{predictionData.restockAdvice}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPredictionDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Inventory;
