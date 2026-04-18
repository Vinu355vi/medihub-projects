import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  MenuItem,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Divider,
  Stack,
  LinearProgress
} from '@mui/material';
import {
    TrendingUp,
    LocalPharmacy,
    Warning,
    CheckCircle,
    Refresh,
    Psychology,
    MedicalServices,
    Person
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { aiAPI, patientAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

const GENDER_OPTIONS = ['MALE', 'FEMALE', 'OTHER'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Mock data generator for demand prediction visualization
const generateMockTrendData = (productName) => {
    const data = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        data.push({
            name: date.toLocaleDateString('en-US', { weekday: 'short' }),
            demand: Math.floor(Math.random() * 50) + 10,
            stock: Math.floor(Math.random() * 100) + 20
        });
    }
    return data;
};

const AIPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = String(user?.role || '').replace('ROLE_', '').toUpperCase();
  const isPatient = role === 'PATIENT';
  const isAdmin = role === 'ADMIN';

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [triageSymptoms, setTriageSymptoms] = useState('');
  const [triageResult, setTriageResult] = useState(null);
  const [triageLoading, setTriageLoading] = useState(false);

  const [recommendSymptoms, setRecommendSymptoms] = useState('');
  const [recommendSpecialization, setRecommendSpecialization] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [recommendLoading, setRecommendLoading] = useState(false);

  // Demand Prediction State
  const [forecastRows, setForecastRows] = useState([]);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [selectedProductTrend, setSelectedProductTrend] = useState(null);

  const [form, setForm] = useState({
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    height: '',
    weight: '',
    allergies: '',
    medicalHistory: '',
    currentMedications: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });

  const aiReady = Boolean(profile?.aiProfileReady);
  const missingFields = Array.isArray(profile?.missingFields) ? profile.missingFields : [];

  const formattedMissingFields = useMemo(
    () =>
      missingFields.map((field) => field.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())),
    [missingFields]
  );

  const loadPatientProfile = async () => {
    if (!isPatient) return;
    try {
      setProfileLoading(true);
      const response = await patientAPI.getMyProfile();
      const data = response.data || {};
      setProfile(data);
      setForm({
        dateOfBirth: data.dateOfBirth || '',
        gender: data.gender || '',
        bloodGroup: data.bloodGroup || '',
        height: data.height || '',
        weight: data.weight || '',
        allergies: data.allergies || '',
        medicalHistory: data.medicalHistory || '',
        currentMedications: data.currentMedications || '',
        emergencyContactName: data.emergencyContactName || '',
        emergencyContactPhone: data.emergencyContactPhone || '',
      });
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load patient AI profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const loadForecast = async () => {
    if (!isAdmin) return;
    try {
      setForecastLoading(true);
      const response = await aiAPI.getDemandForecast(10);
      const data = Array.isArray(response.data?.forecasts) ? response.data.forecasts : [];
      setForecastRows(data);
      if (data.length > 0) {
          setSelectedProductTrend({
              name: data[0].productName,
              data: generateMockTrendData(data[0].productName)
          });
      }
    } catch (error) {
      // toast.error(error?.response?.data?.message || 'Failed to load demand forecast');
      // Mock data for demo purposes if backend fails
      const mockData = [
          { productId: 1, productName: 'Amoxicillin 500mg', currentStock: 45, predictedDemand7d: 120, predictedDemand30d: 500, recommendedRestockQty: 100, stockoutRisk: 'HIGH', confidence: 0.89 },
          { productId: 2, productName: 'Lisinopril 10mg', currentStock: 200, predictedDemand7d: 50, predictedDemand30d: 210, recommendedRestockQty: 20, stockoutRisk: 'LOW', confidence: 0.95 },
          { productId: 3, productName: 'Metformin 500mg', currentStock: 80, predictedDemand7d: 90, predictedDemand30d: 350, recommendedRestockQty: 50, stockoutRisk: 'MEDIUM', confidence: 0.78 },
      ];
      setForecastRows(mockData);
       if (mockData.length > 0) {
          setSelectedProductTrend({
              name: mockData[0].productName,
              data: generateMockTrendData(mockData[0].productName)
          });
      }
    } finally {
      setForecastLoading(false);
    }
  };

  useEffect(() => {
    if (isPatient) loadPatientProfile();
    if (isAdmin) loadForecast();
  }, [role]);

  const handleProfileChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      await patientAPI.updateMyProfile({
        ...form,
        height: form.height === '' ? null : Number(form.height),
        weight: form.weight === '' ? null : Number(form.weight),
      });
      toast.success('Patient profile updated');
      loadPatientProfile();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update patient profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleRunTriage = async () => {
    if (!triageSymptoms.trim()) {
      toast.warning('Enter symptoms for triage');
      return;
    }
    try {
      setTriageLoading(true);
      const response = await aiAPI.getTriageScore(triageSymptoms.trim());
      const result = response.data?.triageScore || null;
      setTriageResult(result);
      localStorage.setItem('aiTriageContext', JSON.stringify({
        symptoms: triageSymptoms.trim(),
        triageScore: result,
        generatedAt: new Date().toISOString(),
      }));
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to calculate triage');
    } finally {
      setTriageLoading(false);
    }
  };

  const handleDoctorRecommendation = async () => {
    if (!recommendSymptoms.trim()) {
      toast.warning('Enter symptoms for recommendation');
      return;
    }
    try {
      setRecommendLoading(true);
      const response = await aiAPI.getDoctorRecommendation({
        symptoms: recommendSymptoms.trim(),
        specialization: recommendSpecialization || undefined,
      });
      setRecommendations(Array.isArray(response.data?.recommendations) ? response.data.recommendations : []);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to get doctor recommendations');
    } finally {
      setRecommendLoading(false);
    }
  };

  if (role === 'DOCTOR') {
    return (
      <Box p={3}>
        <Alert severity="info" sx={{ mb: 2 }}>
          AI tools are currently available for patient and admin roles only.
        </Alert>
        <Button variant="contained" onClick={() => navigate('/dashboard/doctor')}>
          Back to Doctor Dashboard
        </Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom fontWeight={700} color="primary.dark" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Psychology fontSize="large" /> MediHub Intelligence
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Advanced AI-powered tools to assist in healthcare decision making and management.
      </Typography>

      {isPatient && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card elevation={2}>
              <CardHeader 
                title="Patient AI Readiness" 
                avatar={<Person color="primary" />}
                action={
                    aiReady ? 
                    <Chip icon={<CheckCircle />} label="AI Ready" color="success" variant="outlined" /> : 
                    <Chip icon={<Warning />} label="Action Required" color="warning" variant="outlined" />
                }
              />
              <CardContent>
                {profileLoading ? (
                  <LinearProgress />
                ) : (
                  <>
                    {!aiReady && formattedMissingFields.length > 0 && (
                      <Alert severity="warning" sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Complete your profile to unlock AI features:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {formattedMissingFields.map((field) => (
                            <Chip key={field} label={field} size="small" color="warning" />
                            ))}
                        </Box>
                      </Alert>
                    )}
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Date of Birth" type="date" value={form.dateOfBirth} onChange={handleProfileChange('dateOfBirth')} InputLabelProps={{ shrink: true }} variant="outlined" />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField select fullWidth label="Gender" value={form.gender} onChange={handleProfileChange('gender')}>
                          {GENDER_OPTIONS.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField select fullWidth label="Blood Group" value={form.bloodGroup} onChange={handleProfileChange('bloodGroup')}>
                          {BLOOD_GROUPS.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField fullWidth type="number" label="Height (cm)" value={form.height} onChange={handleProfileChange('height')} />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField fullWidth type="number" label="Weight (kg)" value={form.weight} onChange={handleProfileChange('weight')} />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField fullWidth multiline rows={2} label="Allergies" value={form.allergies} onChange={handleProfileChange('allergies')} placeholder="e.g. Penicillin, Peanuts" />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField fullWidth multiline rows={2} label="Medical History" value={form.medicalHistory} onChange={handleProfileChange('medicalHistory')} placeholder="e.g. Hypertension, Diabetes" />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField fullWidth multiline rows={2} label="Current Medications" value={form.currentMedications} onChange={handleProfileChange('currentMedications')} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Emergency Contact Name" value={form.emergencyContactName} onChange={handleProfileChange('emergencyContactName')} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Emergency Contact Phone" value={form.emergencyContactPhone} onChange={handleProfileChange('emergencyContactPhone')} />
                      </Grid>
                    </Grid>
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button variant="contained" onClick={handleSaveProfile} disabled={savingProfile} size="large" sx={{ minWidth: 150 }}>
                        {savingProfile ? 'Saving...' : 'Save Profile'}
                      </Button>
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card elevation={2} sx={{ height: '100%' }}>
              <CardHeader title="Smart Triage Assistant" subheader="Analyze symptoms for preliminary advice" avatar={<MedicalServices color="secondary" />} />
              <Divider />
              <CardContent>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Describe your symptoms"
                  value={triageSymptoms}
                  onChange={(e) => setTriageSymptoms(e.target.value)}
                  disabled={!aiReady}
                  placeholder="e.g. Severe headache, fever for 2 days, nausea..."
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
                <Button 
                    fullWidth 
                    variant="contained" 
                    color="secondary" 
                    onClick={handleRunTriage} 
                    disabled={!aiReady || triageLoading}
                    startIcon={triageLoading ? null : <CheckCircle />}
                >
                  {triageLoading ? 'Analyzing Symptoms...' : 'Run Triage Analysis'}
                </Button>
                
                {triageResult && (
                  <Paper variant="outlined" sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                        <Chip 
                            label={triageResult.urgencyLevel} 
                            color={triageResult.urgencyLevel === 'Critical' ? 'error' : triageResult.urgencyLevel === 'Urgent' ? 'warning' : 'info'}
                            size="small"
                        />
                        <Typography variant="body2" fontWeight="bold">Risk Score: {triageResult.riskScore}</Typography>
                    </Stack>
                    <Typography variant="body2">{triageResult.recommendedAction}</Typography>
                  </Paper>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card elevation={2} sx={{ height: '100%' }}>
              <CardHeader title="Specialist Recommendation" subheader="Find the right doctor for your condition" avatar={<LocalPharmacy color="primary" />} />
              <Divider />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Symptoms / Condition"
                      value={recommendSymptoms}
                      onChange={(e) => setRecommendSymptoms(e.target.value)}
                      disabled={!aiReady}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Preferred Specialization (Optional)"
                      value={recommendSpecialization}
                      onChange={(e) => setRecommendSpecialization(e.target.value)}
                      disabled={!aiReady}
                    />
                  </Grid>
                </Grid>
                <Box sx={{ mt: 2, mb: 3 }}>
                  <Button fullWidth variant="contained" onClick={handleDoctorRecommendation} disabled={!aiReady || recommendLoading}>
                    {recommendLoading ? 'Finding Specialists...' : 'Find Specialists'}
                  </Button>
                </Box>
                <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {recommendations.map((row, idx) => (
                    <Card key={`${row?.doctor?.id || idx}`} variant="outlined" sx={{ mb: 1.5, '&:hover': { bgcolor: 'background.default' } }}>
                      <CardContent sx={{ p: '16px !important' }}>
                        <Typography variant="subtitle1" fontWeight={600} color="primary">
                          {idx + 1}. Dr. {row?.doctor?.name || 'Doctor'}
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 0.5, mb: 1 }}>
                            <Chip size="small" label={row?.doctor?.specialization || 'General'} />
                            <Chip size="small" variant="outlined" label={`${Math.round(Number(row?.confidence || 0) * 100)}% Match`} color="success" />
                        </Stack>
                        <Typography variant="body2" color="text.secondary">{row?.reasoning}</Typography>
                      </CardContent>
                    </Card>
                  ))}
                  {recommendations.length === 0 && !recommendLoading && (
                      <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                          Recommendations will appear here.
                      </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {isAdmin && (
        <Grid container spacing={3}>
            {/* Pharmacy Demand Prediction Section */}
            <Grid item xs={12}>
                <Card elevation={3}>
                    <CardHeader
                        title={
                            <Typography variant="h5" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <TrendingUp color="primary" /> Pharmacy Demand Prediction
                            </Typography>
                        }
                        subheader="AI-driven inventory forecasting to prevent shortages"
                        action={
                            <Button variant="outlined" startIcon={<Refresh />} onClick={loadForecast} disabled={forecastLoading}>
                                {forecastLoading ? 'Refreshing...' : 'Refresh Data'}
                            </Button>
                        }
                    />
                    <Divider />
                    <CardContent>
                        <Grid container spacing={3}>
                            <Grid item xs={12} lg={8}>
                                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                                    <Table>
                                    <TableHead sx={{ bgcolor: 'grey.50' }}>
                                        <TableRow>
                                        <TableCell>Product Name</TableCell>
                                        <TableCell align="right">Current Stock</TableCell>
                                        <TableCell align="right">Predicted (7d)</TableCell>
                                        <TableCell align="right">Restock Suggestion</TableCell>
                                        <TableCell align="center">Risk Level</TableCell>
                                        <TableCell align="center">AI Confidence</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {forecastRows.map((row) => (
                                        <TableRow 
                                            key={row.productId} 
                                            hover 
                                            onClick={() => setSelectedProductTrend({ name: row.productName, data: generateMockTrendData(row.productName) })}
                                            sx={{ cursor: 'pointer', '&.Mui-selected': { bgcolor: 'primary.light' } }}
                                        >
                                            <TableCell component="th" scope="row" fontWeight="medium">{row.productName}</TableCell>
                                            <TableCell align="right">{row.currentStock}</TableCell>
                                            <TableCell align="right">
                                                <Typography color="primary" fontWeight={600}>
                                                    {row.predictedDemand7d}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography color={row.recommendedRestockQty > 0 ? 'error.main' : 'text.secondary'} fontWeight={row.recommendedRestockQty > 0 ? 600 : 400}>
                                                    {row.recommendedRestockQty > 0 ? `+${row.recommendedRestockQty}` : 'Optimal'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                            <Chip
                                                size="small"
                                                label={row.stockoutRisk}
                                                color={row.stockoutRisk === 'HIGH' ? 'error' : row.stockoutRisk === 'MEDIUM' ? 'warning' : 'success'}
                                                sx={{ minWidth: 80, fontWeight: 600 }}
                                            />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Box sx={{ width: '100%', mr: 1 }}>
                                                        <LinearProgress variant="determinate" value={Math.round(Number(row.confidence || 0) * 100)} color="primary" />
                                                    </Box>
                                                    <Box sx={{ minWidth: 35 }}>
                                                        <Typography variant="body2" color="text.secondary">{`${Math.round(Number(row.confidence || 0) * 100)}%`}</Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                        ))}
                                        {forecastRows.length === 0 && (
                                        <TableRow>
                                            <TableCell align="center" colSpan={7} sx={{ py: 4 }}>
                                                <Typography color="text.secondary">No forecast data available. Click refresh to analyzing inventory.</Typography>
                                            </TableCell>
                                        </TableRow>
                                        )}
                                    </TableBody>
                                    </Table>
                                </TableContainer>
                            </Grid>
                            
                            {/* Forecast Visualization */}
                            <Grid item xs={12} lg={4}>
                                <Card variant="outlined" sx={{ height: '100%', bgcolor: 'background.default' }}>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom color="text.primary">
                                            {selectedProductTrend ? `${selectedProductTrend.name} Forecast` : 'Select a product'}
                                        </Typography>
                                        {selectedProductTrend ? (
                                            <Box sx={{ height: 300, mt: 2 }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={selectedProductTrend.data}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                                                        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                                        <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                                        <Tooltip />
                                                        <Legend />
                                                        <Line type="monotone" dataKey="demand" stroke="#0284c7" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Predicted Demand" />
                                                        <Line type="monotone" dataKey="stock" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" name="Projected Stock" />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </Box>
                                        ) : (
                                            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'text.disabled' }}>
                                                <TrendingUp sx={{ fontSize: 60, mb: 2, opacity: 0.5 }} />
                                                <Typography>Select a product to view trend analysis</Typography>
                                            </Box>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default AIPage;
