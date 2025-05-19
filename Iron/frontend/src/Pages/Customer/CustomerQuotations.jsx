import { Table, Alert, Button, Modal, Form, Badge, Card, Row, Col, Spinner } from "react-bootstrap";
import React, { useEffect, useState } from "react";
import jsPDF from "jspdf";
import { applyPlugin } from "jspdf-autotable";
import { FaFilePdf, FaSearch, FaInfoCircle, FaEye, FaReply } from "react-icons/fa";
import { BsClipboardCheck, BsCalendarDate, BsCashCoin } from "react-icons/bs";
applyPlugin(jsPDF);

const CustomerQuotations = () => {
  const [quotations, setQuotations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentQuotation, setCurrentQuotation] = useState(null);
  const [quotationMaterials, setQuotationMaterials] = useState([]);
  const [customerStatus, setCustomerStatus] = useState("Pending");
  const [loading, setLoading] = useState(false);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("created_at");
  const [sortDirection, setSortDirection] = useState("desc");
  const [stats, setStats] = useState({
    totalQuotations: 0,
    pendingResponse: 0,
    approvedQuotations: 0,
  });

  // Fetch Quotations
  const fetchQuotations = async () => {
    setPageLoading(true);
    try {
      const response = await fetch("http://localhost:4000/api/quotation/admin");
      const data = await response.json();
      if (data.success) {
        const userID = localStorage.getItem("userId");
        const filteredQuotations = data.quotations.filter(
          (quotation) => String(quotation.customer_id) === String(userID)
        );
        setQuotations(filteredQuotations);
        
        // Calculate statistics
        const pendingCount = filteredQuotations.filter(q => 
          q.status === "Approved" && 
          (!q.customer_status || q.customer_status === "Pending")
        ).length;
        
        const approvedCount = filteredQuotations.filter(q => 
          q.customer_status === "Approved"
        ).length;
        
        setStats({
          totalQuotations: filteredQuotations.length,
          pendingResponse: pendingCount,
          approvedQuotations: approvedCount
        });
        
        setError(null);
      } else {
        console.error("Failed to fetch quotations:", data.message);
        setError("Failed to load quotations. Please try again later.");
      }
    } catch (error) {
      console.error("Error fetching quotations:", error);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

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
          (quotation.customer_status || "Pending").toLowerCase().includes(searchLower)
        );
      })
      .sort((a, b) => {
        // Handle sorting
        if (sortField === "created_at") {
          return sortDirection === "asc"
            ? new Date(a.created_at) - new Date(b.created_at)
            : new Date(b.created_at) - new Date(a.created_at);
        }
        
        if (sortField === "quotation_amount") {
          const amountA = parseFloat(a.quotation_amount || 0);
          const amountB = parseFloat(b.quotation_amount || 0);
          return sortDirection === "asc" ? amountA - amountB : amountB - amountA;
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

  // PDF Generation Handler
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    // Add company logo and header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text("Quotation Management Report", 14, 22);
    
    // Add metadata
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    
    // Summary section
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text("Quotation Summary", 14, 40);
    
    doc.setFontSize(10);
    doc.text(`Total Quotations: ${stats.totalQuotations}`, 14, 48);
    doc.text(`Pending Response: ${stats.pendingResponse}`, 14, 54);
    doc.text(`Approved Quotations: ${stats.approvedQuotations}`, 14, 60);
    
    const tableColumn = [
      "Job ID",
      "Quotation ID",
      "Job Category",
      "Job Description",
      "Admin Status",
      "Your Response",
      "Quotation Amount",
      "Date",
    ];
    
    const tableRows = quotations.map((quotation) => [
      quotation.jobID,
      `QID-${quotation.id}`,
      quotation.job_category,
      quotation.job_description ? 
        (quotation.job_description.length > 30 ? 
          quotation.job_description.substring(0, 30) + "..." : 
          quotation.job_description) : 
        "",
      quotation.status,
      quotation.customer_status || "Pending",
      `LKR ${parseFloat(quotation.quotation_amount || 0).toFixed(2)}`,
      new Date(quotation.created_at).toLocaleDateString(),
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 70,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      margin: { top: 70 },
      styles: { fontSize: 8 }
    });

    doc.save("quotations_report.pdf");
  };

  // Fetch materials for a quotation
  const fetchQuotationMaterials = async (quotationId) => {
    setMaterialsLoading(true);
    try {
      // First try to get materials from localStorage (temporary solution)
      const savedMaterials = localStorage.getItem(`quotation_${quotationId}_materials`);
      if (savedMaterials) {
        const parsedMaterials = JSON.parse(savedMaterials);
        setQuotationMaterials(parsedMaterials);
        return;
      }

      // If not in localStorage, try to fetch from API
      // Note: This endpoint may not exist yet in your backend
      const response = await fetch(
        `http://localhost:4000/api/quotation/get_materials/${quotationId}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.materials) {
          setQuotationMaterials(data.materials);
        } else {
          setQuotationMaterials([]);
        }
      } else {
        setQuotationMaterials([]);
      }
    } catch (error) {
      console.error("Error fetching quotation materials:", error);
      setQuotationMaterials([]);
    } finally {
      setMaterialsLoading(false);
    }
  };

  const handleViewQuotation = (quotation) => {
    setCurrentQuotation(quotation);
    setCustomerStatus(quotation.customer_status || "Pending");
    
    // Fetch materials for this quotation
    fetchQuotationMaterials(quotation.id);
    
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentQuotation(null);
    setQuotationMaterials([]);
  };

  const handleUpdateStatus = async () => {
    if (!currentQuotation) return;

    setLoading(true);
    try {
      const response = await fetch(
        "http://localhost:4000/api/quotation/customer_status",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            token: localStorage.getItem("token"),
          },
          body: JSON.stringify({
            quotationId: currentQuotation.id,
            customer_status: customerStatus,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        // Update local state
        setQuotations(
          quotations.map((q) =>
            q.id === currentQuotation.id
              ? { ...q, customer_status: customerStatus }
              : q
          )
        );

        // Recalculate statistics
        const updatedQuotations = quotations.map((q) =>
          q.id === currentQuotation.id
            ? { ...q, customer_status: customerStatus }
            : q
        );
        
        const pendingCount = updatedQuotations.filter(q => 
          q.status === "Approved" && 
          (!q.customer_status || q.customer_status === "Pending")
        ).length;
        
        const approvedCount = updatedQuotations.filter(q => 
          q.customer_status === "Approved"
        ).length;
        
        setStats({
          totalQuotations: updatedQuotations.length,
          pendingResponse: pendingCount,
          approvedQuotations: approvedCount
        });

        // Show success message
        alert("Your response has been recorded successfully!");
        handleCloseModal();
      } else {
        alert("Failed to update status: " + data.message);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("An error occurred while updating your response");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to determine if the quotation can be responded to
  const canRespond = (quotation) => {
    // Add a null check before trying to access the status
    if (!quotation) return false;

    // Only allow response if admin has set status to "Approved" (meaning they've created a quote)
    // And the customer hasn't responded yet or is pending
    return (
      quotation.status === "Approved" &&
      (!quotation.customer_status || quotation.customer_status === "Pending")
    );
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

  // Calculate subtotal from materials
  const calculateSubTotal = () => {
    return quotationMaterials.reduce((total, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unit_price) || 0;
      return total + quantity * unitPrice;
    }, 0);
  };

  const calculateLaborCost = () => {
    return calculateSubTotal() * 0.1;
  };

  const calculateMachineCost = () => {
    return calculateSubTotal() * 0.08;
  };

  const calculateTotalCost = () => {
    return calculateSubTotal() + calculateLaborCost() + calculateMachineCost();
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

  // Render error state
  if (error) {
    return (
      <div className="leftpart2">
        <Alert variant="danger" className="m-4">
          <FaInfoCircle className="me-2" />
          {error}
        </Alert>
      </div>
    );
  }

  const filteredData = getFilteredData();

  return (
    <div className="leftpart2">
      <Card className="shadow-sm mb-4 border-0">
        <Card.Body className="px-4 py-4">
          <Card.Title as="h2" className="mb-4" style={{ color: "#1a2142", fontWeight: 600 }}>
            Quotation Management
          </Card.Title>
          
          {/* Summary cards */}
          <Row className="mb-4 g-3">
            {/* Total Quotations */}
            <Col md={4}>
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
                    <Card.Title className="mb-1 h6">Total Quotations</Card.Title>
                    <h3 className="mb-0 text-primary">{stats.totalQuotations}</h3>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            {/* Pending Response */}
            <Col md={4}>
              <Card className="border-0 shadow-sm bg-light h-100">
                <Card.Body className="d-flex align-items-center">
                  <div className="rounded-circle me-3 d-flex justify-content-center align-items-center" 
                       style={{ 
                         backgroundColor: "#fff8e1", 
                         width: "50px", 
                         height: "50px" 
                       }}>
                    <FaReply size={20} style={{ color: "#f57c00" }} />
                  </div>
                  <div>
                    <Card.Title className="mb-1 h6">Pending Response</Card.Title>
                    <h3 className="mb-0 text-warning">{stats.pendingResponse}</h3>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            {/* Approved Quotations */}
            <Col md={4}>
              <Card className="border-0 shadow-sm bg-light h-100">
                <Card.Body className="d-flex align-items-center">
                  <div className="rounded-circle me-3 d-flex justify-content-center align-items-center" 
                       style={{ 
                         backgroundColor: "#e8f5e9", 
                         width: "50px", 
                         height: "50px" 
                       }}>
                    <BsCashCoin size={24} style={{ color: "#388e3c" }} />
                  </div>
                  <div>
                    <Card.Title className="mb-1 h6">Approved Quotations</Card.Title>
                    <h3 className="mb-0 text-success">{stats.approvedQuotations}</h3>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Search and export controls */}
          <Row className="mb-3 align-items-center">
            <Col md={6} className="mb-2 mb-md-0">
              <div className="position-relative">
                <Form.Control
                  type="text"
                  placeholder="Search by job ID, category or status..."
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
                onClick={handleDownloadPDF}
                disabled={quotations.length === 0}
                className="d-inline-flex align-items-center"
                style={{ backgroundColor: "#4F46E5", borderColor: "#4F46E5" }}
              >
                <FaFilePdf className="me-2" />
                Export as PDF
              </Button>
            </Col>
          </Row>

          {/* Table or empty state */}
          {quotations.length === 0 ? (
            <Alert variant="info" className="border-0 shadow-sm">
              <div className="text-center py-4">
                <FaInfoCircle size={32} className="mb-3 text-info" />
                <h5>No quotations found</h5>
                <p className="mb-0 text-muted">
                  You don't have any quotations in the system yet.
                </p>
              </div>
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table hover bordered className="shadow-sm bg-white table-responsive">
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
                    <th style={{ borderTop: "none" }}>Quotation ID</th>
                    <th 
                      className="cursor-pointer" 
                      onClick={() => handleSort("job_category")}
                      style={{ cursor: "pointer", borderTop: "none" }}
                    >
                      Job Category
                      {sortField === "job_category" && (
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
                      Admin Status
                      {sortField === "status" && (
                        <span className="ms-1">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </th>
                    <th 
                      className="cursor-pointer" 
                      onClick={() => handleSort("customer_status")}
                      style={{ cursor: "pointer", borderTop: "none" }}
                    >
                      Your Response
                      {sortField === "customer_status" && (
                        <span className="ms-1">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </th>
                    <th 
                      className="cursor-pointer" 
                      onClick={() => handleSort("quotation_amount")}
                      style={{ cursor: "pointer", borderTop: "none" }}
                    >
                      Quotation Amount
                      {sortField === "quotation_amount" && (
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
                      Date
                      {sortField === "created_at" && (
                        <span className="ms-1">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </th>
                    <th style={{ borderTop: "none" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((quotation) => (
                    <tr key={quotation.id}>
                      <td>{quotation.jobID}</td>
                      <td>QID-{quotation.id}</td>
                      <td>{quotation.job_category}</td>
                      <td>
                        <Badge
                          bg={
                            quotation.status === "Approved"
                              ? "success"
                              : quotation.status === "Rejected"
                              ? "danger"
                              : "warning"
                          }
                          className="px-3 py-2"
                        >
                          {quotation.status}
                        </Badge>
                      </td>
                      <td>
                        <Badge
                          bg={
                            quotation.customer_status === "Approved"
                              ? "success"
                              : quotation.customer_status === "Rejected"
                              ? "danger"
                              : "warning"
                          }
                          className="px-3 py-2"
                        >
                          {quotation.customer_status || "Pending"}
                        </Badge>
                      </td>
                      <td className="text-end">
                        LKR {parseFloat(quotation.quotation_amount || 0).toFixed(2)}
                      </td>
                      <td>{new Date(quotation.created_at).toLocaleDateString()}</td>
                      <td>
                        <Button
                          variant={canRespond(quotation) ? "outline-primary" : "outline-secondary"}
                          onClick={() => handleViewQuotation(quotation)}
                          disabled={quotation.status !== "Approved"}
                          size="sm"
                          className="d-flex align-items-center mx-auto"
                        >
                          {canRespond(quotation) ? (
                            <>
                              <FaReply className="me-1" /> Respond
                            </>
                          ) : (
                            <>
                              <FaEye className="me-1" /> View
                            </>
                          )}
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

      {/* Quotation Details Modal - Styled like AdminInvoices */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #edf2f7" }}>
          <Modal.Title style={{ color: "#1a2142", fontWeight: 600 }}>
            Quotation Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentQuotation && (
            <>
              <div className="row mb-4">
                <div className="col-md-6">
                  <Card className="border-0 shadow-sm mb-3">
                    <Card.Body>
                      <h6 className="mb-3 text-muted">Quotation Information</h6>
                      <div className="mb-2">
                        <small className="text-muted">Job ID</small>
                        <p className="mb-1 fw-bold">{currentQuotation.jobID}</p>
                      </div>
                      <div className="mb-2">
                        <small className="text-muted">Quotation ID</small>
                        <p className="mb-1 fw-bold">QID-{currentQuotation.id}</p>
                      </div>
                      <div className="mb-2">
                        <small className="text-muted">Job Category</small>
                        <p className="mb-1 fw-bold">{currentQuotation.job_category}</p>
                      </div>
                      <div className="mb-0">
                        <small className="text-muted">Date</small>
                        <p className="mb-0 fw-bold">
                          {new Date(currentQuotation.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </Card.Body>
                  </Card>
                </div>
                <div className="col-md-6">
                  <Card className="border-0 shadow-sm mb-3">
                    <Card.Body>
                      <h6 className="mb-3 text-muted">Status Information</h6>
                      <div className="mb-2">
                        <small className="text-muted">Admin Status</small>
                        <p className="mb-1">
                          {getStatusBadge(currentQuotation.status)}
                        </p>
                      </div>
                      <div className="mb-2">
                        <small className="text-muted">Your Response</small>
                        <p className="mb-1">
                          {getStatusBadge(currentQuotation.customer_status || "Pending")}
                        </p>
                      </div>
                      <div className="mb-0">
                        <small className="text-muted">Job Description</small>
                        <p className="mb-0 text-break">
                          {currentQuotation.job_description}
                        </p>
                      </div>
                    </Card.Body>
                  </Card>
                </div>
              </div>

              <Card className="border-0 shadow-sm mb-4">
                <Card.Body>
                  <h6 className="mb-3 text-muted">Quotation Items</h6>
                  {materialsLoading ? (
                    <div className="text-center p-4">
                      <Spinner animation="border" role="status" variant="primary" size="sm">
                        <span className="visually-hidden">Loading...</span>
                      </Spinner>
                      <p className="text-muted mt-2 mb-0">Loading materials...</p>
                    </div>
                  ) : quotationMaterials.length > 0 ? (
                    <>
                      <div className="table-responsive">
                        <table className="table table-sm table-bordered">
                          <thead className="table-light">
                            <tr>
                              <th>Material</th>
                              <th>Quantity</th>
                              <th>Unit Price (LKR)</th>
                              <th>Subtotal (LKR)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {quotationMaterials.map((item, index) => (
                              <tr key={index}>
                                <td>{item.material_name}</td>
                                <td>{item.quantity}</td>
                                <td className="text-end">{parseFloat(item.unit_price).toFixed(2)}</td>
                                <td className="text-end fw-bold">
                                  {(item.quantity * item.unit_price).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr>
                              <td colSpan="3" className="text-end">
                                <span className="fw-bold">Subtotal:</span>
                              </td>
                              <td className="text-end fw-bold">
                                {calculateSubTotal().toFixed(2)}
                              </td>
                            </tr>
                            <tr>
                              <td colSpan="3" className="text-end">
                                <span className="fw-bold">Labor Cost (10%):</span>
                              </td>
                              <td className="text-end">
                                {calculateLaborCost().toFixed(2)}
                              </td>
                            </tr>
                            <tr>
                              <td colSpan="3" className="text-end">
                                <span className="fw-bold">Machine Cost (8%):</span>
                              </td>
                              <td className="text-end">
                                {calculateMachineCost().toFixed(2)}
                              </td>
                            </tr>
                            <tr>
                              <td colSpan="3" className="text-end">
                                <span className="fw-bold">Total:</span>
                              </td>
                              <td className="text-end fw-bold text-primary">
                                {calculateTotalCost().toFixed(2)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </>
                  ) : parseFloat(currentQuotation.quotation_amount || 0) > 0 ? (
                    <Alert variant="info" className="mb-0 border-0">
                      <div className="d-flex align-items-center">
                        <FaInfoCircle className="me-2 text-info" />
                        <div>
                          No materials information available for this quotation.
                          <p className="mb-0 mt-1 fw-bold">
                            Total Cost: LKR {parseFloat(currentQuotation.quotation_amount).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </Alert>
                  ) : (
                    <Alert variant="info" className="mb-0 border-0">
                      <div className="d-flex align-items-center">
                        <FaInfoCircle className="me-2 text-info" />
                        <div>
                          No price information available for this quotation.
                        </div>
                      </div>
                    </Alert>
                  )}
                </Card.Body>
              </Card>

              {canRespond(currentQuotation) && (
                <Card className="border-0 shadow-sm mb-3">
                  <Card.Body>
                    <h6 className="mb-3 text-muted">Your Response</h6>
                    <Form>
                      <Form.Group controlId="customerStatus" className="mb-0">
                        <Form.Label className="fw-bold">
                          Please select your response to this quotation:
                        </Form.Label>
                        <Form.Select
                          value={customerStatus}
                          onChange={(e) => setCustomerStatus(e.target.value)}
                          className="mt-2"
                        >
                          <option value="Pending">Pending - Need more time to decide</option>
                          <option value="Approved">Approve - Accept this quotation</option>
                          <option value="Rejected">Reject - Decline this quotation</option>
                        </Form.Select>
                      </Form.Group>
                    </Form>
                  </Card.Body>
                </Card>
              )}

              {!canRespond(currentQuotation) && currentQuotation.customer_status && (
                <Card className="border-0 shadow-sm mb-3">
                  <Card.Body>
                    <h6 className="mb-3 text-muted">Your Response</h6>
                    <div className="d-flex align-items-center">
                      <div className="me-3">
                        {currentQuotation.customer_status === "Approved" ? (
                          <div className="bg-success-subtle p-2 rounded-circle">
                            <BsClipboardCheck size={24} className="text-success" />
                          </div>
                        ) : currentQuotation.customer_status === "Rejected" ? (
                          <div className="bg-danger-subtle p-2 rounded-circle">
                            <FaInfoCircle size={24} className="text-danger" />
                          </div>
                        ) : (
                          <div className="bg-warning-subtle p-2 rounded-circle">
                            <BsCalendarDate size={24} className="text-warning" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="mb-1 fw-bold">
                          You have {currentQuotation.customer_status.toLowerCase()} this quotation
                        </p>
                        <p className="mb-0 text-muted small">
                          {currentQuotation.customer_status === "Approved" 
                            ? "You've accepted this quotation. The service provider will proceed with the work."
                            : currentQuotation.customer_status === "Rejected"
                            ? "You've declined this quotation. No further action is required."
                            : "You haven't responded to this quotation yet."}
                        </p>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer style={{ backgroundColor: "#f8fafc", borderTop: "1px solid #edf2f7" }}>
          <Button 
            variant="outline-secondary" 
            onClick={handleCloseModal}
          >
            Close
          </Button>
          {currentQuotation && canRespond(currentQuotation) && (
            <Button
              variant="primary"
              onClick={handleUpdateStatus}
              disabled={loading}
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
                  Updating...
                </>
              ) : (
                "Submit Response"
              )}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CustomerQuotations;