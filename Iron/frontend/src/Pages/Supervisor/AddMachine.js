import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
  Spinner,
  InputGroup
} from 'react-bootstrap';
import {
  Upload,
  Trash,
  Tools,
  Calendar3,
  CurrencyDollar,
  InfoCircle,
  CheckCircleFill,
  ExclamationTriangleFill,
  XCircleFill
} from 'react-bootstrap-icons';
import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import axios from 'axios';
import { useMediaQuery } from '@mui/material'; // Reusing your MUI dependency

const AddMachine = () => {
  const [machineDetails, setMachineDetails] = useState({
    machineName: '',
    description: '',
    purchaseDate: null,
    status: 'Active',
    hourlyRate: '',
  });

  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  
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
      justifyContent: 'center',
      alignItems: 'center',
    },
    cardTitle: {
      margin: 0, 
      color: '#1a2142', 
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    sectionTitle: {
      marginBottom: '1rem',
      paddingBottom: '0.5rem',
      borderBottom: '1px solid #dee2e6',
      color: '#1a2142',
      fontWeight: 600,
    },
    formLabel: {
      fontWeight: 500,
    },
    uploadButton: {
      padding: '12px',
      borderRadius: '4px',
      borderStyle: 'dashed',
      borderWidth: '1px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%'
    },
    imagePreview: {
      width: '100px',
      height: '100px',
      objectFit: 'cover',
      borderRadius: '4px',
      border: '1px solid #dee2e6'
    },
    deleteButton: {
      position: 'absolute',
      top: '-8px',
      right: '-8px',
      borderRadius: '50%',
      width: '24px',
      height: '24px',
      padding: '0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    submitButton: {
      borderRadius: '4px',
      backgroundColor: '#1a2142',
      borderColor: '#1a2142',
      padding: '0.5rem 1.5rem',
    },
    inputIcon: {
      backgroundColor: '#f8f9fa'
    },
    statusBadge: {
      padding: '0.5rem 0.75rem',
      display: 'inline-flex',
      alignItems: 'center'
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMachineDetails({ ...machineDetails, [name]: value });
  };

  const handleDateChange = (date) => {
    setMachineDetails({ ...machineDetails, purchaseDate: date });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    const newImages = [...images, ...files];
    setImages(newImages);

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  const handleRemoveImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setIsSubmitting(true);

    const { machineName } = machineDetails;

    if (!machineName) {
      setFormError('Machine Name is required');
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append('machineName', machineName);
    formData.append('description', machineDetails.description);
    formData.append('purchaseDate', machineDetails.purchaseDate ? machineDetails.purchaseDate.toISOString().split('T')[0] : '');
    formData.append('status', machineDetails.status);
    formData.append('hourlyRate', machineDetails.hourlyRate);

    images.forEach(image => {
      formData.append('images', image);
    });

    try {
      const response = await axios.post('http://localhost:4000/api/machine/add', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        setFormSuccess('Machine added successfully!');
        // Reset form
        setMachineDetails({
          machineName: '',
          description: '',
          purchaseDate: null,
          status: 'Active',
          hourlyRate: '',
        });
        setImages([]);
        setImagePreviews([]);
      }
    } catch (error) {
      console.error('Error adding machine:', error);
      setFormError(error.response?.data?.message || 'Failed to add machine');
    } finally {
      setIsSubmitting(false);
      // Scroll to top to show success/error message
      window.scrollTo(0, 0);
    }
  };
  
  // Reset form function
  const resetForm = () => {
    setMachineDetails({
      machineName: '',
      description: '',
      purchaseDate: null,
      status: 'Active',
      hourlyRate: '',
    });
    setImages([]);
    setImagePreviews([]);
    setFormError('');
    setFormSuccess('');
  };

  return (
    <div style={styles.leftpart2}>
      <Container fluid style={styles.mainContainer}>
        <Card style={styles.card}>
          {/* Card Header */}
          <Card.Header style={styles.cardHeader}>
            <div className="d-flex align-items-center">
              <Tools size={26} className="me-3" style={{ color: '#1a2142' }} />
              <h3 style={styles.cardTitle}>
                Add New Machine
              </h3>
            </div>
          </Card.Header>
          
          {/* Card Body */}
          <Card.Body className="p-4">
            {/* Alert Messages */}
            {formError && (
              <Alert variant="danger" className="mb-4" dismissible onClose={() => setFormError('')}>
                <div className="d-flex align-items-center">
                  <XCircleFill className="me-2" size={18} />
                  <span><strong>Error:</strong> {formError}</span>
                </div>
              </Alert>
            )}
            
            {formSuccess && (
              <Alert variant="success" className="mb-4" dismissible onClose={() => setFormSuccess('')}>
                <div className="d-flex align-items-center">
                  <CheckCircleFill className="me-2" size={18} />
                  <span><strong>Success:</strong> {formSuccess}</span>
                </div>
              </Alert>
            )}
            
            {/* Main Form */}
            <Form onSubmit={handleSubmit}>
              <Row>
                {/* Left Column - Machine Details */}
                <Col lg={6} className="mb-4 mb-lg-0">
                  <div className="mb-4">
                    <h5 style={styles.sectionTitle}>
                      Machine Details
                    </h5>
                    
                    <Form.Group className="mb-3" controlId="machineName">
                      <Form.Label style={styles.formLabel}>
                        Machine Name <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        name="machineName"
                        value={machineDetails.machineName}
                        onChange={handleChange}
                        placeholder="Enter machine name"
                        required
                        className="py-2"
                      />
                    </Form.Group>
                    
                    <Form.Group className="mb-3" controlId="description">
                      <Form.Label style={styles.formLabel}>Description</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={5}
                        name="description"
                        value={machineDetails.description}
                        onChange={handleChange}
                        placeholder="Enter machine description"
                        className="py-2"
                      />
                      <Form.Text className="text-muted">
                        <InfoCircle size={12} className="me-1" /> 
                        Provide details about machine specifications and capabilities
                      </Form.Text>
                    </Form.Group>
                    
                    {/* Machine Images Section */}
                    <div className="mb-4">
                      <h5 style={styles.sectionTitle}>
                        Machine Images
                      </h5>
                      
                      <div className="mb-3">
                        <Button
                          variant="outline-secondary"
                          className="d-flex align-items-center justify-content-center w-100"
                          style={styles.uploadButton}
                          as="label"
                        >
                          <Upload size={18} className="me-2" />
                          Click to upload machine images
                          <Form.Control
                            type="file"
                            hidden
                            multiple
                            accept="image/*"
                            onChange={handleImageChange}
                          />
                        </Button>
                      </div>
                      
                      {imagePreviews.length > 0 ? (
                        <>
                          <p className="text-muted small mb-2">
                            {imagePreviews.length} image{imagePreviews.length !== 1 ? 's' : ''} selected
                          </p>
                          
                          <div className="d-flex flex-wrap gap-3">
                            {imagePreviews.map((preview, index) => (
                              <div key={index} style={{ position: 'relative' }}>
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
                        </>
                      ) : (
                        <p className="text-muted small mb-0">
                          No images selected. You can upload multiple images.
                        </p>
                      )}
                    </div>
                  </div>
                </Col>
                
                {/* Right Column - Specifications & Status */}
                <Col lg={6}>
                  <div className="mb-4">
                    <h5 style={styles.sectionTitle}>
                      Specifications & Status
                    </h5>
                    
                    <Row className="mb-4">
                      <Col md={6}>
                        <Form.Group controlId="purchaseDate">
                          <Form.Label style={styles.formLabel}>Purchase Date</Form.Label>
                          <InputGroup>
                            <InputGroup.Text style={styles.inputIcon}>
                              <Calendar3 size={15} />
                            </InputGroup.Text>
                            <DatePicker
                              selected={machineDetails.purchaseDate}
                              onChange={handleDateChange}
                              dateFormat="MM/dd/yyyy"
                              className="form-control py-2"
                              placeholderText="Select date"
                              wrapperClassName="w-100"
                            />
                          </InputGroup>
                        </Form.Group>
                      </Col>
                      
                      <Col md={6}>
                        <Form.Group controlId="hourlyRate">
                          <Form.Label style={styles.formLabel}>Hourly Rate</Form.Label>
                          <InputGroup>
                            <InputGroup.Text style={styles.inputIcon}>
                              <CurrencyDollar size={15} />
                            </InputGroup.Text>
                            <Form.Control
                              type="number"
                              name="hourlyRate"
                              value={machineDetails.hourlyRate}
                              onChange={handleChange}
                              placeholder="0.00"
                              min="0"
                              step="0.01"
                              className="py-2"
                            />
                            <InputGroup.Text style={styles.inputIcon}>
                              LKR/hr
                            </InputGroup.Text>
                          </InputGroup>
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Row className="mb-3">
                      <Col md={12}>
                        <Form.Group controlId="status">
                          <Form.Label style={styles.formLabel}>Status</Form.Label>
                          <Form.Select
                            name="status"
                            value={machineDetails.status}
                            onChange={handleChange}
                            className="py-2"
                          >
                            <option value="Active">Active</option>
                            <option value="In Maintenance">In Maintenance</option>
                            <option value="Retired">Retired</option>
                          </Form.Select>
                        </Form.Group>
                        
                        <div className="mt-3">
                          <span className={`badge ${
                            machineDetails.status === 'Active' ? 'bg-success' : 
                            machineDetails.status === 'In Maintenance' ? 'bg-warning text-dark' : 
                            'bg-danger'
                          }`} style={styles.statusBadge}>
                            {machineDetails.status === 'Active' && <CheckCircleFill className="me-1" />}
                            {machineDetails.status === 'In Maintenance' && <ExclamationTriangleFill className="me-1" />}
                            {machineDetails.status === 'Retired' && <XCircleFill className="me-1" />}
                            {machineDetails.status}
                          </span>
                          <span className="ms-3 text-muted">
                            Current machine status
                          </span>
                        </div>
                      </Col>
                    </Row>
                    
                    <div className="mt-4 p-3" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                      <div className="d-flex">
                        <div className="me-3">
                          <InfoCircle size={20} className="text-primary" />
                        </div>
                        <div>
                          <h6 className="mb-1">Machine Information</h6>
                          <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                            Add all relevant details about the machine to help identify and track it in the system. The machine name is required, but other fields are optional.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
              
              {/* Form Buttons */}
              <div className="d-flex justify-content-center gap-3 mt-4 pt-3 border-top">
                <Button
                  variant="outline-secondary"
                  className="px-4 py-2"
                  style={{ borderRadius: '4px', width: '150px' }}
                  onClick={resetForm}
                >
                  Reset
                </Button>
                
                <Button
                  type="submit"
                  variant="primary"
                  className="px-4 py-2"
                  style={{ ...styles.submitButton, width: '150px' }}
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
                    'Add Machine'
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

export default AddMachine;