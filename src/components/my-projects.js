import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Badge, Button, Spinner } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import { useUserContext } from './UserRoleContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle, faEllipsisV, faTrash, faEdit } from '@fortawesome/free-solid-svg-icons';
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

const MyProjects = () => {
  const { userData } = useUserContext();
  const userId = userData?.userID;
  const agentID = userData?.role === "agent" ? userData?.agentID : null;
  const [isLoading, setIsLoading] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({ nftId: '', bidPrice: '', totalBids: '' });


  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(null);

  const generateAnonName = (nftId, index) => {
    const adjectives = [
      'Swift', 'Silent', 'Lucky', 'Brave', 'Mighty', 'Sly', 'Jolly', 'Witty', 'Cool', 'Zany',
      'Charming', 'Fearless', 'Fierce', 'Cheeky', 'Daring', 'Sneaky', 'Wild', 'Grumpy', 'Snappy', 'Peppy',
      'Curious', 'Vivid', 'Nimble', 'Groovy', 'Savage', 'Funky', 'Nifty', 'Zesty', 'Quirky', 'Rowdy'
    ];

    const animals = [
      'Fox', 'Tiger', 'Eagle', 'Panda', 'Wolf', 'Otter', 'Bear', 'Lynx', 'Hawk', 'Shark',
      'Koala', 'Leopard', 'Raven', 'Moose', 'Falcon', 'Coyote', 'Jaguar', 'Orca', 'Zebra', 'Gorilla',
      'Sloth', 'Panther', 'Ram', 'Ibex', 'Camel', 'Penguin', 'Hyena', 'Badger', 'Gazelle', 'Toucan'
    ];

    const seed = nftId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + index;

    const adj = adjectives[seed % adjectives.length];
    const animal = animals[(seed + 7) % animals.length];
    const number = (seed * 41) % 1000;

    return `${adj}${animal}${number}`;
  };


  const fetchNFTs = async () => {
    setLoading(true);
    try {
      const endpoint = userData?.role === "agent"
        ? `https://nft-broker-mroz.onrender.com/api/pending-nfts-onsale/${agentID}`
        : `https://nft-broker-mroz.onrender.com/api/fetch-nft-user/${userId}`;

      const response = await axios.get(endpoint);
      setNfts(response.data?.nfts || response.data); // support both data shapes
    } catch (error) {
      // toast.error("Error fetching NFTs.", { className: "custom-toast" });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchNFTs();
  }, [userId]);

  const handleDelete = async (nftId) => {
    try {
      await axios.delete(`https://nft-broker-mroz.onrender.com/api/delete-nfts/${nftId}`);
      toast.success("Artwork deleted successfully.");
      fetchNFTs();
    } catch (error) {
      console.error("Error deleting artwork:", error);
      toast.error("Failed to delete artwork.");
    }
  };

  const handlePublish = async (nftId) => {
    setIsLoading(true);
    try {
      await axios.put(`https://nft-broker-mroz.onrender.com/api/publish-nft/${nftId}`, {
        status: 'on sale'
      });
      toast.success("Artwork published successfully!", { className: "custom-toast" });
      setIsLoading(false);
      fetchNFTs();
    } catch (error) {
      toast.error("Error publishing artwork.", { className: "custom-toast" });
      setIsLoading(false);
      console.error(error);
    }
  };

  const handleAgentPurchase = async (nftId, collectionName, creatorName, bidPrice) => {
    setIsLoading(true);
    try {
      await axios.post('https://nft-broker-mroz.onrender.com/api/agent-nft-purchase', {
        nftId,
        collectionName,
        creatorName,
        bidPrice,
        agentID: userData.agentID
      });
      toast.success("Artwork purchased and user return updated!");
      setIsLoading(false);
      fetchNFTs();
    } catch (error) {
      toast.error("Purchase failed.", { className: "custom-toast" });
      setIsLoading(false);
      console.error("Error purchasing artwork:", error);
    }
  };

  const renderStatusBadge = (status) => {
    const statusMap = {
      approved: "success",
      denied: "danger",
      sold: "secondary",
      "on sale": "warning",
      default: "warning"
    };
    return statusMap[status] || statusMap.default;
  };

  const renderNFTCard = (nft) => (
    <Col key={nft._id} md={4} className="mb-4">
      <Card className="shadow-lg nft-slide" style={{ width: "100%" }}>
        <Card.Img
          variant="top"
          src={nft.fileUrl}
          alt={nft.collectionName}
          style={{ height: "250px", objectFit: "cover" }}
        />

        {/* 3-dot menu */}
        <div
          className="position-absolute dropdown-toggle-btn"
          style={{ top: "10px", right: "10px", cursor: "pointer", zIndex: 10 }}
          onClick={() => setShowDropdown(showDropdown === nft._id ? null : nft._id)}
          onMouseDown={e => e.preventDefault()}   // ← add this
        >
          <FontAwesomeIcon icon={faEllipsisV} size="lg" />
        </div>

        {showDropdown === nft._id && (
          <div className="position-absolute bg-white shadow-lg p-2 rounded" style={{ top: "45px", right: "7px", zIndex: 20 }}>
            {userData?.role === "agent" && (
              <div
                className="d-flex align-items-center text-primary p-2"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setEditData({ nftId: nft._id, bidPrice: nft.bidPrice, totalBids: nft.totalBids });
                  setShowEditModal(true);
                }}
              >
                <FontAwesomeIcon icon={faEdit} className="me-2" />
                Edit
              </div>
            )}
            <div
              className="d-flex align-items-center text-danger p-2"
              style={{ cursor: "pointer" }}
              onClick={() => {
                const confirmed = window.confirm("Are you sure you want to delete this artwork?");
                if (confirmed) {
                  handleDelete(nft._id);
                }
              }}
            >
              <FontAwesomeIcon icon={faTrash} className="me-2" />
              Delete Artwork
            </div>

          </div>
        )}


        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="fw-bold">{nft.collectionName}</h5>
            <Badge bg={renderStatusBadge(nft.status)} style={{ fontSize: '15px' }} className={userData?.role === 'agent' ? 'p-2' : ''}>
              {nft.status}
            </Badge>
          </div>
          <p className="text-muted">Created by: {nft.creatorName}</p>

          <div className="d-flex justify-content-between align-items-center">
            <span className="fw-bold text-primary">{nft.bidPrice} ETH</span>
            {nft.totalBids > 0 && (
              <div className="d-flex align-items-center">
                <div className="avatar-group me-2 d-flex" style={{ position: 'relative' }}>
                  {[...Array(Math.min(nft.totalBids, 3))].map((_, idx) => {
                    const anonName = generateAnonName(nft._id, idx);
                    return (
                      <div
                        key={idx}
                        className="rounded-circle"
                        style={{
                          width: 32,
                          height: 32,
                          background: 'linear-gradient(90deg, #ff7eb3, #00d4ff)',
                          overflow: 'hidden',
                          marginLeft: idx === 0 ? 0 : -10,
                          border: '2px solid white',
                          zIndex: 10 - idx,
                          position: 'relative',
                        }}
                      >
                        <img
                          src={`https://ui-avatars.com/api/?name=${anonName}&background=transparent&color=fff&size=32&rounded=true`}
                          alt={`Bidder ${idx + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    );
                  })}
                  {nft.totalBids > 3 && (
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center text-white"
                      style={{
                        width: 32,
                        height: 32,
                        background: 'linear-gradient(90deg, #ff7eb3, #00d4ff)',
                        marginLeft: -10,
                        border: '2px solid white',
                        fontSize: 12,
                        zIndex: 0,
                      }}
                    >
                      +{nft.totalBids - 3}
                    </div>
                  )}
                </div>
                <small className="text-muted">
                  <strong>{nft.totalBids}</strong> Bid{nft.totalBids > 1 ? 's' : ''}
                </small>
              </div>
            )}
          </div>

          {(userData?.role === 'agent' && nft.status === 'on sale') ||
            (userData?.role !== 'agent' && nft.status === 'approved') ? (
            <div className="mt-3 text-end">
              {userData?.role === 'agent' ? (
                <Button
                  variant="dark"
                  size="sm"
                  onClick={() => handleAgentPurchase(nft._id, nft.collectionName, nft.creatorName, nft.bidPrice)}
                  disabled={nft.status !== 'on sale' || isLoading}
                >
                  {isLoading ? <Spinner animation="border" size="sm" className="text-white" /> : <span>Buy</span>}
                </Button>
              ) : (
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => handlePublish(nft._id)}
                  disabled={!userData.isUserActive || isLoading}
                >
                  {isLoading ? <Spinner animation="border" size="sm" className="text-white" /> : <span>Publish</span>}
                </Button>
              )}
            </div>
          ) : null}

        </Card.Body>

      </Card>
    </Col>
  );

  return (
    <div className="container-large">
      <Container className="mt-4">
        <ToastContainer />
        <div className="main-container">
          {loading ? (
            <div className="text-center my-5">
              <Spinner animation="border" variant="primary" />
              {userData?.role === 'agent' ? (
                <p className="mt-2 text-secondary">Loading your clients' projects...</p>
              ) : (
                <p className="mt-2 text-secondary">Loading your projects...</p>
              )}
            </div>
          ) : nfts.length === 0 ? (
            <div className="text-center text-secondary fw-bold">

              {userData?.role === 'agent' ? (
                <p className="mt-2 text-secondary">Your clients don't currently have any published projects.</p>
              ) : (
                <p className="mt-2 text-secondary">You currently don't have any projects.</p>
              )}
            </div>
          ) : (
            <Row className="justify-content-center">
              {userData?.role === 'agent' ? (
                <span className="text-warning mb-3">
                  <FontAwesomeIcon className="mx-2" icon={faInfoCircle} />
                  You can buy a client's artwork to credit their account with the value of the project.
                </span>
              ) : !userData?.isUserActive ? (
                <span className="text-warning mb-3">
                  <FontAwesomeIcon className="mx-2" icon={faInfoCircle} />
                  You need a publisher's license (i.e be verified) to publish projects.
                </span>
              ) : null}

              {nfts.map(renderNFTCard)}
            </Row>
          )}
        </div>
      </Container>

      {/* edit modal */}
      {showEditModal && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            paddingTop: '70px', // adjust based on your navbar height
            zIndex: 1055, // make sure it's above the header
          }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Artwork</h5>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
              </div>
              <div className="modal-body">
                <label className="form-label">Bid Price (ETH)</label>
                <input
                  type="number"
                  className="form-control mb-3"
                  value={editData.bidPrice}
                  onChange={(e) => setEditData({ ...editData, bidPrice: e.target.value })}
                />
                <label className="form-label">Total Bids</label>
                <input
                  type="number"
                  className="form-control"
                  value={editData.totalBids}
                  onChange={(e) => setEditData({ ...editData, totalBids: e.target.value })}
                />
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button
                  className="btn btn-primary"
                  onClick={async () => {
                    setIsEditLoading(true);
                    try {
                      await axios.put(`https://nft-broker-mroz.onrender.com/api/update-nft/${editData.nftId}`, {
                        bidPrice: Number(editData.bidPrice),
                        totalBids: Number(editData.totalBids)
                      });
                      toast.success("Artwork updated successfully!");
                      setShowEditModal(false);
                      setIsEditLoading(false);
                      fetchNFTs();
                    } catch (error) {
                      console.error(error);
                      toast.error("Update failed.");
                      setIsEditLoading(false);
                      console.error(editData.bidPrice, editData.totalBids);
                    }
                  }}
                  disabled={isEditLoading}
                >
                  {isEditLoading ? <Spinner animation="border" size="sm" className="text-white" /> : <span>Save Changes</span>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );

};

export default MyProjects;
