import React, { useState, useEffect } from 'react';
import { useUserContext } from './UserRoleContext';
import { ToastContainer, toast } from "react-toastify";
import { Spinner } from "react-bootstrap";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle, faEllipsisV, faTrash } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

const NftSubmittedList = () => { // Rename the function to start with an uppercase letter
  const { userData } = useUserContext();
  const agentID = userData.agentID;
  const [nfts, setNfts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchPendingNFTs();
  }, []);

  const fetchPendingNFTs = async () => {
    try {
      const response = await axios.get(`https://nft-broker-mroz.onrender.com/api/pending-nfts/${agentID}`);
      setNfts(response.data.nfts);
    } catch (error) {
      console.error("Error fetching artworks:", error);
      console.log(error.response?.data?.message || "Failed to load artworks.");
    }
  };

  const updateNFTStatus = async (nftId, status) => {
    setIsLoading(true);
    try {
      await axios.patch(`https://nft-broker-mroz.onrender.com/api/update-nft-status/${nftId}`, { status });

      toast.success(`artwork marked as ${status}!`);
      setIsLoading(false);
      setNfts(nfts.filter(nft => nft._id !== nftId)); // Remove from UI after update
    } catch (error) {
      console.error("Error updating artwork status:", error);
      setIsLoading(false);
      toast.error("Failed to update status.");
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

      <h1 className="text-white">Pending Artwork Submissions</h1>
      <span className='text-warning mb-1'><FontAwesomeIcon className='mx-2' icon={faInfoCircle} />This is where all your clients' submitted artworks are. All of them here are showing pending on their end. You can approve it or deny it and it would reflect on their side!</span>

      <div className="custom-task-list">
        {nfts.length === 0 ? <p>No pending artworks found.</p> : (
          nfts.map(nft => (
            <div key={nft._id} className="custom-task-card text-dark">
              <p><strong>Transaction ID:</strong> {nft._id}</p>
              <p><strong>Creator Name:</strong> {nft.creatorName}</p>
              <p><strong>Collection:</strong> {nft.collectionName}</p>
              <p><strong>Category:</strong> {nft.category}</p>
              <p><strong>Bid Price:</strong> {nft.bidPrice} ETH</p>
              <p><strong>Comment:</strong> {nft.comment || "No comments"}</p>
              <p><strong>Submission Time:</strong> {new Date(nft.createdAt).toLocaleString()}</p>

              {nft.fileUrl && <img src={nft.fileUrl} alt="Artwork Preview" style={{ width: "150px", borderRadius: "5px" }} />}

              {isLoading ? (
                <Spinner animation="border" size="sm" variant='primary' />
              ) : (
                <div className="d-flex justify-content-between mt-3">
                  <button className="btn btn-success" onClick={() => updateNFTStatus(nft._id, "approved")}>Approve</button>
                  <button className="btn btn-danger" onClick={() => updateNFTStatus(nft._id, "denied")}>Deny</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NftSubmittedList;
