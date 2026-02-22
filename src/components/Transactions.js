import React, { useState, useEffect } from 'react';
import { useUserContext } from './UserRoleContext';
import { ToastContainer, toast } from "react-toastify";
import { Spinner } from "react-bootstrap";
import "react-toastify/dist/ReactToastify.css";
import 'font-awesome/css/font-awesome.min.css'; // Import Font Awesome CSS

const TransactionList = () => {
  const { userData } = useUserContext();
  const [userTransactions, setUserTransactions] = useState([]);
  const [loading, setLoading] = useState(false); // Loading state
  const userID = userData?.userID; // Ensure userID exists

  useEffect(() => {
    // Fetch the user's transactions when the component mounts
    if (userID) fetchUserTransactions(userID);
  }, [userID]);

  const fetchUserTransactions = async (userID) => {
    setLoading(true); // Set loading to true before fetching
    try {
      const response = await fetch(
        `https://nft-broker-e3q7.onrender.com/api/getUserTransactions?userID=${userID}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const userTransactionsData = await response.json();
      // Sort transactions in descending order based on a timestamp field
      userTransactionsData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setUserTransactions(userTransactionsData);
    } catch (error) {
      console.error('Error fetching user transactions: ', error);
      // console.error("Failed to fetch transactions. Please try again later.", {
      //   className: "custom-toast",
      // });
    } finally {
      setLoading(false); // Set loading to false after fetch
    }
  };

  return (
    <div className='container-large'>

      <ToastContainer />
      <div className="container">
        <div
          className="transaction-list main-container p-4 mt-5"
          style={{
            background: "rgba(255, 255, 255, 0.2)",
            boxShadow: "0 8px 16px rgba(0, 0, 0, 0.3)",
            borderRadius: "12px",
            backdropFilter: "blur(12px)",
          }}
        >
          {loading ? (
            <div className="text-center p-5">
              <Spinner animation="border" size="md" variant="primary" />
              <p className="text-dark mt-3">Loading Transactions...</p>
            </div>
          ) : (
            <>
              {userTransactions.length === 0 ? (
                <p className="text-center text-dark">No transactions found.</p>
              ) : (
                userTransactions.map((transaction, index) => (
                  <div
                    key={index}
                    className="p-3 mt-3"
                    style={{
                      borderRadius: "12px",
                      background: "rgba(255, 255, 255, 0.3)",
                      backdropFilter: "blur(15px)",
                      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.2)",
                      borderLeft: `5px solid ${transaction.status === "success"
                        ? "#28a745"
                        : transaction.status === "pending"
                          ? "#ffc107"
                          : "#dc3545"
                        }`,
                      color: "#2c3e50",
                    }}
                  >
                    {/* Transaction Header */}
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-2">
                      <div className="fw-bold">{transaction.description}</div>
                      <div className="text-muted small mt-1 mt-md-0">
                        {new Date(transaction.timestamp).toLocaleString()}
                      </div>
                    </div>

                    {/* Reference */}
                    <div className="text-muted small mb-2">
                      Ref: <code>{transaction.transactionReference}</code>
                    </div>

                    {/* Status & Amount */}
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center">
                      {/* Status */}
                      <span
                        className="d-inline-flex align-items-center px-2 py-1 rounded-pill mb-2 mb-md-0"
                        style={{
                          backgroundColor:
                            transaction.status === "success"
                              ? "#d4edda"
                              : transaction.status === "pending"
                                ? "#fff3cd"
                                : "#f8d7da",
                          color:
                            transaction.status === "success"
                              ? "#155724"
                              : transaction.status === "pending"
                                ? "#856404"
                                : "#721c24",
                          fontWeight: 500,
                          fontSize: "0.875rem",
                          maxWidth: "100%",
                        }}
                      >
                        <span
                          className="me-2"
                          style={{
                            width: "10px",
                            height: "10px",
                            borderRadius: "50%",
                            backgroundColor:
                              transaction.status === "success"
                                ? "#28a745"
                                : transaction.status === "pending"
                                  ? "#ffc107"
                                  : "#dc3545",
                          }}
                        />
                        {transaction.status === "success"
                          ? "Transaction Successful"
                          : transaction.status === "pending"
                            ? "Transaction Pending"
                            : "Transaction Failed"}
                      </span>

                      {/* Amount */}
                      <span className="fw-bold text-primary">{transaction.amount} ETH</span>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>

    </div>

  );
};

export default TransactionList;
