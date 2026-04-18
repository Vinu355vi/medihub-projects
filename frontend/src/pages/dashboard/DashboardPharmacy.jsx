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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Tabs,
  Tab,
  IconButton,
} from '@mui/material';
import { Add, Delete, Remove } from '@mui/icons-material';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { pharmacyAPI } from '../../services/api';
import { useAlert } from '../../context/AlertContext';
import { useAuth } from '../../context/AuthContext';

const DashboardPharmacy = () => {
  const { user } = useAuth();
  const normalizedRole = String(user?.role || '').replace('ROLE_', '').toUpperCase();
  const isAdmin = normalizedRole === 'ADMIN';
  const isPatient = normalizedRole === 'PATIENT';
  const [tab, setTab] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', category: '', price: '', stock: '' });
  const { showAlert } = useAlert();

  if (normalizedRole === 'DOCTOR') {
    return <Navigate to="/dashboard/doctor" replace />;
  }

  const patientTabLabels = ['Products', 'Cart', 'My Orders'];
  const adminTabLabels = ['Products', 'All Orders'];
  const activeTabLabels = isPatient ? patientTabLabels : adminTabLabels;

  const loadOrders = () => {
    pharmacyAPI
      .getOrders()
      .then((res) => setOrders(Array.isArray(res.data) ? res.data : []))
      .catch((err) => {
        const message = err?.response?.data?.message || 'Failed to load pharmacy orders';
        showAlert(message, 'error');
      });
  };

  const loadProducts = () => {
    pharmacyAPI
      .getProducts()
      .then((res) => {
        const productList = Array.isArray(res.data) ? res.data : [];
        if (productList.length === 0) {
            setProducts([
                {
                  id: 1,
                  name: 'Paracetamol 500mg',
                  category: 'Pain Relief',
                  price: 5.50,
                  stock: 100,
                  description: 'Effective pain reliever and fever reducer.',
                  imageUrl: 'https://placehold.co/300x200?text=Paracetamol',
                  rating: 4.5,
                  isDemo: true
                },
                {
                  id: 2,
                  name: 'Amoxicillin 250mg',
                  category: 'Antibiotics',
                  price: 12.00,
                  stock: 50,
                  description: 'Broad-spectrum antibiotic used to treat bacterial infections.',
                  imageUrl: 'https://placehold.co/300x200?text=Amoxicillin',
                  rating: 4.2,
                  isDemo: true
                },
                {
                  id: 3,
                  name: 'Ibuprofen 400mg',
                  category: 'Anti-inflammatory',
                  price: 8.75,
                  stock: 75,
                  description: 'Nonsteroidal anti-inflammatory drug (NSAID).',
                  imageUrl: 'https://placehold.co/300x200?text=Ibuprofen',
                  rating: 4.0,
                  isDemo: true
                },
                    {
                    id: 4,
                    name: 'Cetirizine 10mg',
                    category: 'Antihistamine',
                    price: 4.20,
                    stock: 120,
                    description: 'Used to relieve allergy symptoms.',
                    rating: 4.3,
                    isDemo: true
                    },
                    {
                    id: 5,
                    name: 'Metformin 500mg',
                    category: 'Antidiabetic',
                    price: 6.00,
                    stock: 60,
                    description: 'Used to treat type 2 diabetes.',
                    rating: 4.1,
                    isDemo: true
                    }
              ]);
        } else {
            setProducts(productList);
        }
      })
      .catch(() => {
        showAlert('Failed to load products. Using demo data.', 'warning');
        setProducts([
          {
            id: 1,
            name: 'Paracetamol 500mg',
            category: 'Pain Relief',
            price: 5.50,
            stock: 100,
            description: 'Effective pain reliever and fever reducer.',
            imageUrl: 'https://placehold.co/300x200?text=Paracetamol',
            rating: 4.5,
            isDemo: true
          },
          {
            id: 2,
            name: 'Amoxicillin 250mg',
            category: 'Antibiotics',
            price: 12.00,
            stock: 50,
            description: 'Broad-spectrum antibiotic used to treat bacterial infections.',
            imageUrl: 'https://placehold.co/300x200?text=Amoxicillin',
            rating: 4.2,
            isDemo: true
          },
          {
            id: 3,
            name: 'Ibuprofen 400mg',
            category: 'Anti-inflammatory',
            price: 8.75,
            stock: 75,
            description: 'Nonsteroidal anti-inflammatory drug (NSAID).',
            imageUrl: 'https://placehold.co/300x200?text=Ibuprofen',
            rating: 4.0,
            isDemo: true
          },
            {
            id: 4,
            name: 'Cetirizine 10mg',
            category: 'Antihistamine',
            price: 4.20,
            stock: 120,
            description: 'Used to relieve allergy symptoms.',
            rating: 4.3,
            isDemo: true
            },
            {
            id: 5,
            name: 'Metformin 500mg',
            category: 'Antidiabetic',
            price: 6.00,
            stock: 60,
            description: 'Used to treat type 2 diabetes.',
            rating: 4.1,
            isDemo: true
            }
        ]);
      });
  };

  const loadCart = () => {
    if (!isPatient) return;
    pharmacyAPI
      .getCart()
      .then((res) => {
        const rows = Array.isArray(res.data?.items) ? res.data.items : [];
        setCartItems(rows);
        setCartTotal(Number(res.data?.total || 0));
      })
      .catch((err) => {
        const message = err?.response?.data?.message || 'Failed to load cart';
        showAlert(message, 'error');
      });
  };

  useEffect(() => {
    loadProducts();
    loadOrders();
    loadCart();
  }, [normalizedRole]);

  const handleCreateProduct = async () => {
    try {
      await pharmacyAPI.createProduct({
        name: newProduct.name,
        category: newProduct.category,
        price: Number(newProduct.price),
        stock: Number(newProduct.stock || 0),
      });
      toast.success('Product added successfully');
      setOpenAddDialog(false);
      setNewProduct({ name: '', category: '', price: '', stock: '' });
      loadProducts();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to add product');
    }
  };

  const handleAddToCart = async (product) => {
    if (product.isDemo) {
        showAlert('This is a demo product and cannot be added to the cart. Please ensure the backend server is running and seeded with data.', 'warning');
        return;
    }
    try {
      await pharmacyAPI.addToCart(product.id, 1);
      toast.success(`${product.name || 'Product'} added to cart`);
      loadCart();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to add to cart');
    }
  };

  const handleUpdateCartQuantity = async (cartItemId, quantity) => {
    if (quantity < 1) return;
    try {
      await pharmacyAPI.updateCartItem(cartItemId, quantity);
      loadCart();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update quantity');
    }
  };

  const handleRemoveCartItem = async (cartItemId) => {
    try {
      await pharmacyAPI.removeCartItem(cartItemId);
      toast.info('Item removed from cart');
      loadCart();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to remove cart item');
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm('Clear all items in cart?')) return;
    try {
      await pharmacyAPI.clearCart();
      toast.info('Cart cleared');
      loadCart();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to clear cart');
    }
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast.warning('Cart is empty');
      return;
    }
    try {
      await pharmacyAPI.checkoutCart();
      toast.success('Order request sent to admin');
      setTab(2);
      loadCart();
      loadOrders();
      loadProducts();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to place order');
    }
  };

  const handleAdminStatusUpdate = async (orderId, status) => {
    try {
      await pharmacyAPI.updateOrderStatus(orderId, status);
      toast.success(`Order marked as ${status}`);
      loadOrders();
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to update order status';
      toast.error(message);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await pharmacyAPI.deleteProduct(productId);
      toast.success('Product deleted successfully');
      loadProducts();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to delete product');
    }
  };

  const pendingOrderCount = useMemo(
    () => orders.filter((order) => String(order.status || '').toUpperCase() === 'PENDING').length,
    [orders]
  );

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" component="h1">
          {isAdmin ? 'Pharmacy Management' : 'Pharmacy'}
        </Typography>
        {isAdmin && tab === 0 && (
          <Button variant="contained" onClick={() => setOpenAddDialog(true)}>
            Add Product
          </Button>
        )}
      </Box>

      <Paper sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_, next) => setTab(next)}>
          {activeTabLabels.map((label) => (
            <Tab
              key={label}
              label={label === 'All Orders' && pendingOrderCount > 0 ? `${label} (${pendingOrderCount} pending)` : label}
            />
          ))}
        </Tabs>
      </Paper>

      {tab === 0 && (
        <Paper elevation={3}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell>ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Stock</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.id}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.category || '-'}</TableCell>
                    <TableCell>{product.price ?? '-'}</TableCell>
                    <TableCell>{product.stock ?? '-'}</TableCell>
                    <TableCell>
                        {isPatient && (
                        <Button
                          size="small"
                          variant="contained"
                          disabled={Number(product.stock || 0) <= 0}
                          onClick={() => handleAddToCart(product)}
                        >
                          Add to Cart
                        </Button>
                        )}
                        {isAdmin && (
                            <IconButton color="error" onClick={() => handleDeleteProduct(product.id)}>
                                <Delete />
                            </IconButton>
                        )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {isPatient && tab === 1 && (
        <Paper elevation={3} sx={{ p: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Cart</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" color="error" onClick={handleClearCart} disabled={cartItems.length === 0}>
                Clear Cart
              </Button>
              <Button variant="contained" onClick={handleCheckout} disabled={cartItems.length === 0}>
                Buy
              </Button>
            </Box>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell>Product</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Subtotal</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cartItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.price}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleUpdateCartQuantity(item.id, Number(item.quantity || 0) - 1)}
                          disabled={Number(item.quantity || 0) <= 1}
                        >
                          <Remove fontSize="small" />
                        </IconButton>
                        <Typography variant="body2">{item.quantity}</Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleUpdateCartQuantity(item.id, Number(item.quantity || 0) + 1)}
                          disabled={Number(item.quantity || 0) >= Number(item.stock || 0)}
                        >
                          <Add fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell>{item.subtotal}</TableCell>
                    <TableCell>
                      <IconButton size="small" color="error" onClick={() => handleRemoveCartItem(item.id)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {cartItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">No items in cart</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ mt: 2, textAlign: 'right' }}>
            <Typography variant="h6">Total: {cartTotal}</Typography>
          </Box>
        </Paper>
      )}

      {((isAdmin && tab === 1) || (isPatient && tab === 2)) && (
        <Paper elevation={3}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell>Order</TableCell>
                  <TableCell>Patient</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={`${order.orderId || order.id}`}>
                    <TableCell>{order.id}</TableCell>
                    <TableCell>{order.patient}</TableCell>
                    <TableCell>{order.items}</TableCell>
                    <TableCell>{order.total ?? '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={order.status}
                        color={
                          order.status === 'DELIVERED'
                            ? 'success'
                            : order.status === 'PENDING'
                              ? 'warning'
                              : order.status === 'CANCELLED'
                                ? 'error'
                                : 'info'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button size="small" variant="outlined" onClick={() => setSelectedOrder(order)}>
                          View
                        </Button>
                        {isAdmin && String(order.status || '').toUpperCase() === 'PENDING' && (
                          <>
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              onClick={() => handleAdminStatusUpdate(order.orderId, 'DELIVERED')}
                            >
                              Mark Delivered
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              color="error"
                              onClick={() => handleAdminStatusUpdate(order.orderId, 'CANCELLED')}
                            >
                              Cancel Order
                            </Button>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {orders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">No orders found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Dialog open={Boolean(selectedOrder)} onClose={() => setSelectedOrder(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Order Details</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box sx={{ pt: 1 }}>
              <Typography><strong>Order:</strong> {selectedOrder.id}</Typography>
              <Typography><strong>Patient:</strong> {selectedOrder.patient}</Typography>
              <Typography><strong>Total:</strong> {selectedOrder.total ?? '-'}</Typography>
              <Typography><strong>Status:</strong> {selectedOrder.status}</Typography>
              <Typography sx={{ mt: 1 }}><strong>Items:</strong></Typography>
              {Array.isArray(selectedOrder.itemDetails) && selectedOrder.itemDetails.length > 0 ? (
                selectedOrder.itemDetails.map((item, idx) => (
                  <Typography key={`${item.productId || idx}`} variant="body2">
                    {item.productName} x {item.quantity}
                  </Typography>
                ))
              ) : (
                <Typography variant="body2">{selectedOrder.items || '-'}</Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedOrder(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Pharmacy Product</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Product Name"
                value={newProduct.name}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Category"
                value={newProduct.category}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, category: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Price"
                value={newProduct.price}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, price: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Initial Stock"
                value={newProduct.stock}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, stock: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateProduct}>Add Product</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DashboardPharmacy;
