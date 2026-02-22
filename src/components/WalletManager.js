import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Table, Spinner, Alert } from "react-bootstrap";
import { toast } from "react-toastify";
import { useUserContext } from "./UserRoleContext";
import axios from "axios";

const API_URL = "https://nft-broker-e3q7.onrender.com/api/wallets";


const WalletManager = () => {
    const { userData } = useUserContext();
    const [wallets, setWallets] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showFormModal, setShowFormModal] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const [formData, setFormData] = useState({
        type: "",
        address: "",
        memo: "",
        isDefault: true,
    });

    useEffect(() => {
        fetchWallets();
    }, []);

    const fetchWallets = async () => {
        try {
            const res = await axios.get(API_URL);
            setWallets(res.data);
        } finally {
            setLoading(false);
        }
    };

    const openForm = (wallet = null) => {

        setFormData({
            type: "",
            address: "",
            memo: "",
            isDefault: true,
        });
        setIsEditing(false);

        setShowFormModal(true);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
    };

    const handlePrimarySubmit = (e) => {
        e.preventDefault();

        const payload = isEditing
            ? { ...formData }
            : formData;

        submitWallet(payload);
        setShowFormModal(false);
    };


    const submitWallet = async (payload, showNotifications = true) => {
        setSubmitting(true);

        try {
            let response;
            if (isEditing) {
                response = await axios.put(`${API_URL}/${payload._id}`, payload);
            } else {
                response = await axios.post(API_URL, payload);
            }

            // ✅ Notify only if allowed
            if (showNotifications) {
                toast.success("Wallet saved successfully");
            }

            // Refresh the list after success
            fetchWallets();

        } catch (err) {
            console.error("Wallet submission failed:", err);

            // Notify only if allowed
            if (showNotifications) {
                toast.error("Failed to save wallet. Try again.");
            }
        } finally {
            setSubmitting(false);

        }
    };



    const handleDelete = async (walletId) => {
        setDeletingId(walletId);

        try {
            const response = await axios.delete(`${API_URL}/${walletId}`);
            setWallets((prev) => prev.filter((w) => w._id !== walletId));

            toast.success("Wallet deleted successfully");
        } catch (err) {
            console.error("Failed to delete wallet:", err);
            toast.error(
                "Failed to delete wallet"
            );
        } finally {
            setDeletingId(null);
        }
    };


    return (
        <div className="container mt-4 p-4 border" style={{ maxWidth: "900px" }}>

            <div className="d-flex justify-content-between mb-3">
                <h4>Manage Wallet Addresses</h4>
                <Button variant="success" onClick={() => openForm()}>
                    + Connect Wallet
                </Button>
            </div>

            {loading ? (
                <Spinner />
            ) : (
                <div className="table-responsive">
                    <Table bordered hover>
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Address</th>
                                <th>Memo</th>
                                <th>Default</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {wallets.map((w) => (
                                <tr key={w._id}>
                                    <td>{w.type}</td>
                                    <td>{w.address}</td>
                                    <td>{w.memo || "-"}</td>
                                    <td>{w.isDefault ? "Yes" : "No"}</td>
                                    <td className="d-flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline-primary"
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
                                            {deletingId === w._id ? (
                                                <Spinner size="sm" animation="border" />
                                            ) : (
                                                "Delete"
                                            )}
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>

            )}

            {/* MAIN FORM MODAL */}
            <Modal show={showFormModal} onHide={() => setShowFormModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{isEditing ? "Edit Wallet" : "Connect Wallet"}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handlePrimarySubmit}>
                        <Form.Group className="mb-2">
                            <Form.Label>Coin Type</Form.Label>
                            <Form.Control name="type" value={formData.type} onChange={handleChange} required />
                        </Form.Group>

                        <Form.Group className="mb-2">
                            <Form.Label>Address</Form.Label>
                            <Form.Control name="address" value={formData.address} onChange={handleChange} required />
                        </Form.Group>

                        <Form.Group className="mb-2">
                            <Form.Label>Memo</Form.Label>
                            <Form.Control name="memo" value={formData.memo} onChange={handleChange} />
                        </Form.Group>

                        <Form.Check
                            type="checkbox"
                            label="Set as Default"
                            name="isDefault"
                            checked={formData.isDefault}
                            onChange={handleChange}
                            className="mb-3"
                        />

                        <div className="text-end">
                            <Button type="submit" disabled={submitting}>
                                {submitting ? (
                                    <>
                                        <Spinner size="sm" animation="border" className="me-2" />
                                        Processing...
                                    </>
                                ) : (
                                    isEditing ? "Update Wallet" : "Connect"
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
