import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ModalPay = ({ page, onClose }) => {


  const handleSave = async () => {
    try {

      onClose(); // Close the modal after saving
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <h2>Edit User</h2>
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <div style={inputContainerStyle}>
            <label style={labelStyle}>Name:</label>
            
          </div>
          <div style={inputContainerStyle}>
            <label style={labelStyle}>Email:</label>

          </div>
          <div style={inputContainerStyle}>
            <label style={labelStyle}>Deposit (In USD):</label>
            
          </div>
 
          <div style={inputContainerStyle}>
            <label style={labelStyle}>Account Active?:</label>
            
          </div>

          <div style={inputContainerStyle}>
            <label style={labelStyle}>Country:</label>
            
          </div>
          <div style={inputContainerStyle}>
            <label style={labelStyle}>Balance (In ETH):</label>
            
          </div>
          <div style={inputContainerStyle}>
            <label style={labelStyle}>Returns (In ETH):</label>
            
          </div>
          <div style={buttonContainerStyle}>
            <button onClick={handleSave} style={saveButtonStyle}>Save</button>
            <button onClick={onClose} style={cancelButtonStyle}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal overlay style (dimmed background)
const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000, // Ensure it's on top of other content
};

// Modal content box style
const modalContentStyle = {
  backgroundColor: 'white',
  padding: '20px',
  borderRadius: '8px',
  width: '500px', // Increased width for better form layout
  textAlign: 'center',
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  maxHeight: '80vh', // Limit the height of the modal
  overflowY: 'auto', // Enable scroll if content exceeds height
};

// Input container for consistent spacing
const inputContainerStyle = {
  marginBottom: '15px', // Space between form fields
  textAlign: 'left',
};

// Label style
const labelStyle = {
  fontWeight: 'bold',
  marginBottom: '5px',
  display: 'block',
  color: '#000',
};

// Input field style
const inputStyle = {
  width: '100%',
  padding: '8px',
  marginBottom: '5px',
  borderRadius: '4px',
  border: '1px solid #ccc',
  fontSize: '14px',
};

// Button container style
const buttonContainerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: '20px',
};

// Save button style
const saveButtonStyle = {
  backgroundColor: '#4CAF50',
  color: 'white',
  padding: '10px 20px',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  transition: 'background-color 0.3s ease',
  width: '48%',
};

const cancelButtonStyle = {
  backgroundColor: '#f44336',
  color: 'white',
  padding: '10px 20px',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  transition: 'background-color 0.3s ease',
  width: '48%',
};

export default ModalPay;
