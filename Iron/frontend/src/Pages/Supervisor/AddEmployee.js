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
  Image,
} from "react-bootstrap";
import {
  Upload,
  Person,
  CurrencyDollar,
  BriefcaseFill,
  CheckCircleFill,
  XCircleFill,
  Camera,
  EnvelopeFill,
  PhoneFill,
  GeoAltFill,
} from "react-bootstrap-icons";
import React, { useState } from "react";
import axios from "axios";
import { useMediaQuery } from "@mui/material"; // Reusing your MUI dependency

const AddEmployee = () => {
  const [employeeDetails, setEmployeeDetails] = useState({
    name: "",
    position: "",
    salary: "",
    email: "",
    phone: "",
    address: "",
    profileImage: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
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
    mainContainer: {
      padding: "1.5rem",
      maxWidth: "100%", // Full container width
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
    },
    sectionTitle: {
      marginBottom: "1rem",
      paddingBottom: "0.5rem",
      borderBottom: "1px solid #dee2e6",
      color: "#1a2142",
      fontWeight: 600,
    },
    profileContainer: {
      width: "150px",
      height: "150px",
      borderRadius: "50%",
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#f0f2f5",
      margin: "0 auto",
      position: "relative",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    },
    profileBorder: {
      border: "3px solid #4f46e5",
    },
    profileDefault: {
      border: "3px solid #e5e7eb",
    },
    profileImage: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
    },
    uploadButton: {
      cursor: "pointer",
      padding: "8px 16px",
      borderRadius: "4px",
    },
    formLabel: {
      fontWeight: 500,
    },
    formControl: {
      padding: "0.5rem 0.75rem",
      borderRadius: "4px",
    },
    submitButton: {
      borderRadius: "4px",
      backgroundColor: "#1a2142",
      borderColor: "#1a2142",
      padding: "0.5rem 1.5rem",
    },
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmployeeDetails({ ...employeeDetails, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setEmployeeDetails({ ...employeeDetails, profileImage: file });

    // Preview the image
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setIsSubmitting(true);

    const { name, position, salary } = employeeDetails;
    if (!name || !position || !salary) {
      setFormError("Please fill in all required fields.");
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("position", position);
    formData.append("salary", salary);

    // Optional fields
    if (employeeDetails.email) formData.append("email", employeeDetails.email);
    if (employeeDetails.phone) formData.append("phone", employeeDetails.phone);
    if (employeeDetails.address)
      formData.append("address", employeeDetails.address);

    if (employeeDetails.profileImage) {
      formData.append("profileImage", employeeDetails.profileImage);
    }

    try {
      const response = await axios.post(
        "http://localhost:4000/api/employee/add",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.data.success) {
        setFormSuccess("Employee added successfully!");
        // Reset form
        setEmployeeDetails({
          name: "",
          position: "",
          salary: "",
          email: "",
          phone: "",
          address: "",
          profileImage: null,
        });
        setImagePreview(null);
      } else {
        setFormError(
          response.data.message || "Failed to add employee. Please try again."
        );
      }
    } catch (error) {
      console.error("Error adding employee:", error);
      setFormError("Failed to add employee. Please try again.");
    } finally {
      setIsSubmitting(false);
      // Scroll to top to show success/error message
      window.scrollTo(0, 0);
    }
  };

  const resetForm = () => {
    // Reset form
    setEmployeeDetails({
      name: "",
      position: "",
      salary: "",
      email: "",
      phone: "",
      address: "",
      profileImage: null,
    });
    setImagePreview(null);
    setFormError("");
    setFormSuccess("");
  };

  return (
    <div style={styles.leftpart2}>
      <Container fluid style={styles.mainContainer}>
        <Card style={styles.card}>
          {/* Card Header */}
          <Card.Header style={styles.cardHeader}>
            <div className="d-flex align-items-center justify-content-center">
              <Person size={26} className="me-3" style={{ color: "#1a2142" }} />
              <h3 style={styles.cardTitle}>Add New Employee</h3>
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
              <Row>
                {/* Left column - Profile Image */}
                <Col lg={4} className="mb-4 mb-lg-0">
                  <div className="text-center">
                    <div
                      style={{
                        ...styles.profileContainer,
                        ...(imagePreview
                          ? styles.profileBorder
                          : styles.profileDefault),
                      }}
                    >
                      {imagePreview ? (
                        <Image
                          src={imagePreview}
                          alt="Profile Preview"
                          style={styles.profileImage}
                          roundedCircle
                        />
                      ) : (
                        <Person size={70} style={{ color: "#9ca3af" }} />
                      )}
                    </div>

                    <div className="mt-4">
                      <Form.Group>
                        <Form.Label
                          htmlFor="profileImage"
                          className="btn btn-outline-primary d-inline-flex align-items-center gap-2"
                          style={styles.uploadButton}
                        >
                          <Camera size={18} />
                          {imagePreview ? "Change Photo" : "Upload Photo"}
                        </Form.Label>
                        <Form.Control
                          type="file"
                          id="profileImage"
                          onChange={handleImageChange}
                          accept="image/*"
                          className="d-none"
                        />
                        {!imagePreview && (
                          <div className="text-muted small mt-2">
                            Optional: Upload a profile photo
                          </div>
                        )}
                      </Form.Group>
                    </div>
                  </div>
                </Col>

                {/* Right column - Employee Details */}
                <Col lg={8}>
                  <div className="mb-4">
                    <h5 style={styles.sectionTitle}>Employee Information</h5>

                    <Row className="mb-3">
                      <Col md={12}>
                        <Form.Group controlId="name">
                          <Form.Label style={styles.formLabel}>
                            Full Name <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Control
                            name="name"
                            value={employeeDetails.name}
                            onChange={handleChange}
                            placeholder="Enter employee's full name"
                            required
                            className="py-2"
                            style={styles.formControl}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="mb-3">
                      <Col md={6}>
                        <Form.Group controlId="position">
                          <Form.Label style={styles.formLabel}>
                            Position <span className="text-danger">*</span>
                          </Form.Label>
                          <InputGroup>
                            <InputGroup.Text
                              style={{ backgroundColor: "#f8f9fa" }}
                            >
                              <BriefcaseFill size={15} />
                            </InputGroup.Text>
                            <Form.Control
                              name="position"
                              value={employeeDetails.position}
                              onChange={handleChange}
                              placeholder="Enter job position"
                              required
                              className="py-2"
                            />
                          </InputGroup>
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group controlId="salary">
                          <Form.Label style={styles.formLabel}>
                            Salary (LKR) <span className="text-danger">*</span>
                          </Form.Label>
                          <InputGroup>
                            <InputGroup.Text
                              style={{ backgroundColor: "#f8f9fa" }}
                            >
                              <CurrencyDollar size={15} />
                            </InputGroup.Text>
                            <Form.Control
                              type="number"
                              name="salary"
                              value={employeeDetails.salary}
                              onChange={handleChange}
                              placeholder="Enter salary amount"
                              required
                              min="0"
                              step="1"
                              className="py-2"
                            />
                            <InputGroup.Text
                              style={{ backgroundColor: "#f8f9fa" }}
                            >
                              LKR
                            </InputGroup.Text>
                          </InputGroup>
                        </Form.Group>
                      </Col>
                    </Row>

                    <h5 style={styles.sectionTitle} className="mt-4">
                      Contact Information (Optional)
                    </h5>

                    <Row className="mb-3">
                      <Col md={6}>
                        <Form.Group controlId="email">
                          <Form.Label style={styles.formLabel}>
                            Email Address
                          </Form.Label>
                          <InputGroup>
                            <InputGroup.Text
                              style={{ backgroundColor: "#f8f9fa" }}
                            >
                              <EnvelopeFill size={15} />
                            </InputGroup.Text>
                            <Form.Control
                              type="email"
                              name="email"
                              value={employeeDetails.email || ""}
                              onChange={handleChange}
                              placeholder="Enter email address"
                              className="py-2"
                            />
                          </InputGroup>
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group controlId="phone">
                          <Form.Label style={styles.formLabel}>
                            Phone Number
                          </Form.Label>
                          <InputGroup>
                            <InputGroup.Text
                              style={{ backgroundColor: "#f8f9fa" }}
                            >
                              <PhoneFill size={15} />
                            </InputGroup.Text>
                            <Form.Control
                              type="tel"
                              name="phone"
                              value={employeeDetails.phone || ""}
                              onChange={handleChange}
                              placeholder="Enter phone number"
                              className="py-2"
                            />
                          </InputGroup>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={12}>
                        <Form.Group controlId="address">
                          <Form.Label style={styles.formLabel}>
                            Address
                          </Form.Label>
                          <InputGroup>
                            <InputGroup.Text
                              style={{ backgroundColor: "#f8f9fa" }}
                            >
                              <GeoAltFill size={15} />
                            </InputGroup.Text>
                            <Form.Control
                              as="textarea"
                              rows={2}
                              name="address"
                              value={employeeDetails.address || ""}
                              onChange={handleChange}
                              placeholder="Enter residential address"
                              className="py-2"
                            />
                          </InputGroup>
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>
                </Col>
              </Row>

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
                      Saving...
                    </>
                  ) : (
                    "Add Employee"
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

export default AddEmployee;
