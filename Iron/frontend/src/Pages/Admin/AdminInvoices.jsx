import "bootstrap/dist/css/bootstrap.min.css";
import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { 
  Alert, 
  Spinner, 
  Table, 
  Badge, 
  Card, 
  Form,
  Modal,
  Button,
  Tab,
  Tabs
} from "react-bootstrap";
import { 
  ArrowClockwise, 
  FilePdf, 
  Printer, 
  Search, 
  CreditCard, 
  Eye 
} from "react-bootstrap-icons";

const AdminInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [updateAmount, setUpdateAmount] = useState("");
  const [isViewing, setIsViewing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [refreshingData, setRefreshingData] = useState(false);
  const [lastDataRefresh, setLastDataRefresh] = useState(Date.now());
  const [error, setError] = useState("");
  const printRef = useRef();

  // Enhanced print function
  const handlePrint = () => {
    if (!printRef.current) return;
    const printContents = printRef.current.innerHTML;
    const printWindow = window.open("", "", "width=900,height=700");
    const now = new Date();
    const formattedDate = now
      .toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      .replace(",", "");

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice Print</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
          <style>
            .print-header {
              border: 2px solid #1a2142;
              border-bottom: none;
              padding: 16px 0;
              text-align: center;
              font-size: 2rem;
              font-weight: bold;
              color: #1a2142;
              margin-bottom: 0;
            }
            .print-body {
              border-left: 2px solid #1a2142;
              border-right: 2px solid #1a2142;
              padding: 24px;
            }
            .print-footer {
              border: 2px solid #1a2142;
              border-top: none;
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 1rem;
              padding: 8px 24px;
              color: #555;
              margin-top: 0;
            }
            @media print {
              body { margin: 0; }
              .print-header, .print-footer { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="print-header">Jayalath Iron Works</div>
          <div class="print-body">
            ${printContents}
          </div>
          <div class="print-footer">
            <div>Generated: ${formattedDate}</div>
            <div>www.jayalathironworks.com</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // PDF export function
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Jayalath Iron Works - Invoice List", 14, 16);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString("en-US")}`, 14, 23);

    const columns = [
      { header: "Invoice ID", dataKey: "invoice_id" },
      { header: "Customer Name", dataKey: "customer_name" },
      { header: "Total Amount (LKR)", dataKey: "total_amount" },
      { header: "Paid Amount (LKR)", dataKey: "paid_amount" },
      { header: "Payment Status", dataKey: "payment_status" },
    ];
    const rows = filteredInvoices.map((inv) => ({
      invoice_id: inv.invoice_id,
      customer_name: inv.customer_name,
      total_amount: parseFloat(inv.total_amount).toFixed(2),
      paid_amount: parseFloat(inv.paid_amount).toFixed(2),
      payment_status: inv.payment_status,
    }));

    doc.autoTable({
      columns,
      body: rows,
      startY: 28,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [26, 33, 66] },
    });

    doc.save("invoices.pdf");
  };

  // Implement data fetching as a memoized function for reuse (similar to JobManagement)
  const fetchAllData = useCallback(async (showLoadingState = true) => {
    try {
      if (showLoadingState) {
        setLoading(true);
      } else {
        setRefreshingData(true);
      }
      
      setError("");

      const res = await axios.get(
        "http://localhost:4000/api/quotation/get_all"
      );
      
      setInvoices(res.data.invoices);
      setLastDataRefresh(Date.now());
      
      return res.data.invoices;
    } catch (err) {
      console.error("Error fetching invoices:", err);
      setError(
        "Error fetching invoices: " + (err.response?.data?.message || err.message)
      );
      return null;
    } finally {
      if (showLoadingState) {
        setLoading(false);
      } else {
        setRefreshingData(false);
      }
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Add a manual refresh function
  const handleManualRefresh = async () => {
    setError("");
    await fetchAllData(false);
  };

  const viewInvoice = async (customerId, invoiceId) => {
    try {
      const res = await axios.post(
        "http://localhost:4000/api/quotation/get_invoice2",
        { userId: customerId, invoiceId: invoiceId }
      );
      setSelectedInvoice(res.data.invoices[0]);
      setIsViewing(true);
    } catch (err) {
      console.error("Error fetching invoice details:", err);
      setError("Error fetching invoice details: " + err.message);
    }
  };

  const updatePayment = async (invoiceId) => {
    if (!updateAmount || parseFloat(updateAmount) <= 0) {
      setErrorMessage("Please enter a valid payment amount greater than zero.");
      return;
    }

    const totalAmount = parseFloat(selectedInvoice.total_amount);
    const currentPaidAmount = parseFloat(selectedInvoice.paid_amount);
    const paymentToAdd = parseFloat(updateAmount);

    if (paymentToAdd + currentPaidAmount > totalAmount) {
      setErrorMessage("Payment cannot exceed total amount.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const res = await axios.post(
        "http://localhost:4000/api/quotation/invoice_payment",
        {
          invoiceId,
          paymentAmount: updateAmount,
        }
      );

      if (res.data.success) {
        alert(res.data.message || "Payment updated successfully");
        const updatedInvoices = invoices.map((invoice) =>
          invoice.invoice_id === invoiceId
            ? {
                ...invoice,
                paid_amount:
                  res.data.newPaidAmount || (currentPaidAmount + paymentToAdd),
                payment_status:
                  res.data.paymentStatus ||
                  (currentPaidAmount + paymentToAdd >= totalAmount
                    ? "Completed"
                    : "Partially Paid"),
              }
            : invoice
        );
        setInvoices(updatedInvoices);
        setSelectedInvoice(null);
      } else {
        setErrorMessage(res.data.message || "Failed to update payment");
      }
    } catch (err) {
      console.error("Error updating payment:", err);
      setErrorMessage("Error connecting to server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter invoices based on search and tab
  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch = Object.values(invoice)
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase());
      
    if (activeTab === "completed") {
      return matchesSearch && 
        (invoice.payment_status === "Completed" || invoice.payment_status === "Paid");
    } else if (activeTab === "pending") {
      return matchesSearch && 
        (invoice.payment_status === "Pending" || invoice.payment_status === "Partially Paid");
    } else {
      // "all" tab
      return matchesSearch;
    }
  });

  // Get total statistics
  const getTotalStats = () => {
    let total = 0;
    let paid = 0;
    let remaining = 0;
    
    invoices.forEach(invoice => {
      total += parseFloat(invoice.total_amount || 0);
      paid += parseFloat(invoice.paid_amount || 0);
    });
    
    remaining = total - paid;
    
    return {
      total: total.toFixed(2),
      paid: paid.toFixed(2),
      remaining: remaining.toFixed(2),
      count: invoices.length,
      completed: invoices.filter(i => 
        i.payment_status === "Completed" || i.payment_status === "Paid"
      ).length
    };
  };

  const stats = getTotalStats();

  return (
    <div className="leftpart">
      <div className="container mt-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 style={{ color: "#1a2142", fontWeight: 600 }}>Invoice Management</h2>

          {/* Add refresh button */}
          <Button
            variant="outline-primary"
            onClick={handleManualRefresh}
            disabled={refreshingData}
            className="d-flex align-items-center"
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
                Refresh Data
              </>
            )}
          </Button>
        </div>

        {error && (
          <Alert variant="danger" onClose={() => setError("")} dismissible>
            {error}
          </Alert>
        )}

        {/* Summary Cards */}
        <div className="row mb-4">
          <div className="col-md-3">
            <Card className="h-100 shadow-sm">
              <Card.Body className="d-flex flex-column align-items-center justify-content-center">
                <h3 className="text-primary mb-0">{stats.count}</h3>
                <p className="text-muted mb-0">Total Invoices</p>
              </Card.Body>
            </Card>
          </div>
          <div className="col-md-3">
            <Card className="h-100 shadow-sm">
              <Card.Body className="d-flex flex-column align-items-center justify-content-center">
                <h3 className="text-success mb-0">LKR {stats.total}</h3>
                <p className="text-muted mb-0">Total Amount</p>
              </Card.Body>
            </Card>
          </div>
          <div className="col-md-3">
            <Card className="h-100 shadow-sm">
              <Card.Body className="d-flex flex-column align-items-center justify-content-center">
                <h3 className="text-info mb-0">LKR {stats.paid}</h3>
                <p className="text-muted mb-0">Total Paid</p>
              </Card.Body>
            </Card>
          </div>
          <div className="col-md-3">
            <Card className="h-100 shadow-sm">
              <Card.Body className="d-flex flex-column align-items-center justify-content-center">
                <h3 className="text-danger mb-0">LKR {stats.remaining}</h3>
                <p className="text-muted mb-0">Total Outstanding</p>
              </Card.Body>
            </Card>
          </div>
        </div>

        {/* Search and Export Controls */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center w-50">
            <div className="input-group">
              <span className="input-group-text bg-white">
                <Search />
              </span>
              <Form.Control
                type="text"
                placeholder="Search invoices..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Button
              variant="outline-danger"
              onClick={handleExportPDF}
              disabled={filteredInvoices.length === 0}
              className="d-flex align-items-center"
            >
              <FilePdf className="me-2" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Tabs for filtering */}
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="mb-3"
        >
          <Tab eventKey="all" title={`All (${invoices.length})`} />
          <Tab 
            eventKey="pending" 
            title={`Pending (${invoices.filter(i => 
              i.payment_status === "Pending" || i.payment_status === "Partially Paid"
            ).length})`} 
          />
          <Tab 
            eventKey="completed" 
            title={`Completed (${stats.completed})`} 
          />
        </Tabs>

        {loading ? (
          <div className="d-flex justify-content-center my-5">
            <Spinner animation="border" variant="primary" />
            <span className="ms-3">Loading invoice data...</span>
          </div>
        ) : (
          <>
            {filteredInvoices.length === 0 ? (
              <Alert variant="info">No invoices found matching your criteria.</Alert>
            ) : (
              <div className="table-responsive">
                <Table striped bordered hover responsive className="mt-3 shadow-sm">
                  <thead style={{ backgroundColor: "#f8fafc" }}>
                    <tr>
                      <th>Invoice ID</th>
                      <th>Customer Name</th>
                      <th>Total Amount (LKR)</th>
                      <th>Paid Amount (LKR)</th>
                      <th>Remaining (LKR)</th>
                      <th>Payment Status</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((invoice) => {
                      const remaining = (
                        parseFloat(invoice.total_amount) - 
                        parseFloat(invoice.paid_amount)
                      ).toFixed(2);
                      
                      return (
                        <tr key={invoice.invoice_id}>
                          <td>{invoice.invoice_id}</td>
                          <td>{invoice.customer_name}</td>
                          <td>{parseFloat(invoice.total_amount).toFixed(2)}</td>
                          <td>{parseFloat(invoice.paid_amount).toFixed(2)}</td>
                          <td>{remaining}</td>
                          <td>
                            <Badge
                              bg={
                                invoice.payment_status === "Completed" ||
                                invoice.payment_status === "Paid"
                                  ? "success"
                                  : invoice.payment_status === "Partially Paid"
                                  ? "warning"
                                  : "secondary"
                              }
                            >
                              {invoice.payment_status}
                            </Badge>
                          </td>
                          <td className="text-center">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() =>
                                viewInvoice(invoice.customer_id, invoice.invoice_id)
                              }
                              className="me-2"
                              style={{
                                backgroundColor: "#1a2142",
                                borderColor: "#1a2142",
                              }}
                            >
                              <Eye className="me-1" /> View
                            </Button>
                            <Button
                              variant={
                                invoice.payment_status === "Completed" ||
                                invoice.payment_status === "Paid"
                                  ? "secondary"
                                  : "success"
                              }
                              size="sm"
                              onClick={() => {
                                if (
                                  invoice.payment_status !== "Completed" &&
                                  invoice.payment_status !== "Paid"
                                ) {
                                  setSelectedInvoice(invoice);
                                  setUpdateAmount("");
                                  setIsViewing(false);
                                  setErrorMessage("");
                                }
                              }}
                              disabled={
                                invoice.payment_status === "Completed" ||
                                invoice.payment_status === "Paid"
                              }
                            >
                              <CreditCard className="me-1" />
                              {invoice.payment_status === "Completed" ||
                              invoice.payment_status === "Paid"
                                ? "Paid"
                                : "Update Payment"}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            )}
          </>
        )}

        {/* View Invoice Modal */}
        <Modal
          show={selectedInvoice && isViewing}
          onHide={() => setSelectedInvoice(null)}
          size="lg"
          dialogClassName="invoice-view-modal"
        >
          <Modal.Header closeButton className="bg-light">
            <Modal.Title>
              Invoice Details{" "}
              <span className="text-muted fs-6">
                #{selectedInvoice?.invoice_id}
              </span>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div ref={printRef}>
              <div className="row mb-4">
                <div className="col-md-6">
                  <Card className="h-100 shadow-sm">
                    <Card.Body>
                      <h5 className="border-bottom pb-2 mb-3">Customer Information</h5>
                      <p className="mb-2">
                        <strong>Invoice ID:</strong> {selectedInvoice?.invoice_id}
                      </p>
                      <p className="mb-2">
                        <strong>Customer:</strong>{" "}
                        {selectedInvoice?.customer_name ||
                          selectedInvoice?.customer_id}
                      </p>
                    </Card.Body>
                  </Card>
                </div>
                <div className="col-md-6">
                  <Card className="h-100 shadow-sm">
                    <Card.Body>
                      <h5 className="border-bottom pb-2 mb-3">Payment Summary</h5>
                      <p className="mb-2">
                        <strong>Total Amount:</strong> LKR{" "}
                        {selectedInvoice && parseFloat(selectedInvoice.total_amount).toFixed(2)}
                      </p>
                      <p className="mb-2">
                        <strong>Paid Amount:</strong> LKR{" "}
                        {selectedInvoice && parseFloat(selectedInvoice.paid_amount).toFixed(2)}
                      </p>
                      <p className="mb-2">
                        <strong>Remaining:</strong> LKR{" "}
                        {selectedInvoice && (
                          parseFloat(selectedInvoice.total_amount) -
                          parseFloat(selectedInvoice.paid_amount)
                        ).toFixed(2)}
                      </p>
                      <p className="mb-0">
                        <strong>Payment Status:</strong>{" "}
                        <Badge
                          bg={
                            selectedInvoice?.payment_status === "Completed" ||
                            selectedInvoice?.payment_status === "Paid"
                              ? "success"
                              : selectedInvoice?.payment_status === "Partially Paid"
                              ? "warning"
                              : "secondary"
                          }
                        >
                          {selectedInvoice?.payment_status}
                        </Badge>
                      </p>
                    </Card.Body>
                  </Card>
                </div>
              </div>

              <Card className="shadow-sm mb-4">
                <Card.Body>
                  <h5 className="border-bottom pb-2 mb-3">Invoice Items</h5>
                  <Table striped bordered responsive className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Material</th>
                        <th>Quantity</th>
                        <th>Unit Price (LKR)</th>
                        <th>Subtotal (LKR)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice?.items?.map((item, index) => (
                        <tr key={index}>
                          <td>{item.material_name}</td>
                          <td>{item.quantity}</td>
                          <td>{parseFloat(item.unit_price).toFixed(2)}</td>
                          <td>{(item.quantity * item.unit_price).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="3" className="text-end">
                          <strong>Total:</strong>
                        </td>
                        <td>
                          <strong>
                            {selectedInvoice && parseFloat(selectedInvoice.total_amount).toFixed(2)}
                          </strong>
                        </td>
                      </tr>
                    </tfoot>
                  </Table>
                </Card.Body>
              </Card>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setSelectedInvoice(null)}
            >
              Close
            </Button>
            <Button
              variant="outline-primary"
              onClick={handlePrint}
              className="d-flex align-items-center"
            >
              <Printer className="me-2" />
              Print Invoice
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Update Payment Modal */}
        <Modal
          show={selectedInvoice && !isViewing}
          onHide={() => {
            setSelectedInvoice(null);
            setErrorMessage("");
          }}
          centered
        >
          <Modal.Header closeButton className="bg-light">
            <Modal.Title>Update Payment</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Card className="shadow-sm mb-4">
              <Card.Body>
                <h5 className="border-bottom pb-2 mb-3">Invoice Summary</h5>
                <p className="mb-2">
                  <strong>Invoice ID:</strong> {selectedInvoice?.invoice_id}
                </p>
                <p className="mb-2">
                  <strong>Customer:</strong>{" "}
                  {selectedInvoice?.customer_name ||
                    selectedInvoice?.customer_id}
                </p>
                <p className="mb-2">
                  <strong>Total Amount:</strong> LKR{" "}
                  {selectedInvoice && parseFloat(selectedInvoice.total_amount).toFixed(2)}
                </p>
                <p className="mb-2">
                  <strong>Current Paid Amount:</strong> LKR{" "}
                  {selectedInvoice && parseFloat(selectedInvoice.paid_amount).toFixed(2)}
                </p>
                <p className="mb-2">
                  <strong>Remaining Amount:</strong>{" "}
                  <span className="text-danger fw-bold">
                    LKR{" "}
                    {selectedInvoice && (
                      parseFloat(selectedInvoice.total_amount) -
                      parseFloat(selectedInvoice.paid_amount)
                    ).toFixed(2)}
                  </span>
                </p>
              </Card.Body>
            </Card>

            <Form.Group className="mb-3">
              <Form.Label htmlFor="paymentAmount" className="form-label fw-bold">
                Payment Amount (LKR)
              </Form.Label>
              <Form.Control
                id="paymentAmount"
                type="number"
                value={updateAmount}
                onChange={(e) => setUpdateAmount(e.target.value)}
                placeholder="Enter payment amount"
                min="0.01"
                step="0.01"
                max={
                  selectedInvoice && (
                    parseFloat(selectedInvoice.total_amount) -
                    parseFloat(selectedInvoice.paid_amount)
                  )
                }
              />
              {errorMessage && (
                <Alert variant="danger" className="mt-2 py-2">
                  {errorMessage}
                </Alert>
              )}
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => {
                setSelectedInvoice(null);
                setErrorMessage("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="success"
              onClick={() => selectedInvoice && updatePayment(selectedInvoice.invoice_id)}
              disabled={
                isSubmitting ||
                !updateAmount ||
                parseFloat(updateAmount) <= 0
              }
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
                  Processing...
                </>
              ) : (
                "Update Payment"
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
};

export default AdminInvoices;