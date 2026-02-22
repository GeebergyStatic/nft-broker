import React, { useState, useContext, useEffect } from 'react';
import { useUserContext } from './UserRoleContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faCopy, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { ToastContainer, toast } from "react-toastify";
import { Form, Button, Alert, Spinner } from "react-bootstrap";
import "react-toastify/dist/ReactToastify.css";
import { v4 as uuidv4 } from "uuid";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";
import axios from 'axios';
import PaymentBox from './PaymentBox';
import Loading from './Loading';


const PaymentModal = () => {
  const { userData } = useUserContext();
  const userEmail = userData.email;
  const userID = userData.userID;
  const username = userData.fullName;
  const [ethToUsdRate, setEthToUsdRate] = useState(null);
  const agentCode = userData.agentCode;
  const [walletAddresses, setWalletAddresses] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  // 
  const [formData, setFormData] = useState({
    file: null,
    amount: "",
  });

  const copyToClipboard = () => {
    navigator.clipboard.writeText(selectedWallet.address);
    toast.info("Address copied to clipboard!", {
      position: "top-right",
      className: "custom-toast",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true
    });
  };

  useEffect(() => {
    const fetchEthPrice = async () => {
      try {
        const res = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
        );
        const data = await res.json();
        setEthToUsdRate(data.ethereum.usd);
      } catch (error) {
        console.error('Failed to fetch ETH price:', error);
      }
    };

    fetchEthPrice();
  }, []);


  const usdAmount = formData.amount && ethToUsdRate
    ? (formData.amount * ethToUsdRate).toFixed(2)
    : null;

  // Handle Input Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    setFormData((prev) => ({ ...prev, file }));

    if (file) {
      setUploading(true);
      const storageRef = ref(storage, `nft-deposit-files/${file.name}`);
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

  useEffect(() => {
    fetch(`https://nft-broker-mroz.onrender.com/api/fetchWallets`)
      .then(response => response.json())
      .then(data => {
        if (Array.isArray(data)) {
          setWalletAddresses(data);
        } else {
          setWalletAddresses([]); // Fallback if response is not an array
        }
      })
      .catch(err => {
        console.error('Failed to fetch wallet addresses:', err);
        setWalletAddresses([]);
      });
  }, []); // Add agentCode as a dependency to re-fetch if it changes






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
      agentID: agentCode,
      status: "pending", // Default status when submitting
    };

    try {
      const response = await fetch("https://nft-broker-mroz.onrender.com/api/nft-deposit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("ETH deposit submitted successfully!", {
          className: "custom-toast",
        });
        console.log("ETH deposit Submission Response:", data);
        setIsLoading(false);
      } else {
        toast.error(data.message || "Failed to submit ETH deposit.", {
          className: "custom-toast",
        });
        console.error("Error:", data);
        setIsLoading(false);
      }
    } catch (error) {
      toast.error("An error occurred while submitting ETH deposit.", {
        className: "custom-toast",
      });
      console.error("Submission Error:", error);
      setIsLoading(false);
    }
  };

  const labelStyle = {
    display: 'block',
    fontWeight: 600,
    marginBottom: '0.5rem',
    color: '#1e293b',
  };


  return (
    <div className='container-large'>
      <div className='container'>
        <div
          className="main-container p-4"
          style={{
            maxWidth: "900px",
            background: "#d6dee8",
            borderRadius: "15px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            color: "#2c3e50",
            textAlign: "center",
          }}
        >
          {/* ⚠️ Warning Section */}
          <Alert variant="warning" className="fw-bold">
            ⚠️ Please note: The only accepted digital currency is Ethereum (ETH).
            DeepSea won't be liable for any loss of funds.
          </Alert>

          <h2 className="fw-bold">Deposit and Submit Proof</h2>
          <p className="mb-4">Top up your balance securely by submitting proof of payment.</p>

          <Form className="text-start" onSubmit={handleSubmit}>
            {/* Select Crypto Wallet */}
            <Form.Group className="mb-3">
              <Form.Select
                name="cryptoWallet"
                value={selectedWallet ? selectedWallet._id : ""}
                onChange={(e) => {
                  const wallet = walletAddresses.find((w) => w._id === e.target.value);
                  setSelectedWallet(wallet);
                }}
                style={{ background: "#dfe3e8", color: "#334155" }}
              >
                <option value="">Select a wallet</option>
                {walletAddresses.map((wallet) => (
                  <option key={wallet._id} value={wallet._id}>
                    {wallet.type}
                  </option>
                ))}
              </Form.Select>

            </Form.Group>

            <>
              {selectedWallet && (
                <div className="wallet-info p-3 text-center rounded border-gradient">
                  <img src={selectedWallet.url} alt="QR Code" className="qr-code img-fluid" />
                  <div className="d-flex align-items-center justify-content-between mt-3">
                    <span className="wallet-address">
                      {selectedWallet.address.slice(0, 6)}...{selectedWallet.address.slice(-4)}
                    </span>
                    <button type="button" className="btn btn-sm copy-btn" onClick={copyToClipboard}>
                      <FontAwesomeIcon icon={faCopy} /> Copy
                    </button>
                  </div>
                </div>
              )}

              {/* Toast Notification Container */}
              <ToastContainer />
            </>



            <Form.Group className="mb-3">
              <Form.Label>Amount (ETH)</Form.Label>
              <Form.Control
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="Enter amount in ETH"
                required
                style={{
                  background: "#dfe3e8",
                  color: "#334155",
                  border: "1px solid #b0b7c3",
                }}
              />
              {usdAmount && (
                <Form.Text className="text-muted">
                  ≈ ${usdAmount} USD
                </Form.Text>
              )}
            </Form.Group>




            {/* Upload Payment Proof */}
            <Form.Group className="mb-3">
              <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                Upload Proof
                <span title="Only screenshot formats (JPG, PNG) are accepted">
                  <FontAwesomeIcon icon={faCircleInfo} style={{ color: '#2563eb', cursor: 'help' }} />
                </span>
              </label>
              <p style={{ marginTop: '0.2rem', marginBottom: '0.8rem', fontSize: '0.85rem', color: '#64748b' }}>
                Please upload a screenshot of your transaction (JPG or PNG).
              </p>
              <Form.Control type="file" onChange={handleFileUpload} required style={{ background: "#dfe3e8", color: "#334155" }} />
              {uploading && <Spinner animation="border" size="sm" className="ms-2 text-dark" />}
              {fileUrl && <p className="text-success mt-2">✅ File Uploaded Successfully!</p>}
            </Form.Group>
            {/* background: "#c9d3dd",
              color: "#2c3e50",
              border: "1px solid #a4b0be", */}

            {/* Submit Button */}
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
                    Submit Proof
                  </span>
                )}
            </Button>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
