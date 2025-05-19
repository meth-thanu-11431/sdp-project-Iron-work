import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Form,
  InputGroup,
  Modal,
  Row,
  Spinner,
  Table,
  Badge,
  Nav,
} from "react-bootstrap";
import {
  Search,
  PencilSquare,
  TrashFill,
  ArrowClockwise,
  SortUp,
  SortDown,
  BoxSeam,
  CurrencyDollar,
  Diagram3,
  ExclamationTriangleFill,
  CheckCircleFill,
} from "react-bootstrap-icons";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useMediaQuery } from '@mui/material'; // Reusing your MUI dependency

const MaterialList = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentMaterial, setCurrentMaterial] = useState(null);
  const [materialToDelete, setMaterialToDelete] = useState(null);
  const [newQuantity, setNewQuantity] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("id");
  const [sortDirection, setSortDirection] = useState("asc");
  const [refreshingData, setRefreshingData] = useState(false);
  const [lastDataRefresh, setLastDataRefresh] = useState(Date.now());
  const [stockFilter, setStockFilter] = useState("all"); // 'all', 'low', 'normal'
  
  // Responsive design handling
  const isMobile = useMediaQuery('(max-width:900px)');

  // Dynamic styles based on screen size
  const styles = {
    leftpart2: {
      transition: 'margin-left 0.3s ease',
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      marginLeft: isMobile ? '0' : '240px', // Match sidebar width
      width: isMobile ? '100%' : 'calc(100% - 240px)',
    },
    mainContainer: {
      padding: '1.5rem',
      maxWidth: '100%', // Full container width
    },
    card: {
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      borderRadius: '8px',
      border: 'none',
    },
    cardHeader: {
      backgroundColor: 'white',
      borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
      padding: '1rem 1.5rem',
      borderTopLeftRadius: '8px',
      borderTopRightRadius: '8px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardTitle: {
      margin: 0, 
      color: '#1a2142', 
      fontWeight: 600
    },
    searchInput: {
      borderRadius: '4px 0 0 4px',
    },
    tableHead: {
      backgroundColor: '#f8fafc',
    },
    sortableHeader: {
      cursor: 'pointer',
    },
    materialImage: {
      width: '80px',
      height: '80px',
      objectFit: 'cover',
      borderRadius: '6px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    placeholderImage: {
      width: '80px',
      height: '80px',
      backgroundColor: '#f0f0f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '6px',
      margin: '0 auto',
    },
    materialName: {
      fontWeight: 500,
      color: '#334155',
    },
    actionButton: {
      width: '40px',
      height: '40px',
      borderRadius: '8px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardFooter: {
      backgroundColor: 'white',
      padding: '0.75rem 1.5rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    modalImage: {
      width: '120px',
      height: '120px',
      objectFit: 'cover',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    modalPlaceholderImage: {
      width: '120px',
      height: '120px',
      backgroundColor: '#f0f0f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '8px',
      margin: '0 auto',
    },
    primaryButton: {
      backgroundColor: '#1a2142',
      borderColor: '#1a2142',
    }
  };

  // Fetch materials data from backend
  const fetchMaterials = async (showLoadingState = true) => {
    try {
      if (showLoadingState) {
        setLoading(true);
      } else {
        setRefreshingData(true);
      }

      const response = await axios.get(
        "http://localhost:4000/api/material/get"
      );
      setMaterials(response.data.materials);
      setError(null);
      setLastDataRefresh(Date.now());
    } catch (err) {
      console.error("Error fetching materials:", err);
      setError("Failed to fetch materials. Please try again.");
    } finally {
      if (showLoadingState) {
        setLoading(false);
      } else {
        setRefreshingData(false);
      }
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchMaterials();
  }, []);

  // Manual refresh handler
  const handleManualRefresh = async () => {
    setError(null);
    await fetchMaterials(false);
  };

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Render the sort icon
  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return null;
    }
    return sortDirection === "asc" ? (
      <SortUp className="ms-1" />
    ) : (
      <SortDown className="ms-1" />
    );
  };

  // Filtered and sorted materials
  const filteredAndSortedMaterials = materials
    .filter((material) => {
      // Apply stock filter
      if (stockFilter === "low") {
        if (parseInt(material.availableQty) > 50) return false;
      } else if (stockFilter === "normal") {
        if (parseInt(material.availableQty) <= 50) return false;
      }

      // Apply search filter
      const searchLower = searchTerm.toLowerCase();
      return (
        (material.id?.toString() || "").toLowerCase().includes(searchLower) ||
        (material.itemName || "").toLowerCase().includes(searchLower) ||
        (material.unitPrice?.toString() || "")
          .toLowerCase()
          .includes(searchLower) ||
        (material.availableQty?.toString() || "")
          .toLowerCase()
          .includes(searchLower)
      );
    })
    .sort((a, b) => {
      let comparison = 0;

      if (sortField === "id") {
        comparison = parseInt(a.id) - parseInt(b.id);
      } else if (sortField === "itemName") {
        comparison = a.itemName.localeCompare(b.itemName);
      } else if (sortField === "availableQty") {
        comparison = parseInt(a.availableQty) - parseInt(b.availableQty);
      } else if (sortField === "unitPrice") {
        comparison = parseFloat(a.unitPrice) - parseFloat(b.unitPrice);
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

  // Function to open delete confirmation
  const handleDeleteConfirm = (material) => {
    setMaterialToDelete(material);
    setShowDeleteModal(true);
  };

  // Function to delete a material
  const handleDelete = async () => {
    if (!materialToDelete) return;

    try {
      await axios.delete("http://localhost:4000/api/material/delete", {
        data: { id: materialToDelete.id },
      });
      setMaterials((prevMaterials) =>
        prevMaterials.filter((material) => material.id !== materialToDelete.id)
      );
      setShowDeleteModal(false);
      setMaterialToDelete(null);
    } catch (err) {
      console.error("Error deleting material:", err);
      alert("Failed to delete material");
    }
  };

  // Function to open the update modal
  const handleUpdateOpen = (material) => {
    setCurrentMaterial(material);
    setNewQuantity(material.availableQty);
    setNewPrice(material.unitPrice);
    setShowUpdateModal(true);
  };

  // Function to handle the update action
  const handleUpdateSubmit = async () => {
    if (newQuantity && newPrice) {
      try {
        await axios.put("http://localhost:4000/api/material/update", {
          id: currentMaterial.id,
          availableQty: newQuantity,
          unitPrice: newPrice,
        });

        setMaterials((prevMaterials) =>
          prevMaterials.map((material) =>
            material.id === currentMaterial.id
              ? { ...material, availableQty: newQuantity, unitPrice: newPrice }
              : material
          )
        );
        setShowUpdateModal(false);
      } catch (err) {
        console.error("Error updating material:", err);
        alert("Failed to update material");
      }
    }
  };

  // Get count of materials by stock level
  const getLowStockCount = () => {
    return materials.filter((material) => parseInt(material.availableQty) <= 50)
      .length;
  };

  const getNormalStockCount = () => {
    return materials.filter((material) => parseInt(material.availableQty) > 50)
      .length;
  };

  return (
    <div style={styles.leftpart2}>
      <Container fluid style={styles.mainContainer}>
        <Card style={styles.card}>
          {/* Card Header */}
          <Card.Header style={styles.cardHeader}>
            <div className="d-flex align-items-center">
              <BoxSeam
                size={26}
                className="me-3"
                style={{ color: "#1a2142" }}
              />
              <h3 style={styles.cardTitle}>
                Material List
              </h3>
            </div>

            <div className="d-flex align-items-center">
              <InputGroup style={{ width: isMobile ? "200px" : "300px" }}>
                <Form.Control
                  placeholder="Search materials..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={styles.searchInput}
                />
                <InputGroup.Text style={{ backgroundColor: "#f8f9fa" }}>
                  <Search />
                </InputGroup.Text>
              </InputGroup>

              <Button
                variant="outline-primary"
                onClick={handleManualRefresh}
                disabled={refreshingData}
                className="d-flex align-items-center ms-2"
              >
                {refreshingData ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <ArrowClockwise className="me-2" />
                    Refresh
                  </>
                )}
              </Button>
            </div>
          </Card.Header>

          {/* Stock Filter Tabs */}
          <div className="px-4 pt-3">
            <Nav variant="tabs" className="mb-3">
              <Nav.Item>
                <Nav.Link
                  active={stockFilter === "all"}
                  onClick={() => setStockFilter("all")}
                  className="d-flex align-items-center"
                >
                  <span>All Materials</span>
                  <Badge bg="secondary" className="ms-2">
                    {materials.length}
                  </Badge>
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={stockFilter === "low"}
                  onClick={() => setStockFilter("low")}
                  className="d-flex align-items-center"
                >
                  <ExclamationTriangleFill
                    className="me-1"
                    style={{
                      color: stockFilter === "low" ? "inherit" : "#dc3545",
                    }}
                  />
                  <span>Low Stock</span>
                  <Badge bg="danger" className="ms-2">
                    {getLowStockCount()}
                  </Badge>
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={stockFilter === "normal"}
                  onClick={() => setStockFilter("normal")}
                  className="d-flex align-items-center"
                >
                  <CheckCircleFill
                    className="me-1"
                    style={{
                      color: stockFilter === "normal" ? "inherit" : "#198754",
                    }}
                  />
                  <span>Normal Stock</span>
                  <Badge bg="success" className="ms-2">
                    {getNormalStockCount()}
                  </Badge>
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </div>

          {/* Card Body */}
          <Card.Body className="p-0">
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Loading materials...</p>
              </div>
            ) : error ? (
              <Alert variant="danger" className="m-4">
                {error}
              </Alert>
            ) : filteredAndSortedMaterials.length === 0 ? (
              <Alert variant="info" className="m-4">
                {stockFilter === "low"
                  ? "No low stock materials found."
                  : stockFilter === "normal"
                  ? "No normal stock materials found."
                  : "No materials found. Try adjusting your search."}
              </Alert>
            ) : (
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead style={styles.tableHead}>
                    <tr>
                      <th
                        style={{ ...styles.sortableHeader, width: "10%" }}
                        onClick={() => handleSort("id")}
                      >
                        <div className="d-flex align-items-center">
                          ID {renderSortIcon("id")}
                        </div>
                      </th>
                      <th style={{ width: "15%" }}>Image</th>
                      <th
                        style={{ ...styles.sortableHeader, width: "25%" }}
                        onClick={() => handleSort("itemName")}
                      >
                        <div className="d-flex align-items-center">
                          Material Name {renderSortIcon("itemName")}
                        </div>
                      </th>
                      <th
                        style={{ ...styles.sortableHeader, width: "15%" }}
                        onClick={() => handleSort("availableQty")}
                      >
                        <div className="d-flex align-items-center">
                          Quantity {renderSortIcon("availableQty")}
                        </div>
                      </th>
                      <th
                        style={{ ...styles.sortableHeader, width: "15%" }}
                        onClick={() => handleSort("unitPrice")}
                      >
                        <div className="d-flex align-items-center">
                          Price (LKR) {renderSortIcon("unitPrice")}
                        </div>
                      </th>
                      <th style={{ width: "20%" }} className="text-center">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedMaterials.map((material) => (
                      <tr key={material.id} style={{ verticalAlign: "middle" }}>
                        <td>
                          <Badge
                            bg="light"
                            text="dark"
                            pill
                            className="px-2 py-1"
                          >
                            #{material.id}
                          </Badge>
                        </td>
                        <td className="text-center">
                          {material.images && material.images.length > 0 ? (
                            <img
                              src={`http://localhost:4000/images/${material.images[0].replace(
                                /\\/g,
                                "/"
                              )}`}
                              alt={material.itemName}
                              style={styles.materialImage}
                            />
                          ) : (
                            <div style={styles.placeholderImage}>
                              <Diagram3
                                size={24}
                                style={{ color: "#6c757d" }}
                              />
                            </div>
                          )}
                        </td>
                        <td style={styles.materialName}>
                          {material.itemName}
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <Badge
                              bg={
                                parseInt(material.availableQty) <= 50
                                  ? "danger"
                                  : "success"
                              }
                              className="py-2 px-3 d-flex align-items-center"
                            >
                              {parseInt(material.availableQty) <= 50 && (
                                <ExclamationTriangleFill
                                  className="me-1"
                                  size={14}
                                />
                              )}
                              {material.availableQty} units
                            </Badge>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <span className="me-1">LKR</span>
                            {Number(material.unitPrice).toFixed(2)}
                          </div>
                        </td>
                        <td>
                          <div className="d-flex justify-content-center gap-2">
                            <Button
                              variant="outline-primary"
                              onClick={() => handleUpdateOpen(material)}
                              className="d-flex align-items-center"
                              style={styles.actionButton}
                            >
                              <PencilSquare size={18} />
                            </Button>
                            <Button
                              variant="outline-danger"
                              onClick={() => handleDeleteConfirm(material)}
                              className="d-flex align-items-center"
                              style={styles.actionButton}
                            >
                              <TrashFill size={18} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>

          {/* Card Footer */}
          {!loading && !error && filteredAndSortedMaterials.length > 0 && (
            <Card.Footer style={styles.cardFooter}>
              <span className="text-muted small">
                {stockFilter === "all" ? (
                  <>
                    Showing {filteredAndSortedMaterials.length} of{" "}
                    {materials.length} materials
                  </>
                ) : stockFilter === "low" ? (
                  <>
                    Showing {filteredAndSortedMaterials.length} of{" "}
                    {getLowStockCount()} low stock materials
                  </>
                ) : (
                  <>
                    Showing {filteredAndSortedMaterials.length} of{" "}
                    {getNormalStockCount()} normal stock materials
                  </>
                )}
              </span>
              <span className="text-muted small">
                Last updated: {new Date(lastDataRefresh).toLocaleTimeString()}
              </span>
            </Card.Footer>
          )}
        </Card>

        {/* Update Material Modal */}
        <Modal
          show={showUpdateModal}
          onHide={() => setShowUpdateModal(false)}
          centered
        >
          <Modal.Header closeButton className="bg-light">
            <Modal.Title className="d-flex align-items-center">
              <PencilSquare className="me-2" size={20} />
              Update Material
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {currentMaterial && (
              <Form>
                <Row className="mb-3">
                  <Col>
                    <div className="text-center mb-3">
                      {currentMaterial.images &&
                      currentMaterial.images.length > 0 ? (
                        <img
                          src={`http://localhost:4000/images/${currentMaterial.images[0].replace(
                            /\\/g,
                            "/"
                          )}`}
                          alt={currentMaterial.itemName}
                          style={styles.modalImage}
                        />
                      ) : (
                        <div style={styles.modalPlaceholderImage}>
                          <Diagram3 size={40} style={{ color: "#6c757d" }} />
                        </div>
                      )}
                    </div>

                    <Form.Group className="mb-3">
                      <Form.Label>Item Name</Form.Label>
                      <Form.Control
                        type="text"
                        value={currentMaterial.itemName}
                        readOnly
                        style={{ backgroundColor: "#f8f9fa" }}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Quantity</Form.Label>
                      <InputGroup>
                        <Form.Control
                          type="number"
                          value={newQuantity}
                          onChange={(e) => setNewQuantity(e.target.value)}
                          min="0"
                        />
                        <InputGroup.Text>units</InputGroup.Text>
                      </InputGroup>
                      {parseInt(newQuantity) <= 50 && (
                        <div className="text-danger mt-1 small d-flex align-items-center">
                          <ExclamationTriangleFill className="me-1" size={12} />
                          Low stock level
                        </div>
                      )}
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Price (LKR)</Form.Label>
                      <InputGroup>
                        <InputGroup.Text>
                          <CurrencyDollar />
                        </InputGroup.Text>
                        <Form.Control
                          type="number"
                          value={newPrice}
                          onChange={(e) => setNewPrice(e.target.value)}
                          step="0.01"
                          min="0"
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                </Row>
              </Form>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowUpdateModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleUpdateSubmit}
              style={styles.primaryButton}
            >
              Save Changes
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          show={showDeleteModal}
          onHide={() => setShowDeleteModal(false)}
          centered
        >
          <Modal.Header closeButton className="bg-danger text-white">
            <Modal.Title className="d-flex align-items-center">
              <TrashFill className="me-2" size={20} />
              Confirm Deletion
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {materialToDelete && (
              <>
                <p>
                  Are you sure you want to delete{" "}
                  <strong>{materialToDelete.itemName}</strong>?
                </p>
                <Alert variant="warning">
                  This action cannot be undone. All data associated with this
                  material will be permanently removed.
                </Alert>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete Material
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};

export default MaterialList;