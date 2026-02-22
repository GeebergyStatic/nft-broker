import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import EditUserModal from './EditUserModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { useUserContext } from './UserRoleContext';
import WalletManager from './WalletManager';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const { userData } = useUserContext();
  const [searchTerm, setSearchTerm] = useState(''); // ✅ New state
  const agentID = userData.agentID;
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchUsers(agentID);
  }, []);

  const fetchUsers = async (agentID) => {
    setIsLoading(true);
    try {
      // Include the agentID as a query parameter in the API request
      const response = await axios.get(`https://nft-broker-mroz.onrender.com/api/users?agentID=${agentID}`);
      setUsers(response.data); // Assuming response.data is an array of users
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (user) => {
    setSelectedUser(user); // Set the selected user for editing
  };

  const filteredUsers = users.filter(user =>
    user.userId?.toString().toLowerCase().includes(searchTerm.toLowerCase()) || // ✅ fixed case sensitivity
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );



  const containerStyle = {
    // position: 'absolute',
    minHeight: '100vh',
    // width: '100%', 
    background: "linear-gradient(90deg, rgba(200, 220, 240, 0.9) 0%, rgba(220, 230, 250, 0.85) 100%)",
    overflowX: 'scroll',
    color: '#000',
    padding: '30px',
    // borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    // marginTop: '20px',
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '20px',
  };

  const thStyle = {
    backgroundColor: '#444',
    color: '#fff',
    padding: '10px',
    textAlign: 'left',
  };

  const tdStyle = {
    padding: '10px',
    textAlign: 'left',
    borderBottom: '1px solid #ccc',
  };

  const buttonStyle = {
    backgroundColor: '#1f78d1',
    color: '#fff',
    padding: '8px 16px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  };

  const buttonHoverStyle = {
    backgroundColor: '#165ea0',
  };

  return (
    <div className='container-large'>
      <div className='container'>

        <div className='main-container' style={containerStyle}>
          <Link to='/'><i class="fa fa-arrow-left"></i> Back to home</Link>
          <WalletManager />
          <h1 className='mt-5'>User Management</h1>
          <span className='text-warning mb-1'><FontAwesomeIcon className='mx-2' icon={faInfoCircle} />You can edit and load your clients' accounts from here!</span>
          {/* ✅ Search Bar */}
          <input
            type="text"
            placeholder="Search by ID, name, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '10px',
              width: '100%',
              marginTop: '20px',
              borderRadius: '5px',
              border: '1px solid #ccc',
              boxSizing: 'border-box'
            }}
          />
          {isLoading ? (
            <div className="text-center">
              <i className="fa fa-spinner fa-spin fa-3x fa-fw text-light"></i>
              <p className="text-light">Loading users...</p>
            </div>
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Total Deposit</th>
                  <th style={thStyle}>Account Verified?</th>
                  <th style={thStyle}>Country</th>
                  <th style={thStyle}>Balance</th>
                  <th style={thStyle}>Returns/Profit</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => ( // ✅ Use filtered users
                  <tr key={user.id}>
                    <td style={tdStyle}>{user.userId}</td>
                    <td style={tdStyle}>{user.name}</td>
                    <td style={tdStyle}>{user.email}</td>
                    <td style={tdStyle}>{user.deposit} ETH</td>
                    <td style={tdStyle}>{user.isUserActive ? 'true' : 'false'}</td>
                    <td style={tdStyle}>{user.country}</td>
                    <td style={tdStyle}>{user.balance} ETH</td>
                    <td style={tdStyle}>{user.returns} ETH</td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => handleEditClick(user)}
                        style={buttonStyle}
                        onMouseOver={(e) => (e.target.style.backgroundColor = buttonHoverStyle.backgroundColor)}
                        onMouseOut={(e) => (e.target.style.backgroundColor = buttonStyle.backgroundColor)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selectedUser && (
            <EditUserModal user={selectedUser} onClose={() => setSelectedUser(null)} onUserUpdated={fetchUsers} />
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
