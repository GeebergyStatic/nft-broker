import React, { useState, useEffect } from 'react';
import { useUserContext } from './UserRoleContext';
import { ToastContainer, toast } from "react-toastify";
import { Spinner } from "react-bootstrap";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle, faEllipsisV, faTrash } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

const NftWithdrawList = () => { // Rename the function to start with an uppercase letter
  const { userData } = useUserContext();
  const agentID = userData.agentID;
  const [nftWithdrawals, setNftWithdrawals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch pending artwork deposits
  const fetchPendingWithdrawals = async () => {
    try {
      const response = await axios.get(`https://nft-broker-mroz.onrender.com/api/pending-withdrawals/${agentID}`);
      setNftWithdrawals(response.data);
    } catch (error) {
      console.log("Error fetching deposits: " + (error.response?.data?.message || error.message));
    }
  };

  useEffect(() => {
    fetchPendingWithdrawals();
  }, []);

  // Update transaction status
  const changePaymentStatus = async (transactionReference, status, txId) => {
    setIsLoading(true);
    try {
      await axios.put(`https://nft-broker-mroz.onrender.com/api/update-transaction/${transactionReference}`, { status });
      toast.success(`Transaction marked as ${status}!`);
      setIsLoading(false);
      setNftWithdrawals(nftWithdrawals.filter(tx => tx._id !== txId)); // Remove from UI after update
    } catch (error) {
      toast.error("Failed to update transaction: " + (error.response?.data?.message || error.message));
      setIsLoading(false);
    }
  };

  const containerStyle = {
    // position: 'absolute',
    minHeight: '100vh',
    maxHeight: '700px',
    background: "linear-gradient(90deg, rgba(200, 220, 240, 0.9) 0%, rgba(220, 230, 250, 0.85) 100%)",
    overflow: 'scroll',
    color: '#000',
    padding: '30px',
    // borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    // marginTop: '20px',
  };


  return (
    <div style={containerStyle}>
      <ToastContainer />
      <h1 className="text-white">Crypto Withdrawal Requests</h1>
      <span className='text-warning mb-1'><FontAwesomeIcon className='mx-2' icon={faInfoCircle} />This where all your clients' withdrawal requests are. You can approve or deny it and will show transaction successful or failed on their side depending on whether you approve it or not!</span>
      <div className="custom-task-list d-block">
        {nftWithdrawals.length === 0 ? (
          <p className="text-warning">No pending deposits found.</p>
        ) : (
          nftWithdrawals.map((tx) => (
            <div key={tx.transactionReference} className="custom-task-card text-dark">
              <p><span className="fw-bold">Transaction ID:</span> {tx.transactionReference}</p>
              <p><span className="fw-bold">Amount:</span> {tx.amount}</p>
              <p><span className="fw-bold">Status:</span> {tx.status}</p>
              <p><span className="fw-bold">User ID:</span> {tx.userID}</p>
              <p><span className="fw-bold">Time of Payment:</span> {new Date(tx.timestamp).toLocaleString()}</p>
              <p><span className="fw-bold">Payment Description:</span> {tx.description}</p>
              {tx.walletAddress && <p><span className="fw-bold">Wallet Address:</span> {tx.walletAddress}</p>}

              {isLoading ? (
                <Spinner animation="border" size="sm" variant='primary' />
              ) : (

                <div className="d-flex justify-content-between align-items-center">
                  <button className="btn btn-success" onClick={() => changePaymentStatus(tx.transactionReference, "success", tx._id)}>
                    Mark as Approved
                  </button>
                  <button className="btn btn-danger" onClick={() => changePaymentStatus(tx.transactionReference, "failed", tx._id)}>
                    Mark as Declined
                  </button>
                </div>
              )}

            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NftWithdrawList;
