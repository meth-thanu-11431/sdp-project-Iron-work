import './MaterialList.css';

import { Button, Form, Modal, Table } from 'react-bootstrap';
import React, { useEffect, useState } from 'react';

import { Container } from '@mui/material';
import axios from 'axios';

const LowStockMaterial = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentMaterial, setCurrentMaterial] = useState(null);
  const [materialToDelete, setMaterialToDelete] = useState(null);
  const [newQuantity, setNewQuantity] = useState('');
  const [newPrice, setNewPrice] = useState('');

  // Fetch materials data from backend
  useEffect(() => {
    axios
      .get('http://localhost:4000/api/material/get')
      .then((response) => {
        setMaterials(response.data.materials);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching materials:", err);
        setError('Failed to fetch materials. Please try again.');
        setLoading(false);
      });
  }, []);

  // Function to open delete confirmation
  const handleDeleteConfirm = (material) => {
    setMaterialToDelete(material);
    setShowDeleteModal(true);
  };

  // Function to delete a material
  const handleDelete = () => {
    if (!materialToDelete) return;

    axios
      .delete('http://localhost:4000/api/material/delete', { data: { id: materialToDelete.id } })
      .then(() => {
        setMaterials((prevMaterials) => prevMaterials.filter((material) => material.id !== materialToDelete.id));
        setShowDeleteModal(false);
        setMaterialToDelete(null);
      })
      .catch((err) => {
        console.error("Error deleting material:", err);
        alert('Failed to delete material');
      });
  };

  // Function to open the update modal
  const handleUpdateOpen = (material) => {
    setCurrentMaterial(material);
    setNewQuantity(material.availableQty);
    setNewPrice(material.unitPrice);
    setShowUpdateModal(true);
  };

  // Function to handle the update action
  const handleUpdateSubmit = () => {
    if (newQuantity && newPrice) {
      axios
        .put('http://localhost:4000/api/material/update', {
          id: currentMaterial.id,
          availableQty: newQuantity,
          unitPrice: newPrice,
        })
        .then(() => {
          setMaterials((prevMaterials) =>
            prevMaterials.map((material) =>
              material.id === currentMaterial.id
                ? { ...material, availableQty: newQuantity, unitPrice: newPrice }
                : material
            )
          );
          setShowUpdateModal(false); // Close the modal after updating
        })
        .catch((err) => {
          console.error("Error updating material:", err);
          alert('Failed to update material');
        });
    }
  };

  return (
    <div className='leftpart2'>
      <Container className="list-material-container">
        <div className="container py-5">
          <h2 className="text-center mb-4" style={{ fontWeight: 600, color: '#1a2142' }}>
            Low Stock Material List
          </h2>

          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading materials...</p>
            </div>
          ) : error ? (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          ) : materials.length === 0 ? (
            <div className="alert alert-info" role="alert">
              No materials found. Add some materials to get started.
            </div>
          ) : (
            <Table striped bordered hover responsive className="shadow-sm">
              <thead className="bg-light">
                <tr>
                  <th>ID</th>
                  <th>Image</th>
                  <th>Material Name</th>
                  <th>Quantity</th>
                  <th>Price (LKR)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {materials
                  .filter((material) => Number(material.availableQty) <= 50)
                  .map((material) => (
                    <tr key={material.id}>
                      <td>{material.id}</td>
                      <td className="text-center">
                        {material.images && material.images.length > 0 ? (
                          <img
                            src={`http://localhost:4000/images/${material.images[0].replace(/\\/g, '/')}`}
                            alt={material.itemName}
                            width="80"
                            height="80"
                            style={{
                              objectFit: 'cover',
                              borderRadius: '6px',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '80px',
                              height: '80px',
                              background: '#f0f0f0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '6px',
                              margin: '0 auto'
                            }}
                          >
                            No Image
                          </div>
                        )}
                      </td>
                      <td>{material.itemName}</td>
                      <td>{material.availableQty}</td>
                      <td>{Number(material.unitPrice).toFixed(2)}</td>
                      <td>
                        <Button
                          variant="primary"
                          className="me-2"
                          onClick={() => handleUpdateOpen(material)}
                          style={{
                            backgroundColor: '#1a2142',
                            borderColor: '#1a2142'
                          }}
                        >
                          Update
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => handleDeleteConfirm(material)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </Table>
          )}
        </div>

        {/* Update Material Modal */}
        {currentMaterial && (
          <Modal show={showUpdateModal} onHide={() => setShowUpdateModal(false)} centered>
            <Modal.Header closeButton>
              <Modal.Title>Update Material</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Item Name</Form.Label>
                  <Form.Control type="text" value={currentMaterial.itemName} readOnly />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Quantity</Form.Label>
                  <Form.Control
                    type="number"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(e.target.value)}
                    min="0"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Price (LKR)</Form.Label>
                  <Form.Control
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    step="0.01"
                    min="0"
                  />
                </Form.Group>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowUpdateModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleUpdateSubmit}
                style={{
                  backgroundColor: '#1a2142',
                  borderColor: '#1a2142'
                }}
              >
                Save Changes
              </Button>
            </Modal.Footer>
          </Modal>
        )}

        {/* Delete Confirmation Modal */}
        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Deletion</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {materialToDelete && (
              <p>
                Are you sure you want to delete <strong>{materialToDelete.itemName}</strong>?
                This action cannot be undone.
              </p>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};

export default LowStockMaterial;