import {
  Alert,
  Button,
  Card,
  Container,
  Spinner,
  Table,
  Row,
  Col,
  Badge,
  Form
} from "react-bootstrap";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import { 
  FaFileInvoiceDollar, 
  FaDownload, 
  FaSearch, 
  FaInfoCircle, 
  FaCalendarAlt, 
  FaMoneyBillWave,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaTag
} from "react-icons/fa";
import { BsCreditCard, BsCashCoin, BsCurrencyDollar } from "react-icons/bs";

const UserInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("created_at");
  const [sortDirection, setSortDirection] = useState("desc");
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalAmount: 0,
    paidInvoices: 0,
    pendingInvoices: 0
  });

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:4000/api/quotation/get_invoice",
        {
          headers: {
            token,
          },
        }
      );

      if (response.data.success) {
        const categorizedInvoices = response.data.invoices.reduce(
          (acc, invoice) => {
            if (!acc[invoice.invoice_id]) {
              acc[invoice.invoice_id] = {
                ...invoice,
                items: [],
              };
            }
            acc[invoice.invoice_id].items = invoice.items;
            return acc;
          },
          {}
        );

        const invoicesList = Object.values(categorizedInvoices);
        
        // Fetch job categories for all invoices in a more efficient way
        try {
          // Get all unique quotation IDs from invoices
          const quotationIds = [...new Set(invoicesList.map(invoice => invoice.quotation_id))];
          
          if (quotationIds.length > 0) {
            // Create a map to store quotation data
            const quotationMap = {};
            
            // Fetch quotation details one by one using the correct endpoint
            for (const quotationId of quotationIds) {
              try {
                const quotationResponse = await axios.get(
                  `http://localhost:4000/api/quotation/get_one/${quotationId}`,
                  {
                    headers: { token },
                  }
                );
                
                if (quotationResponse.data.success && quotationResponse.data.quotation) {
                  quotationMap[quotationId] = quotationResponse.data.quotation.job_category;
                }
              } catch (singleQuotationErr) {
                console.error(`Error fetching quotation ${quotationId}:`, singleQuotationErr);
                // Continue with other quotations
              }
            }
            
            // Assign job categories to invoices
            invoicesList.forEach(invoice => {
              if (invoice.quotation_id && quotationMap[invoice.quotation_id]) {
                invoice.job_category = quotationMap[invoice.quotation_id];
              }
            });
          }
        } catch (quotationErr) {
          console.error("Error in quotation fetching process:", quotationErr);
          // Continue with the invoices we have even if quotation fetch fails
        }
        
        setInvoices(invoicesList);
        
        // Calculate statistics
        const totalAmount = invoicesList.reduce((sum, invoice) => 
          sum + parseFloat(invoice.total_amount || 0), 0);
        
        const paidInvoices = invoicesList.filter(
          invoice => invoice.payment_status === "Paid"
        ).length;
        
        const pendingInvoices = invoicesList.filter(
          invoice => invoice.payment_status === "Pending"
        ).length;
        
        setStats({
          totalInvoices: invoicesList.length,
          totalAmount: totalAmount,
          paidInvoices: paidInvoices,
          pendingInvoices: pendingInvoices
        });
        
        setError("");
      } else {
        setError("Failed to fetch invoices. Please try again later.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = (invoice) => {
    const doc = new jsPDF();
    
    // Set fonts and styling
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(33, 37, 41);
    
    // Header
    doc.text("Jayalath Iron Works", 105, 20, { align: "center" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(108, 117, 125);
    doc.text("Mini Market, Malkaduwawa, Negombo RD, Kurunegala", 105, 28, { align: "center" });
    doc.text("Phone: 077-8882738", 105, 34, { align: "center" });
    
    // Add a horizontal line
    doc.setDrawColor(222, 226, 230);
    doc.setLineWidth(0.5);
    doc.line(20, 40, 190, 40);
    
    // Invoice details section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(33, 37, 41);
    doc.text("INVOICE", 20, 50);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Invoice #: ${invoice.invoice_id}`, 20, 60);
    doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`, 20, 68);
    // Add job category to the PDF if available
    if (invoice.job_category) {
      doc.text(`Category: ${invoice.job_category}`, 20, 76);
    }
    
    // Customer info section (if available in your data)
    if (invoice.customer_name) {
      doc.setFont("helvetica", "bold");
      doc.text("Customer:", 140, 60);
      doc.setFont("helvetica", "normal");
      doc.text(invoice.customer_name, 140, 68);
    }
    
    // Items table
    const tableStartY = 85; // Adjusted to accommodate for job category
    const tableHeaders = [["Item", "Quantity", "Unit Price (LKR)", "Amount (LKR)"]];
    
    const tableData = invoice.items.map((item) => [
      item.material_name,
      item.quantity.toString(),
      parseFloat(item.unit_price).toFixed(2),
      (parseFloat(item.quantity) * parseFloat(item.unit_price)).toFixed(2)
    ]);
    
    doc.autoTable({
      head: tableHeaders,
      body: tableData,
      startY: tableStartY,
      theme: 'grid',
      headStyles: { 
        fillColor: [79, 70, 229],
        textColor: 255,
        fontStyle: 'bold'
      },
      styles: {
        lineColor: [222, 226, 230],
        lineWidth: 0.1,
      },
      columnStyles: {
        0: { cellWidth: 80 },
        3: { halign: 'right' }
      }
    });
    
    // Summary section
    const finalY = doc.lastAutoTable.finalY + 10;
    
    // Subtotals and total
    const summaryX = 130;
    const valueX = 190;
    const lineSpacing = 8;
    
    doc.setFontSize(10);
    doc.setTextColor(108, 117, 125);
    doc.text("Subtotal:", summaryX, finalY, { align: "left" });
    doc.text(`LKR ${parseFloat(invoice.total_amount).toFixed(2)}`, valueX, finalY, { align: "right" });
    
    if (invoice.tax_amount) {
      doc.text("Tax:", summaryX, finalY + lineSpacing, { align: "left" });
      doc.text(`LKR ${parseFloat(invoice.tax_amount).toFixed(2)}`, valueX, finalY + lineSpacing, { align: "right" });
    }
    
    // Add a line before the total
    doc.setDrawColor(222, 226, 230);
    doc.line(summaryX, finalY + (2 * lineSpacing) - 3, valueX, finalY + (2 * lineSpacing) - 3);
    
    // Total
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(33, 37, 41);
    doc.text("Total:", summaryX, finalY + (2 * lineSpacing), { align: "left" });
    doc.text(`LKR ${parseFloat(invoice.total_amount).toFixed(2)}`, valueX, finalY + (2 * lineSpacing), { align: "right" });
    
    // Payment information
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Paid Amount: LKR ${parseFloat(invoice.paid_amount).toFixed(2)}`, summaryX, finalY + (3 * lineSpacing), { align: "left" });
    doc.text(`Payment Status: ${invoice.payment_status}`, summaryX, finalY + (4 * lineSpacing), { align: "left" });
    
    // Footer
    const footerY = finalY + (6 * lineSpacing);
    doc.setDrawColor(222, 226, 230);
    doc.line(20, footerY, 190, footerY);
    
    doc.setFontSize(10);
    doc.setTextColor(108, 117, 125);
    doc.text("Thank you for your business!", 105, footerY + 8, { align: "center" });
    doc.text("All services rendered are non-refundable", 105, footerY + 16, { align: "center" });
    
    // Save the PDF
    doc.save(`Invoice_${invoice.invoice_id}.pdf`);
  };

  // Filter and sort invoices
  const getFilteredData = () => {
    return invoices
      .filter((invoice) => {
        // Search functionality
        const searchLower = searchTerm.toLowerCase();
        return (
          searchTerm === "" ||
          invoice.invoice_id?.toLowerCase().includes(searchLower) ||
          invoice.payment_status?.toLowerCase().includes(searchLower) ||
          invoice.job_category?.toLowerCase().includes(searchLower) || // Added job category to search
          invoice.items.some(item => 
            item.material_name?.toLowerCase().includes(searchLower)
          )
        );
      })
      .sort((a, b) => {
        // Handle sorting
        if (sortField === "created_at") {
          return sortDirection === "asc"
            ? new Date(a.created_at) - new Date(b.created_at)
            : new Date(b.created_at) - new Date(a.created_at);
        }
        
        if (sortField === "total_amount") {
          const amountA = parseFloat(a.total_amount || 0);
          const amountB = parseFloat(b.total_amount || 0);
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

  // Function to get payment status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case "Paid":
        return (
          <Badge bg="success" className="px-3 py-2 d-flex align-items-center">
            <FaCheckCircle className="me-1" size={12} /> {status}
          </Badge>
        );
      case "Pending":
        return (
          <Badge bg="warning" className="px-3 py-2 d-flex align-items-center">
            <FaClock className="me-1" size={12} /> {status}
          </Badge>
        );
      case "Cancelled":
        return (
          <Badge bg="danger" className="px-3 py-2 d-flex align-items-center">
            <FaTimesCircle className="me-1" size={12} /> {status}
          </Badge>
        );
      default:
        return (
          <Badge bg="secondary" className="px-3 py-2">
            {status}
          </Badge>
        );
    }
  };

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

  const filteredData = getFilteredData();

  return (
    <div className="leftpart2">
      <Card className="shadow-sm mb-4 border-0">
        <Card.Body className="px-4 py-4">
          <Card.Title as="h2" className="mb-4" style={{ color: "#1a2142", fontWeight: 600 }}>
            Invoice Management
          </Card.Title>
          
          {/* Summary cards */}
          <Row className="mb-4 g-3">
            {/* Total Invoices */}
            <Col md={3}>
              <Card className="border-0 shadow-sm bg-light h-100">
                <Card.Body className="d-flex align-items-center">
                  <div className="rounded-circle me-3 d-flex justify-content-center align-items-center" 
                       style={{ 
                         backgroundColor: "#e3f2fd", 
                         width: "50px", 
                         height: "50px" 
                       }}>
                    <FaFileInvoiceDollar size={24} style={{ color: "#1976d2" }} />
                  </div>
                  <div>
                    <Card.Title className="mb-1 h6">Total Invoices</Card.Title>
                    <h3 className="mb-0 text-primary">{stats.totalInvoices}</h3>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            {/* Total Amount */}
            <Col md={3}>
              <Card className="border-0 shadow-sm bg-light h-100">
                <Card.Body className="d-flex align-items-center">
                  <div className="rounded-circle me-3 d-flex justify-content-center align-items-center" 
                       style={{ 
                         backgroundColor: "#e8f5e9", 
                         width: "50px", 
                         height: "50px" 
                       }}>
                    <BsCurrencyDollar size={24} style={{ color: "#388e3c" }} />
                  </div>
                  <div>
                    <Card.Title className="mb-1 h6">Total Amount</Card.Title>
                    <h3 className="mb-0 text-success">LKR {stats.totalAmount.toFixed(2)}</h3>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            {/* Paid Invoices */}
            <Col md={3}>
              <Card className="border-0 shadow-sm bg-light h-100">
                <Card.Body className="d-flex align-items-center">
                  <div className="rounded-circle me-3 d-flex justify-content-center align-items-center" 
                       style={{ 
                         backgroundColor: "#e8f5e9", 
                         width: "50px", 
                         height: "50px" 
                       }}>
                    <BsCashCoin size={22} style={{ color: "#388e3c" }} />
                  </div>
                  <div>
                    <Card.Title className="mb-1 h6">Paid Invoices</Card.Title>
                    <h3 className="mb-0 text-success">{stats.paidInvoices}</h3>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            {/* Pending Invoices */}
            <Col md={3}>
              <Card className="border-0 shadow-sm bg-light h-100">
                <Card.Body className="d-flex align-items-center">
                  <div className="rounded-circle me-3 d-flex justify-content-center align-items-center" 
                       style={{ 
                         backgroundColor: "#fff8e1", 
                         width: "50px", 
                         height: "50px" 
                       }}>
                    <FaMoneyBillWave size={20} style={{ color: "#f57c00" }} />
                  </div>
                  <div>
                    <Card.Title className="mb-1 h6">Pending Invoices</Card.Title>
                    <h3 className="mb-0 text-warning">{stats.pendingInvoices}</h3>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Error message */}
          {error && (
            <Alert variant="danger" className="mb-4 d-flex align-items-center">
              <FaInfoCircle className="me-2" />
              <div>{error}</div>
            </Alert>
          )}

          {/* Invoice list */}
          {filteredData.length === 0 ? (
            <Alert variant="info" className="border-0 shadow-sm">
              <div className="text-center py-4">
                <FaInfoCircle size={32} className="mb-3 text-info" />
                <h5>No invoices found</h5>
                <p className="mb-0 text-muted">
                  {searchTerm ? "No invoices match your search criteria." : "You don't have any invoices yet."}
                </p>
              </div>
            </Alert>
          ) : (
            <div className="row">
              {filteredData.map((invoice) => (
                <div className="col-lg-6 mb-4" key={invoice.invoice_id}>
                  <Card className="h-100 shadow-sm border-0">
                    <Card.Header className="bg-white py-3 border-bottom" style={{ borderBottomColor: "#f1f5f9" }}>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <div className="d-flex align-items-center">
                            <FaFileInvoiceDollar className="text-primary me-2" size={18} />
                            <h5 className="mb-0" style={{ color: "#1a2142", fontWeight: 600 }}>
                              Invoice #{invoice.invoice_id}
                            </h5>
                          </div>
                          {/* Add job category below invoice number */}
                          {invoice.job_category && (
                            <div className="d-flex align-items-center mt-1 ms-1">
                              <FaTag className="text-muted me-1" size={12} />
                              <small className="text-muted">{invoice.job_category}</small>
                            </div>
                          )}
                        </div>
                        {getStatusBadge(invoice.payment_status)}
                      </div>
                    </Card.Header>
                    
                    <Card.Body className="p-3">
                      <div className="mb-3 d-flex justify-content-between">
                        <span className="text-muted d-flex align-items-center">
                          <FaCalendarAlt className="me-2" size={14} />
                          {new Date(invoice.created_at).toLocaleDateString()}
                        </span>
                        <span className="fw-bold">
                          LKR {parseFloat(invoice.total_amount).toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="table-responsive mb-3">
                        <Table size="sm" bordered className="mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>Item</th>
                              <th style={{ width: "60px" }}>Qty</th>
                              <th style={{ width: "100px" }}>Price (LKR)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {invoice.items.map((item, index) => (
                              <tr key={index}>
                                <td className="align-middle">{item.material_name}</td>
                                <td className="text-center align-middle">{item.quantity}</td>
                                <td className="text-end align-middle">{parseFloat(item.unit_price).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                      
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted">Total Amount:</span>
                        <span className="fw-medium">LKR {parseFloat(invoice.total_amount).toFixed(2)}</span>
                      </div>
                      
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted">Paid Amount:</span>
                        <span className="fw-medium">LKR {parseFloat(invoice.paid_amount).toFixed(2)}</span>
                      </div>
                      
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Balance:</span>
                        <span className="fw-medium">
                          LKR {(parseFloat(invoice.total_amount) - parseFloat(invoice.paid_amount)).toFixed(2)}
                        </span>
                      </div>
                    </Card.Body>
                    
                    <Card.Footer className="bg-white py-3 border-top" style={{ borderTopColor: "#f1f5f9" }}>
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-100 d-flex align-items-center justify-content-center"
                        onClick={() => downloadInvoice(invoice)}
                        style={{ backgroundColor: "#4F46E5", borderColor: "#4F46E5" }}
                      >
                        <FaDownload className="me-2" />
                        Download Invoice
                      </Button>
                    </Card.Footer>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default UserInvoices;