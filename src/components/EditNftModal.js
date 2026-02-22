import React from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';

const EditNftModal = ({
  show,
  onHide,
  editForm,
  setEditForm,
  handleUpdateNft,
  isEditLoading
}) => {
  const styles = {
    modalDialog: {
      marginTop: "100px", // Avoid navbar overlap
      maxWidth: "500px",
      width: "90%",
    },
    modalContent: {
      background: "rgba(255, 255, 255, 0.95)",
      backdropFilter: "blur(10px)",
      borderRadius: "12px",
      border: "none",
      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
      padding: "10px"
    },
    modalHeader: {
      borderBottom: "1px solid #dee2e6",
      paddingTop: "1rem",
      paddingBottom: "1rem"
    },
    modalFooter: {
      borderTop: "1px solid #dee2e6",
      paddingTop: "1rem",
      paddingBottom: "1rem"
    },
    input: {
      background: "#f1f5f9",
      color: "#1e293b",
      border: "1px solid #cbd5e1",
      borderRadius: "8px"
    }
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      scrollable
      centered
      dialogClassName="custom-dialog"
      contentClassName="custom-content"
      style={styles.modalDialog}
    >
      <div style={styles.modalContent}>
        <Modal.Header closeButton style={styles.modalHeader}>
          <Modal.Title>Edit Artwork</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <form>
            <div className="mb-3">
              <label className="form-label">Bid Price (ETH)</label>
              <input
                type="number"
                className="form-control"
                style={styles.input}
                value={editForm.bidPrice}
                onChange={(e) =>
                  setEditForm({ ...editForm, bidPrice: e.target.value })
                }
              />
            </div>
          </form>
        </Modal.Body>

        <Modal.Footer style={styles.modalFooter}>
          {isEditLoading ? (
            <Spinner animation="border" size="sm" variant="primary" />
          ) : (
            <>
              <Button variant="secondary" onClick={onHide}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleUpdateNft}>
                Save Changes
              </Button>
            </>
          )}
        </Modal.Footer>
      </div>
    </Modal>
  );
};

export default EditNftModal;
