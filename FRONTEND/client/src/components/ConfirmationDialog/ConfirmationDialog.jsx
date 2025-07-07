import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import React from 'react';
import './ConfirmationDialog.css';

const ConfirmationDialog = ({ open, title, message, onCancel, onSubmit, isLoading }) => {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description">
      <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <button onClick={onCancel} className="cancel-button" disabled={isLoading}>
          Cancel
        </button>
        <button onClick={onSubmit} className="submit-button" disabled={isLoading}>
          {isLoading ? <CircularProgress size={24} /> : 'Submit'}
        </button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog;
