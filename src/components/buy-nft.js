import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Badge, Button, Spinner } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import { useUserContext } from "./UserRoleContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

const Buy = () => {
  const { userData } = useUserContext();
  const agentCode = userData?.agentCode;
  const userId = userData?.userID;
  const [ethToUsdRate, setEthToUsdRate] = useState(null);

  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [selectedNft, setSelectedNft] = useState(null);

  const GAS_FEE = 0.01; // ✅ Gas Fee in ETH

  const fetchUserNFTs = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://nft-broker-e3q7.onrender.com/api/fetch-agent-nfts/${agentCode}/${userId}`
      );
      const data = await response.json();
      if (response.ok) {
        setNfts(data);
      } else {
        console.log("Error fetching artworks: " + data.message);
      }
    } catch (error) {
      console.log("Fetch error: " + error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUserNFTs();
  }, [userId]);

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


  const handleMintClick = (nft) => {
    setSelectedNft(nft);
    setIsWithdrawModalOpen(true);
  };

  const confirmMintNft = async () => {
    if (!selectedNft) return;

    setIsLoading(true);
    try {
      const nftData = {
        userId,
        creatorName: selectedNft.creatorName,
        collectionName: selectedNft.collectionName,
        fileUrl: selectedNft.fileUrl,
        category: selectedNft.category,
        bidPrice: selectedNft.bidPrice,
        comment: selectedNft.comment || "",
        agentID: selectedNft.agentID || "",
      };

      const response = await axios.post(
        `https://nft-broker-e3q7.onrender.com/api/mint-nft`,
        nftData
      );

      toast.success("Artwork Minted Successfully!", { className: "custom-toast" });
      console.log("Minted Artwork:", response.data);
      setIsWithdrawModalOpen(false);
      window.location.reload(); // This refreshes the page
    } catch (error) {
      toast.error("Minting failed: " + (error.response?.data?.error || error.message), {
        className: "custom-toast",
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="container-large">
      <Container className="mt-4">
        <ToastContainer />
        <div className="main-container">
          {loading ? (
            <div className="text-center my-5">
              <Spinner animation="border" variant="primary" size="lg" />
              <p className="mt-2 text-secondary">Fetching Artworks...</p>
            </div>
          ) : nfts.length === 0 ? (
            <div className="text-center text-secondary fw-bold">No available projects.</div>
          ) : (
            <Row className="justify-content-center">
              <span className="text-warning mb-1">
                <FontAwesomeIcon className="mx-2" icon={faInfoCircle} />
                You can purchase artworks here!
              </span>
              {nfts.map((nft) => (
                <Col key={nft._id} md={4} className="mb-4">
                  <Card className="shadow-lg nft-slide" style={{ width: "100%" }}>
                    <Card.Img
                      variant="top"
                      src={nft.fileUrl}
                      alt={nft.collectionName}
                      style={{ height: "250px", objectFit: "cover" }}
                    />
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <h5 className="fw-bold">{nft.collectionName}</h5>
                        <Badge bg="warning" className="p-2">New Bid 🔥</Badge>
                      </div>
                      <p className="text-muted">Created by: {nft.creatorName}</p>
                      <div className="mt-3">
                        {/* Price Section */}
                        <div className="mb-1">
                          <div className="fw-bold text-primary">{nft.bidPrice} ETH</div>
                          {/* {ethToUsdRate && (
                            <small className="text-muted">≈ ${(nft.bidPrice * ethToUsdRate).toFixed(2)} USD</small>
                          )} */}
                        </div>

                        {/* Action Button */}
                        <div>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleMintClick(nft)}
                            className="w-100"
                          >
                            Mint Artwork
                          </Button>
                        </div>
                      </div>

                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>
      </Container>

      {/* ✅ Updated Modal Using Your Modal Classes */}
      {isWithdrawModalOpen && selectedNft && (
        <div className="withdraw-modal-overlay">
          <div className="withdraw-modal-box">
            <h2>Confirm Purchase</h2>

            {/* ✅ NFT Image */}
            <img
              src={selectedNft.fileUrl}
              alt={selectedNft.collectionName}
              className="img-fluid mb-3"
              style={{ maxHeight: "200px", objectFit: "cover", borderRadius: "10px" }}
            />

            <p><strong>{selectedNft.collectionName}</strong></p>
            <p className="text-secondary">Submitted by: {selectedNft.creatorName}</p>

            {/* ✅ Price Breakdown */}
            <div className="text-start">
              <p><strong>Price:</strong> {selectedNft.bidPrice} ETH</p>
              <p><strong>Gas Fee:</strong> {GAS_FEE} ETH</p>
              <p><strong>Total:</strong> {(parseFloat(selectedNft.bidPrice) + GAS_FEE).toFixed(2)} ETH</p>
            </div>

            <div className="withdraw-modal-actions">
              {/* ✅ Cancel Button */}
              {!isLoading && (
                <button className="withdraw-cancel-btn" onClick={() => setIsWithdrawModalOpen(false)}>
                  Cancel
                </button>
              )}

              {/* ✅ Confirm Mint Button */}
              <button
                className="withdraw-confirm-btn"
                onClick={confirmMintNft}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Spinner animation="border" size="sm" className="text-white" />
                ) : (
                  <span>Buy Artwork</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Buy;
