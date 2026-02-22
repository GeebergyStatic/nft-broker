import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Form, Button, Spinner } from "react-bootstrap";
import { useUserContext } from './UserRoleContext';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, getFirestore, collection, addDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from "uuid";
import { ToastContainer, toast } from "react-toastify";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import BtcWithdrawList from './adminNFTWithdraw';
import "react-toastify/dist/ReactToastify.css";
import myRedImage from '../red-loader.gif';
import Loading from './Loading';




const WalletBalance = (props) => {
  const { userData, currentUser } = useUserContext();
  const agentCode = userData.agentCode;
  const [ethToUsdRate, setEthToUsdRate] = useState(null);
  const userID = userData.userID;
  const username = userData.fullName;
  const userBalance = userData.balance;
  const userEmail = userData.email;
  const userDeposit = userData.deposit;
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const user = auth.currentUser;

  // 
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [formData, setFormData] = useState({
    accountName: "",
    email: "",
    bankName: "",
    swiftCode: "",
    bankAddress: "",
    ethAmount: "",
    additionalInfo: "",
    walletName: "",
    walletAddress: "",
  });

  useEffect(() => {
    const fetchEthPrice = async () => {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        const data = await res.json();
        setEthToUsdRate(data.ethereum.usd);
      } catch (error) {
        console.error('Failed to fetch ETH price:', error);
      }
    };

    fetchEthPrice();
  }, []);

  const withdrawalUsdPrice = formData.ethAmount && ethToUsdRate
    ? (formData.ethAmount * ethToUsdRate).toFixed(2)
    : null;


  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };



  const handleSubmit = async () => {

    setIsLoading(true);
    const submissionData = {
      userId: userData.userID,
      ...formData,
      agentID: agentCode,
      status: "pending", // Default status when submitting
    };

    try {
      const response = await fetch("https://nft-broker-e3q7.onrender.com/api/nft-withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("ETH withdrawal submitted successfully!", {
          className: "custom-toast",
        });
        console.log("ETH withdrawal Submission Response:", data);
        setIsLoading(false);
        setIsWithdrawModalOpen(false);
        window.location.reload(); // This refreshes the page
      } else {
        // Handle specific backend errors
        if (data.message === "Insufficient balance.") {
          toast.error("Insufficient balance. Please check your balance.", {
            className: "custom-toast",
          });
        } else if (data.message === "User not found.") {
          toast.error("User not found. Please log in again.", {
            className: "custom-toast",
          });
        } else {
          toast.error(data.message || "Failed to submit ETH withdrawal.", {
            className: "custom-toast",
          });
        }
        console.error("Error:", data);
        setIsLoading(false);
        setIsWithdrawModalOpen(false);
      }
    } catch (error) {
      toast.error("An error occurred while submitting ETH withdrawal.", {
        className: "custom-toast",
      });
      console.error("Submission Error:", error);
      setIsLoading(false);
      setIsWithdrawModalOpen(false);
    }
  };




  return (
    <div className='container-large'>
      <div className='container'>
        <div
          className="main-container p-4"
          style={{
            maxWidth: "900px",
            background: "#d6dee8", // Light blue-gray
            borderRadius: "15px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            color: "#2c3e50",
            // textAlign: "center",
          }}
        >
          {selectedMethod !== null && (
            <Button
              variant="secondary"
              onClick={() => setSelectedMethod(null)}
              style={{
                width: "120px",
                textAlign: "center",
              }}
            >
              ← Go Back
            </Button>
          )}
          <h2 className="fw-bold text-center mt-4">WITHDRAW FUNDS</h2>

          {/* Selection Buttons */}
          {!selectedMethod && (
            <div className="mt-4 d-flex flex-column flex-md-row justify-content-between align-items-stretch gap-3">
              <Button
                onClick={() => setSelectedMethod("bank")}
                className={`flex-fill fw-semibold py-3 ${selectedMethod === "bank" ? "active-transfer-btn" : ""
                  }`}
                style={{
                  background: selectedMethod === "bank"
                    ? "linear-gradient(135deg, #1e3a8a, #0f172a)" // highlight if active
                    : "linear-gradient(135deg, #1f2937, #111827)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  boxShadow: "0 6px 12px rgba(0, 0, 0, 0.5)",
                  transition: "all 0.2s ease",
                }}
              >
                🏦 Bank Transfer
              </Button>

              <Button
                onClick={() => setSelectedMethod("wallet")}
                className={`flex-fill fw-semibold py-3 ${selectedMethod === "wallet" ? "active-transfer-btn" : ""
                  }`}
                style={{
                  background: selectedMethod === "wallet"
                    ? "linear-gradient(135deg, #1e3a8a, #0f172a)" // highlight if active
                    : "linear-gradient(135deg, #1f2937, #111827)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  boxShadow: "0 6px 12px rgba(0, 0, 0, 0.5)",
                  transition: "all 0.2s ease",
                }}
              >
                💼 Wallet Transfer
              </Button>
            </div>

          )}

          {/* Bank Transfer Form */}
          {selectedMethod === "bank" && (
            <>
              <h4 className="mt-4 text-center">PLEASE PROVIDE YOUR BANK DETAILS</h4>
              <Form className="text-start mt-3" onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Account Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="accountName"
                    value={formData.accountName}
                    onChange={handleChange}
                    placeholder="Enter account name"
                    required
                    style={{ background: "#c9d3dd", color: "#2c3e50", border: "1px solid #a4b0be" }}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email"
                    required
                    style={{ background: "#c9d3dd", color: "#2c3e50", border: "1px solid #a4b0be" }}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Bank Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleChange}
                    placeholder="Enter bank name"
                    required
                    style={{ background: "#c9d3dd", color: "#2c3e50", border: "1px solid #a4b0be" }}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Swift Code</Form.Label>
                  <Form.Control
                    type="text"
                    name="swiftCode"
                    value={formData.swiftCode}
                    onChange={handleChange}
                    placeholder="Enter SWIFT code"
                    required
                    style={{ background: "#c9d3dd", color: "#2c3e50", border: "1px solid #a4b0be" }}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Bank Address</Form.Label>
                  <Form.Control
                    type="text"
                    name="bankAddress"
                    value={formData.bankAddress}
                    onChange={handleChange}
                    placeholder="Enter bank address"
                    required
                    style={{ background: "#c9d3dd", color: "#2c3e50", border: "1px solid #a4b0be" }}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>ETH Withdrawal Amount</Form.Label>
                  <Form.Control
                    type="number"
                    name="ethAmount"
                    value={formData.ethAmount}
                    onChange={handleChange}
                    placeholder="Enter amount in ETH"
                    required
                    style={{ background: "#c9d3dd", color: "#2c3e50", border: "1px solid #a4b0be" }}
                  />
                  {withdrawalUsdPrice && (
                    <Form.Text className="text-muted">
                      ≈ ${withdrawalUsdPrice} USD
                    </Form.Text>
                  )}
                </Form.Group>


                <Form.Group className="mb-4">
                  <Form.Label>Additional Info</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={handleChange}
                    placeholder="Enter any extra details..."
                    style={{ background: "#c9d3dd", color: "#2c3e50", border: "1px solid #a4b0be" }}
                  />
                </Form.Group>

                <Button
                  type="button"
                  onClick={() => setIsWithdrawModalOpen(true)} // Open modal
                  style={{
                    width: "50%", // Adjust width to make it shorter
                    fontWeight: "bold",
                    padding: "10px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #1f2937, #111827)", // dark gradient
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.5)", // dark shadow
                    color: "#fff",
                    display: "block", // Ensure centering works
                    margin: "0 auto", // Center horizontally
                    textAlign: "center", // Align text properly
                  }}
                >
                  Withdraw
                </Button>

              </Form>
            </>
          )}

          {/* Wallet Transfer Form */}
          {selectedMethod === "wallet" && (
            <>
              <h4 className="mt-4 text-center">PLEASE PROVIDE YOUR WALLET DETAILS</h4>
              <Form className="text-start mt-3" onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Wallet Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="walletName"
                    value={formData.walletName}
                    onChange={handleChange}
                    placeholder="Enter wallet name"
                    required
                    style={{ background: "#c9d3dd", color: "#2c3e50", border: "1px solid #a4b0be" }}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Wallet Address</Form.Label>
                  <Form.Control
                    type="text"
                    name="walletAddress"
                    value={formData.walletAddress}
                    onChange={handleChange}
                    placeholder="Enter wallet address"
                    required
                    style={{ background: "#c9d3dd", color: "#2c3e50", border: "1px solid #a4b0be" }}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email"
                    required
                    style={{ background: "#c9d3dd", color: "#2c3e50", border: "1px solid #a4b0be" }}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>ETH Withdrawal Amount</Form.Label>
                  <Form.Control
                    type="number"
                    name="ethAmount"
                    value={formData.ethAmount}
                    onChange={handleChange}
                    placeholder="Enter amount in ETH"
                    required
                    style={{ background: "#c9d3dd", color: "#2c3e50", border: "1px solid #a4b0be" }}
                  />
                  {withdrawalUsdPrice && (
                    <Form.Text className="text-muted">
                      ≈ ${withdrawalUsdPrice} USD
                    </Form.Text>
                  )}
                </Form.Group>



                <Button
                  type="button"
                  onClick={() => setIsWithdrawModalOpen(true)} // Open modal
                  style={{
                    width: "50%", // Adjust width to make it shorter
                    fontWeight: "bold",
                    padding: "10px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #1f2937, #111827)", // dark gradient
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.5)", // dark shadow
                    color: "#fff",
                    display: "block", // Ensure centering works
                    margin: "0 auto", // Center horizontally
                    textAlign: "center", // Align text properly
                  }}
                >
                  Withdraw
                </Button>

              </Form>
            </>
          )}

        </div>
      </div>

      {isWithdrawModalOpen && (
        <div className="withdraw-modal-overlay">
          <div className="withdraw-modal-box">
            <h2>Confirm Withdrawal</h2>
            <p>Are you sure you want to withdraw <strong>{formData.ethAmount} ETH</strong>?</p>
            <span>Gas Fees: 0.05 ETH</span>

            <div className="withdraw-modal-actions">
              {!isLoading && <button className="withdraw-cancel-btn" onClick={() => setIsWithdrawModalOpen(false)}>Cancel</button>}

              <button
                className="withdraw-confirm-btn"
                onClick={handleSubmit} // ✅ No need for extra function wrapper
                disabled={isLoading} // ✅ Correct way to disable button when loading
              >
                {isLoading ? (
                  <Spinner animation="border" size="sm" className="text-white" />
                ) : (
                  <span>Withdraw {formData.ethAmount} ETH</span>
                )}
              </button>

            </div>
          </div>
        </div>
      )}


    </div>
  );

};

export default WalletBalance;
