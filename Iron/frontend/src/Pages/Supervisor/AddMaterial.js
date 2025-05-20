import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
  Spinner,
  InputGroup,
} from "react-bootstrap";
import {
  Upload,
  Trash,
  BoxSeam,
  CurrencyDollar,
  Tag,
  CheckCircleFill,
  XCircleFill,
  Archive,
} from "react-bootstrap-icons";
import React, { useState } from "react";
import axios from "axios";
import { useMediaQuery } from "@mui/material"; // Reusing your MUI dependency

const AddMaterial = () => {
  const [materialDetails, setMaterialDetails] = useState({
    item_name: "",
    available_qty: "",
    unit_price: "",
    images: [],
  });

  const [imagePreviews, setImagePreviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Responsive design handling
  const isMobile = useMediaQuery("(max-width:900px)");

  // Dynamic styles based on screen size
  const styles = {
    leftpart2: {
      transition: "margin-left 0.3s ease",
      minHeight: "100vh",
      backgroundColor: "#f8fafc",
      marginLeft: isMobile ? "0" : "240px", // Match sidebar width
      width: isMobile ? "100%" : "calc(100% - 240px)",
    },
    card: {
      boxShadow:
        "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
      borderRadius: "8px",
      border: "none",
    },
    cardHeader: {
      backgroundColor: "white",
      borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
      padding: "1rem 1.5rem",
      borderTopLeftRadius: "8px",
      borderTopRightRadius: "8px",
    },
    cardTitle: {
      margin: 0,
      color: "#1a2142",
      fontWeight: 600,
      fontSize: "1.5rem",
    },
    sectionTitle: {
      marginBottom: "1rem",
      paddingBottom: "0.5rem",
      borderBottom: "1px solid #dee2e6",
      color: "#1a2142",
      fontWeight: 600,
      textAlign: "center",
    },
    uploadButton: {
      padding: "12px",
      borderRadius: "4px",
      borderStyle: "dashed",
      borderWidth: "1px",
      backgroundColor: "#f8f9fa",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
    },
    imagePreview: {
      width: "100px",
      height: "100px",
      objectFit: "cover",
      borderRadius: "4px",
      border: "1px solid #dee2e6",
    },
    deleteButton: {
      position: "absolute",
      top: "-8px",
      right: "-8px",
      borderRadius: "50%",
      width: "24px",
      height: "24px",
      padding: "0",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    formLabel: {
      fontWeight: 500,
    },
    submitButton: {
      borderRadius: "4px",
      backgroundColor: "#1a2142",
      borderColor: "#1a2142",
      padding: "0.5rem 1.5rem",
    },
    mainContainer: {
      padding: "1.5rem",
      maxWidth: "100%", // Full container width
    },
    formField: {
      marginBottom: "1.5rem",
    },
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMaterialDetails({ ...materialDetails, [name]: value });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const updatedImages = [...materialDetails.images, ...files];
    const updatedPreviews = [
      ...imagePreviews,
      ...files.map((file) => URL.createObjectURL(file)),
    ];

    setMaterialDetails({ ...materialDetails, images: updatedImages });
    setImagePreviews(updatedPreviews);
  };

  const handleRemoveImage = (index) => {
    const updatedImages = materialDetails.images.filter((_, i) => i !== index);
    const updatedPreviews = imagePreviews.filter((_, i) => i !== index);

    setMaterialDetails({ ...materialDetails, images: updatedImages });
    setImagePreviews(updatedPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setIsSubmitting(true);

    const { item_name, available_qty, unit_price, images } = materialDetails;

    // Check if required fields are filled in
    if (!item_name || !available_qty || !unit_price) {
      setFormError("Please fill in all required fields.");
      setIsSubmitting(false);
      return;
    }

    // Prepare the data to send to the backend
    const formData = new FormData();
    formData.append("itemName", item_name);
    formData.append("availableQty", available_qty);
    formData.append("unitPrice", unit_price);

    if (images.length > 0) {
      images.forEach((image) => {
        formData.append("images", image);
      });
    }

    try {
      const response = await axios.post(
        "http://localhost:4000/api/material/add",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      console.log("Material added successfully:", response.data);
      setFormSuccess("Material added successfully!");

      // Reset form
      setMaterialDetails({
        item_name: "",
        available_qty: "",
        unit_price: "",
        images: [],
      });
      setImagePreviews([]);
    } catch (error) {
      console.error("Error adding material:", error);
      setFormError(
        error.response?.data?.message ||
          "Failed to add material. Please try again."
      );
    } finally {
      setIsSubmitting(false);
      // Scroll to top to show success/error message
      window.scrollTo(0, 0);
    }
  };

  // Reset form function
  const resetForm = () => {
    setMaterialDetails({
      item_name: "",
      available_qty: "",
      unit_price: "",
      images: [],
    });
    setImagePreviews([]);
    setFormError("");
    setFormSuccess("");
  };

  return (
    <div style={styles.leftpart2}>
      {/* Using fluid container with minimal padding to maximize space usage */}
      <Container fluid style={styles.mainContainer}>
        <Card style={styles.card}>
          {/* Card Header */}
          <Card.Header style={styles.cardHeader}>
            <div className="d-flex align-items-center justify-content-center">
              <BoxSeam
                size={26}
                className="me-3"
                style={{ color: "#1a2142" }}
              />
              <h3 style={styles.cardTitle}>Add New Material</h3>
            </div>
          </Card.Header>

          {/* Card Body */}
          <Card.Body className="p-4">
            {/* Alert Messages */}
            {formError && (
              <Alert
                variant="danger"
                className="mb-4"
                dismissible
                onClose={() => setFormError("")}
              >
                <div className="d-flex align-items-center">
                  <XCircleFill className="me-2" size={18} />
                  <span>
                    <strong>Error:</strong> {formError}
                  </span>
                </div>
              </Alert>
            )}

            {formSuccess && (
              <Alert
                variant="success"
                className="mb-4"
                style={{
                  backgroundColor: "#d4edda",
                  borderColor: "#c3e6cb",
                  color: "#155724",
                  padding: "12px 20px",
                  borderRadius: "4px",
                }}
                dismissible
                onClose={() => setFormSuccess("")}
              >
                <div className="d-flex align-items-center">
                  <CheckCircleFill
                    className="me-2"
                    size={18}
                    style={{ color: "#155724" }}
                  />
                  <span>
                    <strong>Success:</strong> {formSuccess}
                  </span>
                </div>
              </Alert>
            )}

            {/* Main Form */}
            <Form onSubmit={handleSubmit}>
              {/* Material Details Section */}
              <div style={styles.formField}>
                <h5 style={styles.sectionTitle}>Material Information</h5>

                <Row className="mb-4">
                  <Col md={12}>
                    <Form.Group controlId="item_name">
                      <Form.Label style={styles.formLabel}>
                        Material Name <span className="text-danger">*</span>
                      </Form.Label>
                      <InputGroup>
                        <InputGroup.Text style={{ backgroundColor: "#f8f9fa" }}>
                          <Tag size={15} />
                        </InputGroup.Text>
                        <Form.Control
                          name="item_name"
                          value={materialDetails.item_name}
                          onChange={handleChange}
                          placeholder="Enter material name"
                          required
                          className="py-2"
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6} className="mb-3 mb-md-0">
                    <Form.Group controlId="available_qty">
                      <Form.Label style={styles.formLabel}>
                        Available Quantity{" "}
                        <span className="text-danger">*</span>
                      </Form.Label>
                      <InputGroup>
                        <InputGroup.Text style={{ backgroundColor: "#f8f9fa" }}>
                          <Archive size={15} />
                        </InputGroup.Text>
                        <Form.Control
                          type="number"
                          name="available_qty"
                          value={materialDetails.available_qty}
                          onChange={handleChange}
                          placeholder="Enter quantity"
                          required
                          min="0"
                          className="py-2"
                        />
                        <InputGroup.Text style={{ backgroundColor: "#f8f9fa" }}>
                          units
                        </InputGroup.Text>
                      </InputGroup>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group controlId="unit_price">
                      <Form.Label style={styles.formLabel}>
                        Unit Price <span className="text-danger">*</span>
                      </Form.Label>
                      <InputGroup>
                        <InputGroup.Text style={{ backgroundColor: "#f8f9fa" }}>
                          <CurrencyDollar size={15} />
                        </InputGroup.Text>
                        <Form.Control
                          type="number"
                          name="unit_price"
                          value={materialDetails.unit_price}
                          onChange={handleChange}
                          placeholder="Enter price"
                          required
                          min="0"
                          step="0.01"
                          className="py-2"
                        />
                        <InputGroup.Text style={{ backgroundColor: "#f8f9fa" }}>
                          LKR
                        </InputGroup.Text>
                      </InputGroup>
                    </Form.Group>
                  </Col>
                </Row>
              </div>

              {/* Images Section */}
              <div style={styles.formField}>
                <h5 style={styles.sectionTitle}>Material Images</h5>

                <div className="mb-3">
                  <Button
                    variant="outline-primary"
                    className="d-flex align-items-center justify-content-center w-100"
                    style={styles.uploadButton}
                    as="label"
                  >
                    <Upload size={18} className="me-2" />
                    Click to upload material images
                    <Form.Control
                      type="file"
                      hidden
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </Button>

                  <Form.Text className="text-muted d-block text-center mt-2">
                    Upload one or more images of the material
                  </Form.Text>
                </div>

                {imagePreviews.length > 0 ? (
                  <div className="text-center">
                    <p className="text-muted small mb-2">
                      {imagePreviews.length} image
                      {imagePreviews.length !== 1 ? "s" : ""} selected
                    </p>

                    <div className="d-flex flex-wrap gap-3 justify-content-center">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} style={{ position: "relative" }}>
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            style={styles.imagePreview}
                          />
                          <Button
                            variant="danger"
                            size="sm"
                            style={styles.deleteButton}
                            onClick={() => handleRemoveImage(index)}
                          >
                            <Trash size={14} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted small mb-0 text-center">
                    No images selected. You can upload multiple images.
                  </p>
                )}
              </div>

              {/* Form Buttons */}
              <div className="d-flex justify-content-center gap-3 mt-4 pt-3 border-top">
                <Button
                  variant="outline-secondary"
                  className="px-4 py-2"
                  style={{ borderRadius: "4px", width: "150px" }}
                  onClick={resetForm}
                >
                  Reset
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  className="px-4 py-2"
                  style={{ ...styles.submitButton, width: "150px" }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Adding...
                    </>
                  ) : (
                    "Add Material"
                  )}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default AddMaterial;
