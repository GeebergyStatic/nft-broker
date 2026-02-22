import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Table, Spinner, Card, ProgressBar, Alert } from "react-bootstrap";
import { toast } from "react-toastify";
import { useUserContext } from "./UserRoleContext";
import axios from "axios";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase"; // Your Firebase storage import

const API_URL = "https://nft-broker-mroz.onrender.com/api/wallets";

const WalletManager = () => {
    const { userData } = useUserContext();
    const [wallets, setWallets] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showFormModal, setShowFormModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const [qrFile, setQrFile] = useState(null); // selected file
    const [qrPreview, setQrPreview] = useState(null); // local preview URL
    const [qrUrl, setQrUrl] = useState(""); // final Firebase URL
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadingQr, setUploadingQr] = useState(false);

    const [formData, setFormData] = useState({
        type: "Ethereum", // fixed default & only option
        address: "",
        isDefault: true,
    });

    useEffect(() => {
        fetchWallets();
    }, []);

    const fetchWallets = async () => {
        try {
            const res = await axios.get(API_URL);
            setWallets(res.data);
        } catch (err) {
            console.error("Failed to fetch wallets:", err);
            toast.error("Could not load wallets");
        } finally {
            setLoading(false);
        }
    };

    const openForm = (wallet = null) => {
        if (wallet) {
            setIsEditing(true);
            setFormData({
                type: wallet.type || "Ethereum",
                address: wallet.address || "",
                isDefault: wallet.isDefault ?? true,
            });
            setQrUrl(wallet.url || ""); // existing QR URL if editing
            setQrPreview(wallet.url || null);
        } else {
            setIsEditing(false);
            setFormData({
                type: "Ethereum",
                address: "",
                isDefault: true,
            });
            setQrFile(null);
            setQrPreview(null);
            setQrUrl("");
            setUploadProgress(0);
        }
        setShowFormModal(true);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === "checkbox" ? checked : value,
        });
    };

    const handleQrFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Preview
        const previewUrl = URL.createObjectURL(file);
        setQrPreview(previewUrl);
        setQrFile(file);
        setUploadProgress(0);
        setUploadingQr(true);

        // Upload to Firebase
        const storageRef = ref(storage, `wallet-qr/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
            "state_changed",
            (snapshot) => {
                const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                setUploadProgress(progress);
            },
            (error) => {
                console.error("QR upload error:", error);
                toast.error("Failed to upload QR code image");
                setUploadingQr(false);
            },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                setQrUrl(downloadURL);
                setUploadingQr(false);
                toast.success("QR code uploaded successfully");
            }
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (uploadingQr) {
            toast.info("Please wait for QR code upload to finish");
            return;
        }

        setSubmitting(true);

        const payload = {
            ...formData,
            url: qrUrl || undefined, // only send if we have a URL
        };

        try {
            let response;
            if (isEditing) {
                response = await axios.put(`${API_URL}/${formData._id || wallets.find(w => w.address === formData.address)?._id}`, payload);
            } else {
                response = await axios.post(API_URL, payload);
            }

            toast.success(isEditing ? "Wallet updated" : "Wallet added");
            fetchWallets();
            setShowFormModal(false);
        } catch (err) {
            console.error("Wallet save failed:", err);
            toast.error("Failed to save wallet");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (walletId) => {
        if (!window.confirm("Delete this wallet?")) return;

        setDeletingId(walletId);
        try {
            await axios.delete(`${API_URL}/${walletId}`);
            toast.success("Wallet deleted");
            fetchWallets();
        } catch (err) {
            toast.error("Failed to delete wallet");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="container mt-5" style={{ maxWidth: "960px" }}>
            <Card className="shadow border-0">
                <Card.Body className="p-4 p-md-5">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4 className="mb-0 fw-bold">Manage Withdrawal Wallets</h4>
                        <Button variant="primary" onClick={() => openForm()}>
                            + Add Ethereum Wallet
                        </Button>
                    </div>

                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" />
                        </div>
                    ) : wallets.length === 0 ? (
                        <Alert variant="info">No wallets added yet. Click "Add Ethereum Wallet" to get started.</Alert>
                    ) : (
                        <div className="table-responsive">
                            <Table hover bordered className="align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th>Coin</th>
                                        <th>Address</th>
                                        <th>QR Code</th>
                                        <th>Default</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {wallets.map((w) => (
                                        <tr key={w._id}>
                                            <td>
                                                <strong>{w.type || "Ethereum"}</strong>
                                            </td>
                                            <td>
                                                <code style={{ fontSize: "0.95rem" }}>{w.address}</code>
                                            </td>
                                            <td>
                                                {w.url ? (
                                                    <img
                                                        src={w.url}
                                                        alt="QR Code"
                                                        style={{ width: "60px", height: "60px", objectFit: "contain", borderRadius: "6px" }}
                                                    />
                                                ) : (
                                                    <span className="text-muted">No QR</span>
                                                )}
                                            </td>
                                            <td>{w.isDefault ? <span className="badge bg-success">Default</span> : "No"}</td>
                                            <td>
                                                <Button
                                                    size="sm"
                                                    variant="outline-primary"
                                                    className="me-2"
                                                    onClick={() => openForm(w)}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline-danger"
                                                    disabled={deletingId === w._id}
                                                    onClick={() => handleDelete(w._id)}
                                                >
                                                    {deletingId === w._id ? <Spinner size="sm" /> : "Delete"}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Modal Form */}
            <Modal
                show={showFormModal}
                onHide={() => setShowFormModal(false)}
                centered
                size="lg"
                dialogClassName="modal-90w"
            >
                <Modal.Header closeButton>
                    <Modal.Title>{isEditing ? "Edit Ethereum Wallet" : "Add Ethereum Wallet"}</Modal.Title>
                </Modal.Header>

                <Modal.Body style={{
                    maxHeight: "75vh",
                    overflowY: "auto",
                    padding: "1.5rem"
                }}>
                    <Form onSubmit={handleSubmit}>
                        {/* Coin Type */}
                        <Form.Group className="mb-3">
                            <Form.Label>Coin Type</Form.Label>
                            <Form.Select name="type" value="Ethereum" disabled>
                                <option value="Ethereum">Ethereum (ETH)</option>
                            </Form.Select>
                        </Form.Group>

                        {/* Address */}
                        <Form.Group className="mb-3">
                            <Form.Label>Wallet Address (0x...)</Form.Label>
                            <Form.Control
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="0xYourEthereumAddressHere"
                                required
                            />
                        </Form.Group>

                        {/* QR Upload + Preview */}
                        <Form.Group className="mb-4">
                            <Form.Label>QR Code Image (optional)</Form.Label>
                            <Form.Control
                                type="file"
                                accept="image/*"
                                onChange={handleQrFileChange}
                            />

                            {uploadingQr && (
                                <div className="mt-3">
                                    <ProgressBar
                                        now={uploadProgress}
                                        label={`${uploadProgress}%`}
                                        variant="info"
                                        animated
                                    />
                                    <small className="text-muted d-block mt-1">Uploading QR code...</small>
                                </div>
                            )}

                            {qrPreview && (
                                <div className="mt-3 text-center">
                                    <div style={{ maxHeight: "220px", overflow: "hidden" }}>
                                        <img
                                            src={qrPreview}
                                            alt="QR Preview"
                                            style={{
                                                maxWidth: "100%",
                                                maxHeight: "220px",
                                                objectFit: "contain",
                                                borderRadius: "8px",
                                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                                            }}
                                        />
                                    </div>
                                    <p className="text-success small mt-2 mb-0">QR code ready</p>
                                </div>
                            )}
                        </Form.Group>

                        <Form.Check
                            type="checkbox"
                            label="Set as Default Withdrawal Address"
                            name="isDefault"
                            checked={formData.isDefault}
                            onChange={handleChange}
                            className="mb-4"
                        />

                        <div className="d-grid mt-4">
                            <Button
                                type="submit"
                                size="lg"
                                disabled={submitting || uploadingQr}
                            >
                                {submitting ? (
                                    <>
                                        <Spinner size="sm" className="me-2" />
                                        Saving...
                                    </>
                                ) : isEditing ? (
                                    "Update Wallet"
                                ) : (
                                    "Add Wallet"
                                )}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default WalletManager;