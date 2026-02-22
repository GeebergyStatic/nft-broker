import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Badge, Button, Spinner } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import { useUserContext } from "./UserRoleContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import "react-toastify/dist/ReactToastify.css";

const Minted = () => {
  const { userData } = useUserContext();
  const userId = userData?.userID;
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true); // ✅ Add loading state
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Fetch Minted NFTs from API
  const fetchUserNFTs = async () => {
    if (!userId) return;

    setLoading(true); // ✅ Show spinner before fetching
    try {
      const response = await fetch(
        `https://nft-broker-e3q7.onrender.com/api/fetch-minted-nfts/${userId}`
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
    setLoading(false); // ✅ Hide spinner after fetching
  };

  const handleSellNft = async (nft) => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://nft-broker-e3q7.onrender.com/api/sell-nft`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId,
          nftId: nft._id,
          bidPrice: nft.bidPrice,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        console.log("Artwork Sold!");
        toast.success("Artwork Sold!", {
          className: "custom-toast",
        });
        setIsLoading(false);
        fetchUserNFTs(); // Refresh the NFT list
      } else {
        console.error("Error:", result.message);
        toast.error(`Failed to sell artwork!: ${result.message}`, {
          className: "custom-toast",
        });
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Sell artwork error:", err.message);
      setIsLoading(false);
    }
  };


  useEffect(() => {
    fetchUserNFTs();
  }, [userId]);

  return (
    <div className="container-large">
      <Container className="mt-4">
        <ToastContainer />
        <div className="main-container">
          {loading ? ( // ✅ Show spinner when loading
            <div className="text-center my-5">
              <Spinner animation="border" size="lg" variant="primary" />
              <p className="mt-2 text-secondary">Fetching Artworks...</p>
            </div>
          ) : nfts.length === 0 ? (
            <div className="text-center text-secondary fw-bold">No available projects.</div>
          ) : (
            <Row className="justify-content-center">
              {!userData.isUserActive && <span className="text-warning mb-1">
                <FontAwesomeIcon className="mx-2" icon={faInfoCircle} />
                You are required to have a publisher's license (be verified) to sell your projects!
              </span>}
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
                        <Badge
                          bg={
                            nft.status === "successful"
                              ? "success"
                              : nft.status === "failed"
                                ? "danger"
                                : "warning"
                          }
                          className="p-2"
                        >
                          <>New Bid 🔥</>
                        </Badge>
                      </div>
                      <p className="text-muted">Created by: {nft.creatorName}</p>
                      <div className="d-flex justify-content-between">
                        <span className="fw-bold text-primary">{nft.bidPrice} ETH</span>
                        <Button variant="success" disabled={!userData.isUserActive || isLoading} size="sm" onClick={() => handleSellNft(nft)}>

                          {isLoading ? (
                            <Spinner animation="border" size="sm" className="text-white" />
                          ) :
                            (
                              <span>
                                Sell Artwork
                              </span>
                            )}
                        </Button>

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
  );
};

export default Minted;
