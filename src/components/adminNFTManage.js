import React, { useState, useEffect } from 'react';
import { useUserContext } from './UserRoleContext';
import { Container, Row, Col, Card, Badge, Form, Button, Spinner, Modal } from "react-bootstrap";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle, faEllipsisV, faTrash, faEdit } from '@fortawesome/free-solid-svg-icons';
import Select from 'react-select';
import { ToastContainer, toast } from "react-toastify";
import EditNftModal from './EditNftModal';
import axios from "axios";

const NftManagement = () => { // Rename the function to start with an uppercase letter
  const { userData, currentUser } = useUserContext();
  const agentID = userData.agentID;
  const [tasks, setTasks] = useState([]);
  const [btcTx, setBtcTx] = useState([]);
  const [ethToUsdRate, setEthToUsdRate] = useState(null);
  const userId = userData.userID;
  const [nfts, setNfts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [editingNft, setEditingNft] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [clients, setClients] = useState([]);


  // Fetch users from backend
  useEffect(() => {
    const fetchClients = async (agentID) => {
      try {
        // Include the agentID as a query parameter in the API request
        const response = await axios.get(`https://nft-broker-e3q7.onrender.com/api/users?agentID=${agentID}`);
        setClients(response.data); // Assuming response.data is an array of users
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchClients(agentID);
  }, []);

  const [editForm, setEditForm] = useState({
    creatorName: "",
    collectionName: "",
    category: "",
    bidPrice: "",
    comment: "",
  });

  useEffect(() => {
    if (editingNft) {
      setEditForm({
        creatorName: editingNft.creatorName,
        collectionName: editingNft.collectionName,
        category: editingNft.category,
        bidPrice: editingNft.bidPrice,
        comment: editingNft.comment,
      });
    }
  }, [editingNft]);

  const [formData, setFormData] = useState({
    creatorName: "",
    collectionName: "",
    file: null,
    category: "",
    bidPrice: "",
    targets: [], // Change to array
    comment: "",
  });


  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState(null);
  const [showDropdown, setShowDropdown] = useState(null);

  const handleDelete = async (nftId) => {
    try {
      await axios.delete(`https://nft-broker-e3q7.onrender.com/api/delete-nfts/${nftId}`);
      setNfts(nfts.filter(nft => nft._id !== nftId)); // Remove from UI after update
    } catch (error) {
      console.error("Error deleting artwork:", error);
    }
  };


  const fetchUserNFTs = async () => {
    try {
      const response = await fetch(
        `https://nft-broker-e3q7.onrender.com/api/fetch-nft-user/${userId}`
      );
      const data = await response.json();
      if (response.ok) {
        setNfts(data);
      } else {
        toast.error("Error fetching artwork: " + data.message);
      }
    } catch (error) {
      console.log("Fetch error: " + error.message);
    }
  };

  useEffect(() => {
    fetchUserNFTs();
  }, [userId]);




  const handleUpdateNft = async () => {
    setIsEditLoading(true);
    try {
      const response = await fetch(`https://nft-broker-e3q7.onrender.com/api/edit-nft/${editingNft.creatorName}/${editingNft.collectionName}/${editingNft.agentID}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      });

      const result = await response.json();

      if (response.ok) {
        setShowEditModal(false);
        toast.success("artwork edited successfully: ");
        setIsEditLoading(false);
        fetchUserNFTs(); // Refresh list
      } else {
        console.error("Update failed:", result.message);
        setIsEditLoading(false);
        toast.error("artwork edit failed: " + result.message);
      }
    } catch (error) {
      console.error("Error updating artwork:", error.message);
      setIsEditLoading(false);
    }
  };


  // Handle Input Change
  // Map clients to react-select format
  const clientOptions = clients.map(client => ({
    value: client.userId,
    label: client.name,
  }));

  useEffect(() => {
    const fetchEthPrice = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        const data = await response.json();
        setEthToUsdRate(data.ethereum.usd);
      } catch (error) {
        console.error("Failed to fetch ETH price", error);
      }
    };

    fetchEthPrice();
  }, []);

  const usdPrice = formData.bidPrice && ethToUsdRate
    ? (formData.bidPrice * ethToUsdRate).toFixed(2)
    : null;

  // Handle normal form inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle multi-select
  const handleTargetChange = (selectedOptions) => {
    setFormData((prev) => ({
      ...prev,
      targets: selectedOptions.map(option => option.value),
    }));
  };


  // Handle File Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    setFormData((prev) => ({ ...prev, file }));

    if (file) {
      setUploading(true);
      const storageRef = ref(storage, `nfts/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // Optional: Track upload progress
        },
        (error) => {
          console.error("Upload error:", error);
          setUploading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setFileUrl(downloadURL);
          setUploading(false);
        }
      );
    }
  };

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fileUrl) {
      alert("Please wait for file to finish uploading.");
      return;
    }

    setIsLoading(true);

    const submissionData = {
      userId: userData.userID,
      ...formData,
      fileUrl, // Store uploaded file URL
      agentID: userData.agentID ? userData.agentID : 'none',
      fromAgent: true,
      status: "pending", // Default status when submitting
    };

    try {
      const response = await fetch("https://nft-broker-e3q7.onrender.com/api/submit-nfts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("artwork submitted successfully!");
        console.log("artwork Submission Response:", data);
        setIsLoading(false);
      } else {
        // Handle specific backend errors
        if (data.message === "Insufficient balance.") {
          toast.error("Insufficient balance for gas fees.");
        } else if (data.message === "User not found.") {
          toast.error("User not found. Please log in again.");
        } else {
          toast.error(data.message || "Failed to submit artwork.");
        }
        console.error("Error:", data);
        setIsLoading(false);
      }

    } catch (error) {
      toast.error("An error occurred while submitting artwork.");
      console.error("Submission Error:", error);
      setIsLoading(false);
    }
  };



  const containerStyle = {
    // position: 'absolute',
    minHeight: '100vh',
    // maxHeight: '900px', 
    background: "linear-gradient(90deg, rgba(200, 220, 240, 0.9) 0%, rgba(220, 230, 250, 0.85) 100%)",
    overflow: 'scroll',
    color: '#000',
    padding: '30px',
    // borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    // marginTop: '20px',
  };


  return (
    <>
      <EditNftModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        editForm={editForm}
        setEditForm={setEditForm}
        handleUpdateNft={handleUpdateNft}
        isEditLoading={isEditLoading}
      />
      <div className="container-large">
        <div className='container'>
          <div
            className="main-container p-4"
            style={{
              ...containerStyle,
              maxWidth: "900px",
              background: "#d6dee8", // Light grayish-blue
              borderRadius: "15px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              color: "#334155", // Dark blue-gray text
            }}
          >
            <h5 className="fw-bold">SUBMIT ARTWORK FOR CLIENT TO BUY</h5>
            <div className="mt-3 text-secondary">ARTWORK INFORMATION</div>
            <span className='text-warning mb-1'><FontAwesomeIcon className='mx-2' icon={faInfoCircle} />This page is different from your clients' page. Whatever you upload here will be shown as an artwork for your clients to buy on their "Buy Artworks" page. The details in this form will be used in uploading the Artwork and will be seen by the clients!</span>


            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Creator's Name</Form.Label>
                <Form.Control
                  type="text"
                  name="creatorName"
                  value={formData.creatorName}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  required
                  style={{ background: "#c9d3dd", color: "#2c3e50", border: "1px solid #b0b7c3" }}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Collection Name</Form.Label>
                <Form.Control
                  type="text"
                  name="collectionName"
                  value={formData.collectionName}
                  onChange={handleChange}
                  placeholder="Enter collection name"
                  required
                  style={{ background: "#c9d3dd", color: "#2c3e50", border: "1px solid #b0b7c3" }}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Upload Artwork File</Form.Label>
                <Form.Control type="file" onChange={handleFileUpload} required style={{ background: "#dfe3e8", color: "#334155" }} />
                {uploading && <Spinner animation="border" size="sm" className="ms-2 text-dark" />}
                {fileUrl && <p className="text-success mt-2">✅ File Uploaded Successfully!</p>}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>The Category Your Artwork Belongs In</Form.Label>
                <Form.Select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  style={{ background: "#c9d3dd", color: "#2c3e50", border: "1px solid #b0b7c3" }}
                >
                  <option value="">Select Category</option>
                  <option value="art">Art</option>
                  <option value="music">Music</option>
                  <option value="domain names">Domain Names</option>
                  <option value="sports">Sports</option>
                  <option value="collectible">Collectible</option>
                  <option value="photography">Photography</option>
                </Form.Select>
              </Form.Group>


              <span className='text-warning mb-1'><FontAwesomeIcon className='mx-2' icon={faInfoCircle} />This is the price of the Artwork in ETH that the clients will see (This is how much they will pay for it)!</span>
              <Form.Group className="mb-3">
                <Form.Label>Bid Price (ETH)</Form.Label>
                <Form.Control
                  type="number"
                  name="bidPrice"
                  value={formData.bidPrice}
                  onChange={handleChange}
                  placeholder="Enter price in ETH"
                  required
                  style={{ background: "#c9d3dd", color: "#2c3e50", border: "1px solid #b0b7c3" }}
                />
                {usdPrice && (
                  <Form.Text className="text-muted">
                    ≈ ${usdPrice} USD
                  </Form.Text>
                )}
              </Form.Group>

              <span className='text-warning mb-1'>
                <FontAwesomeIcon className='mx-2' icon={faInfoCircle} />
                Select which clients you want to see this Artwork!
              </span>
              <Form.Group className="mb-3">
                <Form.Label>Target Users</Form.Label>
                <Select
                  isMulti
                  name="targets"
                  options={clientOptions}
                  onChange={handleTargetChange}
                  classNamePrefix="select"
                  placeholder="All Clients"
                  menuPortalTarget={document.body} // 👈 This portals the menu to the body
                  styles={{
                    control: (base) => ({
                      ...base,
                      background: "#c9d3dd",
                      borderColor: "#b0b7c3",
                      color: "#2c3e50",
                    }),
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }), // 👈 Ensure it sits above all
                    multiValue: (base) => ({
                      ...base,
                      backgroundColor: "#b0b7c3",
                      color: "#fff",
                    }),
                  }}
                />

              </Form.Group>


              <Form.Group className="mb-4">
                <Form.Label>Describe Your Artwork</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  name="comment"
                  value={formData.comment}
                  onChange={handleChange}
                  placeholder="Describe your Artwork..."
                  style={{ background: "#c9d3dd", color: "#2c3e50", border: "1px solid #b0b7c3" }}
                />
              </Form.Group>

              <Button
                disabled={isLoading} // ✅ Correct way to disable button when loading
                type="submit"
                style={{
                  width: "50%", // Adjust width to make it shorter
                  fontWeight: "bold",
                  padding: "10px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #1f2937, #111827)", // dark gradient
                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.5)", // dark shadow
                  cursor: isLoading ? "not-allowed" : "pointer", // optional UX
                  opacity: isLoading ? 0.7 : 1, // optional loading effect
                  color: "#fff",
                  display: "block", // Ensure centering works
                  margin: "0 auto", // Center horizontally
                  textAlign: "center", // Align text properly
                }}
              >
                {isLoading ? (
                  <Spinner animation="border" size="sm" className="text-white" />
                ) :
                  (
                    <span>
                      Submit Artwork
                    </span>
                  )}
              </Button>

            </Form>
          </div>
        </div>

        {/* artwork list */}
        <Container className="mt-4 text-dark">
          <ToastContainer />

          <div className="main-container">
            <h5 className='text-dark'>Published Artworks</h5>
            {nfts.length === 0 ? (
              <div className="text-center text-secondary fw-bold">
                You currently don't have any projects.
              </div>
            ) : (
              <Row className="justify-content-center">
                <span className="text-warning mb-1">
                  <FontAwesomeIcon className="mx-2" icon={faInfoCircle} />
                  These are your current uploaded Artworks. These are the artworks your clients will see available to purchase/buy!
                </span>
                {nfts.map((nft, index) => (
                  <Col key={nft._id} md={4} className="mb-4 position-relative">
                    <Card className="shadow-lg nft-slide" style={{ width: "100%" }}>
                      {/* Artwork Image */}
                      <Card.Img variant="top" src={nft.fileUrl} alt={nft.collectionName} style={{ height: "250px", objectFit: "cover" }} />

                      {/* Options Menu (3 Dots) */}
                      <div
                        className="position-absolute dropdown-toggle-btn"
                        style={{ top: "10px", right: "10px", cursor: "pointer", zIndex: 10 }}
                        onClick={() => setShowDropdown(showDropdown === nft._id ? null : nft._id)}
                        onMouseDown={e => e.preventDefault()}   // ← add this
                      >
                        <FontAwesomeIcon icon={faEllipsisV} size="lg" />
                      </div>

                      {/* Dropdown Menu */}
                      {showDropdown === nft._id && (
                        <div
                          className="position-absolute bg-white shadow-lg p-2 rounded"
                          style={{ top: "45px", right: "7px", zIndex: 20 }}
                        >
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

                          <div
                            className="d-flex align-items-center text-primary p-2"
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                              setEditingNft(nft);
                              setShowEditModal(true);
                              setShowDropdown(null); // close dropdown
                            }}
                          >
                            <FontAwesomeIcon icon={faEdit} className="me-2" />
                            Edit Artwork
                          </div>
                        </div>
                      )}


                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-center">
                          <h5 className="fw-bold">{nft.collectionName}</h5>
                          <Badge bg={nft.status === "successful" ? "success" : nft.status === "failed" ? "danger" : "warning"} className="p-2">
                            New Bid 🔥
                          </Badge>
                        </div>
                        <p className="text-muted">Created by: {nft.creatorName}</p>
                        <div className="d-flex justify-content-between">
                          <span className="fw-bold text-primary">{nft.bidPrice} ETH</span>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </div>
        </Container>

      </div>
    </>
  );
};

export default NftManagement;
