// frontend/src/pages/Pharmacy.jsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  TextField,
  Box,
  Chip,
  Rating,
  Pagination,
  Select,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  LocalPharmacy,
  ShoppingCart,
  MedicalServices,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { pharmacyAPI } from '../services/api';

const Pharmacy = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, category]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await pharmacyAPI.getProducts();
      const productList = Array.isArray(response.data) ? response.data : [];
      
      if (productList.length === 0) {
        throw new Error('No products found');
      }
      
      setProducts(productList);
      setFilteredProducts(productList);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products. Using demo data.');
      
      // Fallback demo data
      const demoProducts = [
        {
          id: 1,
          name: 'Paracetamol 500mg',
          category: 'Pain Relief',
          price: 5.50,
          stock: 100,
          description: 'Effective pain reliever and fever reducer.',
          imageUrl: 'https://placehold.co/300x200?text=Paracetamol',
          rating: 4.5
        },
        {
          id: 2,
          name: 'Amoxicillin 250mg',
          category: 'Antibiotics',
          price: 12.00,
          stock: 50,
          description: 'Broad-spectrum antibiotic used to treat bacterial infections.',
          imageUrl: 'https://placehold.co/300x200?text=Amoxicillin',
          rating: 4.2
        },
        {
          id: 3,
          name: 'Ibuprofen 400mg',
          category: 'Anti-inflammatory',
          price: 8.75,
          stock: 75,
          description: 'Nonsteroidal anti-inflammatory drug (NSAID).',
          imageUrl: 'https://placehold.co/300x200?text=Ibuprofen',
          rating: 4.0
        },
        {
            id: 4,
            name: 'Cetirizine 10mg',
            category: 'Antihistamine',
            price: 4.20,
            stock: 120,
            description: 'Used to relieve allergy symptoms.',
            imageUrl: 'https://placehold.co/300x200?text=Cetirizine',
            rating: 4.3
            },
           {
            id: 5,
            name: 'Metformin 500mg',
            category: 'Antidiabetic',
            price: 6.00,
            stock: 60,
            description: 'Used to treat type 2 diabetes.',
            imageUrl: 'https://placehold.co/300x200?text=Metformin',
            rating: 4.1
            }
      ];
      setProducts(demoProducts);
      setFilteredProducts(demoProducts);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.genericName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (category !== 'all') {
      filtered = filtered.filter(product => product.category === category);
    }

    setFilteredProducts(filtered);
    setPage(1);
  };

  const categories = [
    'all',
    'antibiotics',
    'pain-relievers',
    'vitamins',
    'diabetes',
    'cardiology',
    'respiratory',
    'dermatology'
  ];

  const addToCart = (product) => {
    toast.success(`${product?.name || 'Product'} added to cart`);
  };

  const productsPerPage = 9;
  const pageCount = Math.ceil(filteredProducts.length / productsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (page - 1) * productsPerPage,
    page * productsPerPage
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Hero Section */}
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <LocalPharmacy sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
        <Typography variant="h3" component="h1" gutterBottom>
          Online Pharmacy
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          Get your medicines delivered with AI-powered safety checks
        </Typography>
      </Box>

      {/* Search and Filter */}
      <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search medicines..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          sx={{ minWidth: 150 }}
        >
          {categories.map((cat) => (
            <MenuItem key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </MenuItem>
          ))}
        </Select>
      </Box>

      {/* Safety Banner */}
      <Box
        sx={{
          bgcolor: 'info.light',
          p: 3,
          borderRadius: 2,
          mb: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <MedicalServices color="primary" />
        <Typography>
          <strong>AI Safety Check:</strong> All medications are verified for drug interactions
        </Typography>
      </Box>

      {/* Products Grid */}
      {loading ? (
        <Typography align="center">Loading products...</Typography>
      ) : (
        <>
          <Grid container spacing={3}>
            {paginatedProducts.map((product) => (
              <Grid item xs={12} sm={6} md={4} key={product.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100', mb: 2 }}>
                    <LocalPharmacy sx={{ fontSize: 80, color: 'primary.main' }} />
                  </Box>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h6" component="h3">
                      {product.name || 'Unnamed Product'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Product ID: {product.id ?? 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Stock: {product.stock ?? 'N/A'}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6" color="primary">
                        ₹{product.price ?? 'N/A'}
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<ShoppingCart />}
                        onClick={() => addToCart(product)}
                        disabled={product.stock === 0 || product.stock === undefined}
                      >
                        {product.stock === 0 || product.stock === undefined ? 'Out of Stock' : 'Add to Cart'}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {pageCount > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={pageCount}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* Features Section */}
      <Box sx={{ mt: 8, p: 4, bgcolor: 'grey.50', borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom align="center">
          Why Buy From MediHub Pharmacy?
        </Typography>
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <MedicalServices sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Drug Interaction Check
              </Typography>
              <Typography variant="body2">
                AI-powered safety alerts for harmful drug combinations
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <LocalPharmacy sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Genuine Medicines
              </Typography>
              <Typography variant="body2">
                100% authentic medicines from verified suppliers
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <ShoppingCart sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Fast Delivery
              </Typography>
              <Typography variant="body2">
                Same-day delivery for critical medicines
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Pharmacy;
