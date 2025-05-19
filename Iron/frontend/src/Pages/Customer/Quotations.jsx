import "./Quotations.css";
import { Alert, Button, Form, Spinner, Table, Card, Row, Col, Badge } from "react-bootstrap";
import React, { useEffect, useState } from "react";
import { FaPlus, FaSearch, FaInfoCircle, FaList, FaMapMarkerAlt, FaCalendarAlt, FaFileAlt } from "react-icons/fa";
import { BsClipboardCheck, BsCalendarDate } from "react-icons/bs";

const generateJobID = () => {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `JID-${randomNum}`;
};

// Job categories list
const JOB_CATEGORIES = [
  "Grill Gates",
  "Rot Iron Railing",
  "Digital Name Boards",
  "Trusses",
  "Roofings",
  "Gutter",
  "Down Pipes",
  "Flashing",
  "Malaysian Ceilings",
  "Aluminum Partitions",
  "Tempered Glass Doors",
  "Cladding Softrent",
  "Casement Window",
  "Sliding Window",
  "Sliding Doors",
  "MIG Welding"
];

const Quotations = () => {
  const [quotations, setQuotations] = useState([]);
  const [jobDescription, setJobDescription] = useState("");
  const [jobCategory, setJobCategory] = useState(""); 
  const [phone, setPhone] = useState("");
  const [jobID, setJobID] = useState(generateJobID());
  const [location, setLocation] = useState("");
  const [immediate, setImmediate] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("created_at");
  const [sortDirection, setSortDirection] = useState("desc");
  const [showForm, setShowForm] = useState(false);
  const [stats, setStats] = useState({
    totalJobs: 0,
    pendingJobs: 0,
    approvedJobs: 0,
    rejectedJobs: 0
  });

  const today = new Date().toISOString().split("T")[0];

  const fetchQuotations = async () => {
    setPageLoading(true);
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    try {
      const response = await fetch(
        "http://localhost:4000/api/quotation/get",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            token,
          },
          body: JSON.stringify({ userId }),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch jobs");
      }
      const data = await response.json();
      const fetchedQuotations = data.quotations || [];
      setQuotations(fetchedQuotations);
      
      // Calculate statistics
      const pendingCount = fetchedQuotations.filter(q => q.status === "Pending").length;
      const approvedCount = fetchedQuotations.filter(q => q.status === "Approved").length;
      const rejectedCount = fetchedQuotations.filter(q => q.status === "Rejected").length;
      
      setStats({
        totalJobs: fetchedQuotations.length,
        pendingJobs: pendingCount,
        approvedJobs: approvedCount,
        rejectedJobs: rejectedCount
      });
      
      setError(null);
    } catch (err) {
      setError("Error fetching jobs. Please try again later.");
      console.error(err);
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  const handleCreateQuotation = async (e) => {
    e.preventDefault();
    
    if (!jobDescription || !jobCategory || !location || !immediate || !jobID) {
      setError(
        "All fields are required. Please complete the form."
      );
      return;
    }

    setLoading(true);
    setError(null);

    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName");
    const userPhone = localStorage.getItem("phone");
    try {
      const response = await fetch(
        "http://localhost:4000/api/quotation/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            token,
          },
          body: JSON.stringify({
            job_description: jobDescription,
            job_category: jobCategory,
            jobID,
            userId,
            userName,
            phone: userPhone || phone,
            location,
            immediate,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Reset form
        setJobDescription("");
        setJobCategory("");
        setPhone("");
        setLocation("");
        setImmediate("");
        setJobID(generateJobID());
        setShowForm(false); // Hide form after successful submission
        
        // Update quotations list
        await fetchQuotations();
        
        // Show success message
        alert("Job created successfully!");
      } else {
        setError(data.message || "Error creating job request");
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort quotations
  const getFilteredData = () => {
    return quotations
      .filter((quotation) => {
        // Search functionality
        const searchLower = searchTerm.toLowerCase();
        return (
          searchTerm === "" ||
          quotation.jobID?.toLowerCase().includes(searchLower) ||
          quotation.job_category?.toLowerCase().includes(searchLower) ||
          quotation.status?.toLowerCase().includes(searchLower) ||
          quotation.job_description?.toLowerCase().includes(searchLower) ||
          quotation.location?.toLowerCase().includes(searchLower) ||
          (quotation.customer_name || "").toLowerCase().includes(searchLower)
        );
      })
      .sort((a, b) => {
        // Handle sorting
        if (sortField === "created_at") {
          return sortDirection === "asc"
            ? new Date(a.created_at) - new Date(b.created_at)
            : new Date(b.created_at) - new Date(a.created_at);
        }
        
        // Default string comparison for other fields
        const valA = String(a[sortField] || "");
        const valB = String(b[sortField] || "");
        
        return sortDirection === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      });
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

  // Function to get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case "Approved":
        return <Badge bg="success">{status}</Badge>;
      case "Rejected":
        return <Badge bg="danger">{status}</Badge>;
      default:
        return <Badge bg="warning">{status || "Pending"}</Badge>;
    }
  };

  // Render loading state
  if (pageLoading) {
    return (
      <div className="leftpart2">
        <div className="d-flex justify-content-center align-items-center" style={{ height: "400px" }}>
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      </div>
    );
  }

  const filteredData = getFilteredData();

  return (
    <div className="leftpart2">
      <Card className="shadow-sm mb-4 border-0">
        <Card.Body className="px-4 py-4">
          <Card.Title as="h2" className="mb-4" style={{ color: "#1a2142", fontWeight: 600 }}>
            Job Management
          </Card.Title>
          
          {/* Summary cards */}
          <Row className="mb-4 g-3">
            {/* Total Jobs */}
            <Col md={3}>
              <Card className="border-0 shadow-sm bg-light h-100">
                <Card.Body className="d-flex align-items-center">
                  <div className="rounded-circle me-3 d-flex justify-content-center align-items-center" 
                       style={{ 
                         backgroundColor: "#e3f2fd", 
                         width: "50px", 
                         height: "50px" 
                       }}>
                    <BsClipboardCheck size={24} style={{ color: "#1976d2" }} />
                  </div>
                  <div>
                    <Card.Title className="mb-1 h6">Total Jobs</Card.Title>
                    <h3 className="mb-0 text-primary">{stats.totalJobs}</h3>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            {/* Pending Jobs */}
            <Col md={3}>
              <Card className="border-0 shadow-sm bg-light h-100">
                <Card.Body className="d-flex align-items-center">
                  <div className="rounded-circle me-3 d-flex justify-content-center align-items-center" 
                       style={{ 
                         backgroundColor: "#fff8e1", 
                         width: "50px", 
                         height: "50px" 
                       }}>
                    <BsCalendarDate size={24} style={{ color: "#f57c00" }} />
                  </div>
                  <div>
                    <Card.Title className="mb-1 h6">Pending Jobs</Card.Title>
                    <h3 className="mb-0 text-warning">{stats.pendingJobs}</h3>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            {/* Approved Jobs */}
            <Col md={3}>
              <Card className="border-0 shadow-sm bg-light h-100">
                <Card.Body className="d-flex align-items-center">
                  <div className="rounded-circle me-3 d-flex justify-content-center align-items-center" 
                       style={{ 
                         backgroundColor: "#e8f5e9", 
                         width: "50px", 
                         height: "50px" 
                       }}>
                    <FaFileAlt size={20} style={{ color: "#388e3c" }} />
                  </div>
                  <div>
                    <Card.Title className="mb-1 h6">Approved Jobs</Card.Title>
                    <h3 className="mb-0 text-success">{stats.approvedJobs}</h3>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            {/* Rejected Jobs */}
            <Col md={3}>
              <Card className="border-0 shadow-sm bg-light h-100">
                <Card.Body className="d-flex align-items-center">
                  <div className="rounded-circle me-3 d-flex justify-content-center align-items-center" 
                       style={{ 
                         backgroundColor: "#ffebee", 
                         width: "50px", 
                         height: "50px" 
                       }}>
                    <FaInfoCircle size={20} style={{ color: "#d32f2f" }} />
                  </div>
                  <div>
                    <Card.Title className="mb-1 h6">Rejected Jobs</Card.Title>
                    <h3 className="mb-0 text-danger">{stats.rejectedJobs}</h3>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Search and Create Job button */}
          <Row className="mb-3 align-items-center">
            <Col md={6} className="mb-2 mb-md-0">
              <div className="position-relative">
                <Form.Control
                  type="text"
                  placeholder="Search by job ID, category, status or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="ps-5"
                />
                <FaSearch
                  style={{
                    position: "absolute",
                    left: "15px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#6c757d"
                  }}
                />
              </div>
            </Col>
            <Col md={6} className="text-md-end">
              <Button
                variant="primary"
                onClick={() => setShowForm(!showForm)}
                className="d-inline-flex align-items-center"
                style={{ backgroundColor: "#4F46E5", borderColor: "#4F46E5" }}
              >
                <FaPlus className="me-2" />
                {showForm ? "Hide Form" : "Create New Job"}
              </Button>
            </Col>
          </Row>

          {/* Error message */}
          {error && (
            <Alert variant="danger" className="mb-3 d-flex align-items-center">
              <FaInfoCircle className="me-2" />
              <div>{error}</div>
            </Alert>
          )}

          {/* Form for creating a new quotation */}
          {showForm && (
            <Card className="shadow-sm mb-4 border-0">
              <Card.Body className="p-4">
                <h5 className="mb-3" style={{ color: "#1a2142" }}>Create New Job Request</h5>
                <Form onSubmit={handleCreateQuotation}>
                  <Row>
                    <Col md={6}>
                      <Form.Group controlId="jobID" className="mb-3">
                        <Form.Label className="text-muted fw-medium">Job ID</Form.Label>
                        <div className="d-flex align-items-center">
                          <FaFileAlt className="text-muted position-absolute ms-3" style={{ fontSize: "14px" }} />
                          <Form.Control 
                            type="text" 
                            readOnly 
                            value={jobID} 
                            className="ps-5"
                            style={{ backgroundColor: "#f8fafc" }}
                          />
                        </div>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="jobCategory" className="mb-3">
                        <Form.Label className="text-muted fw-medium">Job Category</Form.Label>
                        <div className="d-flex align-items-center">
                          <FaList className="text-muted position-absolute ms-3" style={{ fontSize: "14px" }} />
                          <Form.Select 
                            value={jobCategory}
                            onChange={(e) => setJobCategory(e.target.value)}
                            required
                            className="ps-5"
                          >
                            <option value="">Select Job Category</option>
                            {JOB_CATEGORIES.map((category, index) => (
                              <option key={index} value={category}>
                                {category}
                              </option>
                            ))}
                          </Form.Select>
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group controlId="location" className="mb-3">
                        <Form.Label className="text-muted fw-medium">Location</Form.Label>
                        <div className="d-flex align-items-center">
                          <FaMapMarkerAlt className="text-muted position-absolute ms-3" style={{ fontSize: "14px" }} />
                          <Form.Control
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Enter Address"
                            className="ps-5"
                            required
                          />
                        </div>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="immediate" className="mb-3">
                        <Form.Label className="text-muted fw-medium">Required Date</Form.Label>
                        <div className="d-flex align-items-center">
                          <FaCalendarAlt className="text-muted position-absolute ms-3" style={{ fontSize: "14px" }} />
                          <Form.Control
                            type="date"
                            value={immediate}
                            onChange={(e) => setImmediate(e.target.value)}
                            className="ps-5"
                            min={today}
                            required
                          />
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group controlId="jobDescription" className="mb-3">
                    <Form.Label className="text-muted fw-medium">Job Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Enter detailed job description"
                      required
                    />
                  </Form.Group>

                  <div className="d-flex justify-content-end mt-3">
                    <Button 
                      variant="outline-secondary" 
                      className="me-2"
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      variant="primary"
                      style={{ backgroundColor: "#4F46E5", borderColor: "#4F46E5" }}
                    >
                      {loading ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            className="me-2"
                          />
                          Creating...
                        </>
                      ) : (
                        "Submit Job Request"
                      )}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          )}

          {/* Display list of quotations in a table */}
          {quotations.length > 0 ? (
            <div className="table-responsive">
              <Table hover bordered className="shadow-sm bg-white">
                <thead style={{ backgroundColor: "#f8fafc" }}>
                  <tr>
                    <th 
                      className="cursor-pointer" 
                      onClick={() => handleSort("jobID")}
                      style={{ cursor: "pointer", borderTop: "none" }}
                    >
                      Job ID
                      {sortField === "jobID" && (
                        <span className="ms-1">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </th>
                    <th
                      className="cursor-pointer"
                      onClick={() => handleSort("job_category")}
                      style={{ cursor: "pointer", borderTop: "none" }}
                    >
                      Category
                      {sortField === "job_category" && (
                        <span className="ms-1">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </th>
                    <th style={{ borderTop: "none" }}>Description</th>
                    <th style={{ borderTop: "none" }}>Location</th>
                    <th
                      className="cursor-pointer"
                      onClick={() => handleSort("immediate")}
                      style={{ cursor: "pointer", borderTop: "none" }}
                    >
                      Required Date
                      {sortField === "immediate" && (
                        <span className="ms-1">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </th>
                    <th
                      className="cursor-pointer"
                      onClick={() => handleSort("status")}
                      style={{ cursor: "pointer", borderTop: "none" }}
                    >
                      Status
                      {sortField === "status" && (
                        <span className="ms-1">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </th>
                    <th
                      className="cursor-pointer"
                      onClick={() => handleSort("created_at")}
                      style={{ cursor: "pointer", borderTop: "none" }}
                    >
                      Submitted Date
                      {sortField === "created_at" && (
                        <span className="ms-1">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item, index) => (
                    <tr key={index}>
                      <td>{item.jobID}</td>
                      <td>{item.job_category}</td>
                      <td>
                        {item.job_description && item.job_description.length > 50
                          ? `${item.job_description.substring(0, 50)}...`
                          : item.job_description}
                      </td>
                      <td>{item.location}</td>
                      <td>{item.immediate}</td>
                      <td>
                        <Badge
                          bg={
                            item.status === "Approved"
                              ? "success"
                              : item.status === "Rejected"
                              ? "danger"
                              : "warning"
                          }
                          className="px-3 py-2"
                        >
                          {item.status}
                        </Badge>
                      </td>
                      <td>{new Date(item.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <Alert variant="info" className="border-0 shadow-sm">
              <div className="text-center py-4">
                <FaInfoCircle size={32} className="mb-3 text-info" />
                <h5>No jobs found</h5>
                <p className="mb-0 text-muted">
                  You haven't created any job requests yet. Click the "Create New Job" button to get started.
                </p>
              </div>
            </Alert>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default Quotations;