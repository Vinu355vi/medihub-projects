// frontend/src/components/common/ConfirmDialog.jsx
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  IconButton,
  Box,
} from '@mui/material';
import { Close, Warning, Info, Error, CheckCircle } from '@mui/icons-material';

const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info', // 'info', 'warning', 'error', 'success'
  maxWidth = 'sm',
  isLoading = false,
  children,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <Warning color="warning" sx={{ fontSize: 40 }} />;
      case 'error':
        return <Error color="error" sx={{ fontSize: 40 }} />;
      case 'success':
        return <CheckCircle color="success" sx={{ fontSize: 40 }} />;
      default:
        return <Info color="info" sx={{ fontSize: 40 }} />;
    }
  };

  const getConfirmButtonColor = () => {
    switch (type) {
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      case 'success':
        return 'success';
      default:
        return 'primary';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {getIcon()}
          <Typography variant="h6" sx={{ ml: 2, flexGrow: 1 }}>
            {title}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {message && (
          <Typography variant="body1" sx={{ mt: 2 }}>
            {message}
          </Typography>
        )}
        
        {children}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={isLoading}>
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color={getConfirmButtonColor()}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;