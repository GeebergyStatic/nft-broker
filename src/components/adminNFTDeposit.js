import React, { useState, useEffect } from "react";
import { useUserContext } from "./UserRoleContext";
import { Spinner } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle, faEllipsisV, faTrash } from '@fortawesome/free-solid-svg-icons';
import axios from "axios";

const NftDepositList = () => {
  const { userData } = useUserContext();
  const agentID = userData.agentID;
  const [nftDeposits, setNftDeposits] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch pending NFT deposits
  const fetchPendingDeposits = async () => {
    try {
      const response = await axios.get(`https://nft-broker-e3q7.onrender.com/api/pending-deposits/${agentID}`);
      setNftDeposits(response.data);
    } catch (error) {
      console.log("Error fetching deposits: " + (error.response?.data?.message || error.message));
    }
  };

  useEffect(() => {
    fetchPendingDeposits();
  }, []);

  // Update transaction status
  const changePaymentStatus = async (transactionReference, status, txId) => {
    setIsLoading(true);
    try {
      await axios.put(`https://nft-broker-e3q7.onrender.com/api/update-transaction/${transactionReference}`, { status });
      toast.success(`Transaction marked as ${status}!`);
      setIsLoading(false);
      setNftDeposits(nftDeposits.filter(tx => tx._id !== txId)); // Remove from UI after update
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
    <div className="text-dark" style={containerStyle}>
      <ToastContainer />
      <h1 className="text-white">Crypto Deposit Requests</h1>
      <span className='text-warning mb-1'><FontAwesomeIcon className='mx-2' icon={faInfoCircle} />This is where all your clients' pending deposits are. You can approve it or deny it and it would show up as transaction successful or denied on their side depending on what you choose!</span>
      <div className="custom-task-list d-block">
        {nftDeposits.length === 0 ? (
          <p className="text-warning">No pending deposits found.</p>
        ) : (
          nftDeposits.map((tx) => (
            <div key={tx.transactionReference} className="custom-task-card text-dark">
              <p><span className="fw-bold">Transaction ID:</span> {tx.transactionReference}</p>
              <p><span className="fw-bold">Amount:</span> {tx.amount}</p>
              <p><span className="fw-bold">Status:</span> {tx.status}</p>
              <p><span className="fw-bold">User ID:</span> {tx.userID}</p>
              <p><span className="fw-bold">Time of Payment:</span> {new Date(tx.timestamp).toLocaleString()}</p>
              <p><span className="fw-bold">Payment Description:</span> {tx.description}</p>

              {tx.fileUrl && <img src={tx.fileUrl} alt="Collectible Preview" style={{ width: "150px", borderRadius: "5px" }} />}

              {/* Buttons to change payment status */}
              {isLoading ? (
                <Spinner animation="border" size="sm" variant="primary" />
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

export default NftDepositList;
