import React, { useState, useEffect } from 'react';
import { Spinner } from "react-bootstrap";
import axios from 'axios';

const EditUserModal = ({ user, onClose, onUserUpdated }) => {
  const [editedUser, setEditedUser] = useState(user);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setEditedUser(user);
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedUser({ ...editedUser, [name]: value });
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await axios.put(
        `https://nft-broker-mroz.onrender.com/api/users/${editedUser._id}`,
        editedUser
      );
      onUserUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <h3 style={headerStyle}>Edit User</h3>
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          {renderInput("Name", "name", "text", editedUser.name, handleChange)}
          {renderInput("Email", "email", "email", editedUser.email, handleChange)}
          {renderInput("Total Deposit (USD)", "deposit", "number", editedUser.deposit, handleChange)}
          {renderSelect("Account Verified?", "isUserActive", editedUser.isUserActive, handleChange)}
          {renderInput("Country", "country", "text", editedUser.country, handleChange)}
          {renderInput("Balance (ETH)", "balance", "number", editedUser.balance, handleChange)}
          {renderInput("Returns (ETH)", "returns", "number", editedUser.returns, handleChange)}

          {isLoading ? (
            <div className="text-center mt-3">
              <Spinner animation="border" size="sm" variant='primary' />
            </div>
          ) : (
            <div style={buttonContainerStyle}>
              <button type="submit" style={saveButtonStyle}>Save</button>
              <button type="button" onClick={onClose} style={cancelButtonStyle}>Cancel</button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

// 🔧 Reusable input generator
const renderInput = (label, name, type, value, onChange) => (
  <div style={inputContainerStyle}>
    <label style={labelStyle}>{label}:</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      style={inputStyle}
    />
  </div>
);

// 🔧 Reusable select generator
const renderSelect = (label, name, value, onChange) => (
  <div style={inputContainerStyle}>
    <label style={labelStyle}>{label}:</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      style={inputStyle}
    >
      <option value="true">Active</option>
      <option value="false">Inactive</option>
    </select>
  </div>
);

// Styles
const modalOverlayStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',     // push down from top
  paddingTop: '80px',           // control top spacing
  zIndex: 9999
};


const modalContentStyle = {
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(12px)',
  borderRadius: '16px',
  padding: '25px',
  width: '95%',
  maxWidth: '500px',
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
};

const headerStyle = {
  textAlign: 'center',
  marginBottom: '20px',
  color: '#1f2937',
  fontWeight: 'bold',
};

const inputContainerStyle = {
  marginBottom: '15px',
};

const labelStyle = {
  display: 'block',
  fontWeight: '600',
  marginBottom: '6px',
  color: '#374151',
};

const inputStyle = {
  width: '100%',
  padding: '10px',
  borderRadius: '8px',
  border: '1px solid #cbd5e1',
  fontSize: '15px',
  backgroundColor: '#f9fafb',
  color: '#1e293b'
};

const buttonContainerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: '20px',
};

const saveButtonStyle = {
  backgroundColor: '#2563eb',
  color: 'white',
  padding: '10px 20px',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: '600',
  width: '48%',
  transition: 'all 0.3s ease',
};

const cancelButtonStyle = {
  backgroundColor: '#ef4444',
  color: 'white',
  padding: '10px 20px',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: '600',
  width: '48%',
  transition: 'all 0.3s ease',
};

export default EditUserModal;
