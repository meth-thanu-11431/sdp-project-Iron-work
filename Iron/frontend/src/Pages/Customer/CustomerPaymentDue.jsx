import { Table, Alert, Button, Card, Badge, Spinner, Row, Col, Form } from "react-bootstrap";
import React, { useEffect, useState } from "react";
import jsPDF from "jspdf";
import { applyPlugin } from "jspdf-autotable";
import { FaFilePdf, FaSearch, FaInfoCircle } from "react-icons/fa";
import { BsCashCoin, BsCalendarDate } from "react-icons/bs";
applyPlugin(jsPDF);

const CustomerPaymentDue = () => {
  const [quotations, setQuotations] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("created_at");
  const [sortDirection, setSortDirection] = useState("desc");
  const [stats, setStats] = useState({
    totalDue: 0,
    pendingPayments: 0,
    oldestPayment: null,
  });

  // Fetch Quotations
  useEffect(() => {
    const fetchQuotations = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          "http://localhost:4000/api/quotation/admin"
        );
        const data = await response.json();
        if (data.success) {
          const userID = localStorage.getItem("userId");
          const filteredQuotations = data.quotations.filter(
            (quotation) => String(quotation.customer_id) === String(userID)
          );
          setQuotations(filteredQuotations);
          setError(null);
        } else {
          console.error("Failed to fetch quotations:", data.message);
          setError("Failed to load quotations. Please try again later.");
        }
      } catch (error) {
        console.error("Error fetching quotations:", error);
        setError("Network error. Please check your connection and try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchQuotations();
  }, []);

  // Fetch Invoices using /get_all_invoices (GET)
  useEffect(() => {
    const fetchInvoices = async () => {
      const userID = localStorage.getItem("userId");
      try {
        const response = await fetch(
          "http://localhost:4000/api/quotation/get_all_invoices"
        );
        const data = await response.json();
        if (data.success) {
          // Filter invoices for this user
          const userInvoices = (data.invoices || []).filter(
            (inv) => String(inv.customer_id) === String(userID)
          );
          setInvoices(userInvoices);
        } else {
          setInvoices([]);
        }
      } catch (error) {
        setInvoices([]);
      }
    };
    fetchInvoices();
  }, []);

  // Calculate summary statistics
  useEffect(() => {
    if (invoices.length && quotations.length) {
      let totalDue = 0;
      let pendingCount = 0;
      let oldestDate = new Date();

      quotations.forEach((quotation) => {
        const invoice = getInvoiceByQuotationId(quotation.id);
        if (invoice) {
          const due = Number(invoice.total_amount) - Number(invoice.paid_amount);
          if (due > 0) {
            totalDue += due;
            pendingCount++;
            
            const invoiceDate = new Date(invoice.created_at || quotation.created_at);
            if (invoiceDate < oldestDate) {
              oldestDate = invoiceDate;
            }
          }
        }
      });

      setStats({
        totalDue: totalDue.toFixed(2),
        pendingPayments: pendingCount,
        oldestPayment: pendingCount > 0 ? oldestDate : null,
      });
    }
  }, [invoices, quotations]);

  // Helper: Get invoice by quotation id
  const getInvoiceByQuotationId = (quotationId) => {
    return invoices.find(
      (inv) => String(inv.quotation_id) === String(quotationId)
    );
  };

  // Filter and sort data for display
  const getFilteredData = () => {
    return quotations
      .filter((quotation) => {
        const invoice = getInvoiceByQuotationId(quotation.id);
        // Only show rows with pending payments
        if (
          invoice &&
          Number(invoice.total_amount) === Number(invoice.paid_amount)
        ) {
          return false;
        }
        
        // Search functionality
        const searchLower = searchTerm.toLowerCase();
        return (
          searchTerm === "" ||
          quotation.jobID?.toLowerCase().includes(searchLower) ||
          quotation.customer_name?.toLowerCase().includes(searchLower) ||
          quotation.job_description?.toLowerCase().includes(searchLower) ||
          quotation.status?.toLowerCase().includes(searchLower)
        );
      })
      .sort((a, b) => {
        // Handle sorting
        if (sortField === "created_at") {
          return sortDirection === "asc"
            ? new Date(a.created_at) - new Date(b.created_at)
            : new Date(b.created_at) - new Date(a.created_at);
        }
        
        if (sortField === "amount") {
          const invoiceA = getInvoiceByQuotationId(a.id);
          const invoiceB = getInvoiceByQuotationId(b.id);
          
          const dueA = invoiceA 
            ? Number(invoiceA.total_amount) - Number(invoiceA.paid_amount) 
            : 0;
          const dueB = invoiceB 
            ? Number(invoiceB.total_amount) - Number(invoiceB.paid_amount) 
            : 0;
            
          return sortDirection === "asc" ? dueA - dueB : dueB - dueA;
        }
        
        // Default string comparison for other fields
        const valA = a[sortField] || "";
        const valB = b[sortField] || "";
        
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
    doc.text("Payment Due Report", 14, 22);
    
    // Add metadata
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    
    // Summary section
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text("Payment Summary", 14, 40);
    
    doc.setFontSize(10);
    doc.text(`Total Outstanding: $${stats.totalDue}`, 14, 48);
    doc.text(`Number of Pending Payments: ${stats.pendingPayments}`, 14, 54);
    if (stats.oldestPayment) {
      doc.text(`Oldest Pending Payment: ${stats.oldestPayment.toLocaleDateString()}`, 14, 60);
    }
    
    // Table data
    const filteredData = getFilteredData();
    
    const tableColumn = [
      "Job ID",
      "Quotation ID",
      "Description",
      "Status",
      "Date",
      "Total Amount",
      "Paid Amount", 
      "Due Amount"
    ];
    
    const tableRows = filteredData.map((quotation) => {
      const invoice = getInvoiceByQuotationId(quotation.id);
      const totalAmount = invoice ? Number(invoice.total_amount) : 0;
      const paidAmount = invoice ? Number(invoice.paid_amount) : 0;
      const dueAmount = totalAmount - paidAmount;
      
      return [
        quotation.jobID,
        `QID-${quotation.id}`,
        quotation.job_description.substring(0, 30) + (quotation.job_description.length > 30 ? "..." : ""),
        quotation.status,
        new Date(quotation.created_at).toLocaleDateString(),
        totalAmount.toFixed(2),
        paidAmount.toFixed(2),
        dueAmount.toFixed(2)
      ];
    });

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

    doc.save("payment_due_report.pdf");
  };

  // Render loading state
  if (loading) {
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
            Payment Due Management
          </Card.Title>
          
          {/* Summary cards */}
          <Row className="mb-4 g-3">
            
    <Col md={4}>
      <Card className="border-0 shadow-sm bg-light h-100">
        <Card.Body className="d-flex align-items-center">
          <div className="rounded-circle me-3 d-flex justify-content-center align-items-center" 
               style={{ 
                 backgroundColor: "#e3f2fd", 
                 width: "50px", 
                 height: "50px" 
               }}>
            <BsCashCoin size={24} style={{ color: "#1976d2" }} />
          </div>
          <div>
            <Card.Title className="mb-1 h6">Total Outstanding</Card.Title>
            <h3 className="mb-0 text-primary">Rs.{stats.totalDue}</h3>
          </div>
        </Card.Body>
      </Card>
    </Col>
    
    <Col md={4}>
      <Card className="border-0 shadow-sm bg-light h-100">
        <Card.Body className="d-flex align-items-center">
          <div className="rounded-circle me-3 d-flex justify-content-center align-items-center" 
               style={{ 
                 backgroundColor: "#fff8e1", 
                 width: "50px", 
                 height: "50px" 
               }}>
            <FaInfoCircle size={24} style={{ color: "#f57c00" }} />
          </div>
          <div>
            <Card.Title className="mb-1 h6">Pending Payments</Card.Title>
            <h3 className="mb-0 text-warning">{stats.pendingPayments}</h3>
          </div>
        </Card.Body>
      </Card>
    </Col>
    
    <Col md={4}>
      <Card className="border-0 shadow-sm bg-light h-100">
        <Card.Body className="d-flex align-items-center">
          <div className="rounded-circle me-3 d-flex justify-content-center align-items-center" 
               style={{ 
                 backgroundColor: "#e8f5e9", 
                 width: "50px", 
                 height: "50px" 
               }}>
            <BsCalendarDate size={24} style={{ color: "#388e3c" }} />
          </div>
          <div>
            <Card.Title className="mb-1 h6">Oldest Payment</Card.Title>
            <h3 className="mb-0 text-success">
              {stats.oldestPayment
                ? stats.oldestPayment.toLocaleDateString()
                : "N/A"}
            </h3>
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
                  placeholder="Search by job ID, description or status..."
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
                disabled={filteredData.length === 0}
                className="d-inline-flex align-items-center"
                style={{ backgroundColor: "#4F46E5", borderColor: "#4F46E5" }}
              >
                <FaFilePdf className="me-2" />
                Export as PDF
              </Button>
            </Col>
          </Row>

          {/* Table or empty state */}
          {filteredData.length === 0 ? (
            <Alert variant="info" className="border-0 shadow-sm">
              <div className="text-center py-4">
                <FaInfoCircle size={32} className="mb-3 text-info" />
                <h5>No pending payments found</h5>
                <p className="mb-0 text-muted">
                  All your invoices are currently paid in full.
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
                      onClick={() => handleSort("job_description")}
                      style={{ cursor: "pointer", borderTop: "none" }}
                    >
                      Description
                      {sortField === "job_description" && (
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
                      Date
                      {sortField === "created_at" && (
                        <span className="ms-1">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </th>
                    <th style={{ borderTop: "none" }}>Total Amount</th>
                    <th style={{ borderTop: "none" }}>Paid Amount</th>
                    <th 
                      className="cursor-pointer" 
                      onClick={() => handleSort("amount")}
                      style={{ cursor: "pointer", borderTop: "none" }}
                    >
                      Due Amount
                      {sortField === "amount" && (
                        <span className="ms-1">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((quotation) => {
                    const invoice = getInvoiceByQuotationId(quotation.id);
                    const totalAmount = invoice ? Number(invoice.total_amount) : 0;
                    const paidAmount = invoice ? Number(invoice.paid_amount) : 0;
                    const dueAmount = totalAmount - paidAmount;
                    
                    // Skip fully paid invoices
                    if (dueAmount <= 0) return null;
                    
                    // Determine payment status
                    let paymentStatus = "Pending";
                    let statusVariant = "warning";
                    
                    if (paidAmount === 0) {
                      paymentStatus = "Unpaid";
                      statusVariant = "danger";
                    } else if (paidAmount > 0 && paidAmount < totalAmount) {
                      paymentStatus = "Partial";
                      statusVariant = "warning";
                    }
                    
                    return (
                      <tr key={quotation.id}>
                        <td>{quotation.jobID}</td>
                        <td>QID-{quotation.id}</td>
                        <td>
                          {quotation.job_description.length > 30
                            ? `${quotation.job_description.substring(0, 30)}...`
                            : quotation.job_description}
                        </td>
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
                        <td>{new Date(quotation.created_at).toLocaleDateString()}</td>
                        <td className="text-end">Rs.{totalAmount.toFixed(2)}</td>
                        <td className="text-end">Rs.{paidAmount.toFixed(2)}</td>
                        <td className="text-end">
                          <span className={`text-${statusVariant} fw-bold`}>
                            Rs.{dueAmount.toFixed(2)}
                          </span>
                          <Badge 
                            bg={statusVariant} 
                            className="ms-2 px-2"
                          >
                            {paymentStatus}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default CustomerPaymentDue;