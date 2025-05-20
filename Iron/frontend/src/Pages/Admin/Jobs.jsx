import {
  Alert,
  Badge,
  Button,
  Card,
  Form,
  Modal,
  Spinner,
  Table,
  ProgressBar
} from "react-bootstrap";
import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import {
  ArrowClockwise,
  Calendar2Check,
  Tools,
  PencilSquare,
  ThermometerHalf,
  CheckCircleFill,
  XCircleFill,
  ClockHistory,
  PeopleFill,
  CurrencyDollar,
  Search,
  ExclamationTriangleFill,
  FileEarmarkPdf,
  Download
} from "react-bootstrap-icons";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const JobManagement = () => {
  const [partiallyPaidInvoices, setPartiallyPaidInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [actualStartDate, setActualStartDate] = useState("");
  const [jobStatus, setJobStatus] = useState("In Progress");
  const [existingJob, setExistingJob] = useState(null);
  const [refreshingData, setRefreshingData] = useState(false);
  const [lastDataRefresh, setLastDataRefresh] = useState(Date.now());
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'not-started', 'in-progress', 'completed', 'expire-soon'
  const [search, setSearch] = useState("");
  const [generatingPdf, setGeneratingPdf] = useState(false);
  
  // Ref for the table to be captured for PDF
  const tableRef = useRef(null);

  // Enhanced data fetching as a memoized function for reuse
  const fetchAllData = useCallback(async (showLoadingState = true) => {
    try {
      if (showLoadingState) {
        setLoading(true);
      } else {
        setRefreshingData(true);
      }
      
      setError("");
      
      // Get invoices with status "Partially Paid"
      const response = await axios.get(
        "http://localhost:4000/api/quotation/get_partially_paid_invoices"
      );
      
      console.log("Fetched invoices:", response.data.invoices);
      setPartiallyPaidInvoices(response.data.invoices);
      setLastDataRefresh(Date.now());
      
      return response.data.invoices;
    } catch (err) {
      console.error("Error fetching partially paid invoices:", err);
      setError("Error fetching invoices: " + (err.response?.data?.message || err.message));
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

  // Manual refresh function
  const handleManualRefresh = async () => {
    setError("");
    await fetchAllData(false);
  };

  // Open modal to update/create job with enhanced UX
  const handleOpenModal = (invoice) => {
    setSelectedInvoice(invoice);
    
    // Default to today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Set existing job data if available
    if (invoice.existingJob) {
      setExistingJob(invoice.existingJob);
      setActualStartDate(invoice.existingJob.start_date ? invoice.existingJob.start_date.split(' ')[0] : today);
      setJobStatus(invoice.existingJob.status || "In Progress");
    } else {
      setExistingJob(null);
      setActualStartDate(today);
      setJobStatus("In Progress");
    }
    
    console.log("Opening modal with invoice:", invoice);
    setShowModal(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedInvoice(null);
    setExistingJob(null);
  };

  // Add submitError and isSubmitting as component state variables
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle job creation/update with loading state
  const handleCreateOrUpdateJob = async () => {
    if (!selectedInvoice) return;
    
    try {
      setIsSubmitting(true);
      setSubmitError("");
      
      console.log("Creating/updating job with data:", {
        quotationId: selectedInvoice.quotation_id,
        invoiceId: selectedInvoice.id,
        jobName: selectedInvoice.job_description || `Job for Invoice #${selectedInvoice.id}`,
        jobCategory: selectedInvoice.job_category || "",
        actualStartDate: actualStartDate,
        status: jobStatus,
        customerId: selectedInvoice.customer_id,
        quotationAmount: selectedInvoice.total_amount,
        jobID: selectedInvoice.jobID || `JID${Math.floor(Math.random() * 10000)}`
      });
      
      // Create or update job
      const response = await axios.post(
        "http://localhost:4000/api/quotation/create_or_update_job",
        {
          quotationId: selectedInvoice.quotation_id,
          invoiceId: selectedInvoice.id,
          jobName: selectedInvoice.job_description || `Job for Invoice #${selectedInvoice.id}`,
          jobCategory: selectedInvoice.job_category || "",
          actualStartDate: actualStartDate,
          status: jobStatus,
          customerId: selectedInvoice.customer_id,
          quotationAmount: selectedInvoice.total_amount,
          jobID: selectedInvoice.jobID || `JID${Math.floor(Math.random() * 10000)}`
        }
      );
      
      if (response.data.success) {
        // Update our local state to show job has been created/updated
        setPartiallyPaidInvoices(
          partiallyPaidInvoices.map((inv) => {
            if (inv.id === selectedInvoice.id) {
              return { 
                ...inv, 
                existingJob: {
                  id: response.data.jobId,
                  start_date: actualStartDate,
                  finish_date: inv.immediate || null,
                  status: jobStatus
                }
              };
            }
            return inv;
          })
        );
        
        // Show success message
        alert("Job created/updated successfully!");
        handleCloseModal(); // Close the modal
      }
    } catch (err) {
      console.error("Error creating/updating job:", err);
      setSubmitError("Error creating/updating job: " + (err.response?.data?.message || err.message));
      setError("Error creating/updating job: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    
    try {
      // Use UTC date to avoid timezone issues
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        timeZone: 'UTC'
      });
    } catch (err) {
      console.error("Error formatting date:", err);
      return "Invalid date";
    }
  };
  
  // Helper function to check if a job is expiring soon (within 7 days of required date)
  const isExpiringSoon = (invoice) => {
    if (!invoice.immediate) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const requiredDate = new Date(invoice.immediate);
    requiredDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((requiredDate - today) / (1000 * 60 * 60 * 24));
    
    // Job is expiring soon if the required date is within the next 7 days
    return diffDays >= 0 && diffDays <= 7;
  };
  
  // Get job statistics
  const getJobStats = () => {
    const total = partiallyPaidInvoices.length;
    const started = partiallyPaidInvoices.filter(invoice => invoice.existingJob).length;
    const inProgress = partiallyPaidInvoices.filter(
      invoice => invoice.existingJob && invoice.existingJob.status === "In Progress"
    ).length;
    const completed = partiallyPaidInvoices.filter(
      invoice => invoice.existingJob && invoice.existingJob.status === "Completed"
    ).length;
    const expiringSoon = partiallyPaidInvoices.filter(isExpiringSoon).length;
    
    // Calculate total amount and paid amount
    let totalAmount = 0;
    let paidAmount = 0;
    
    partiallyPaidInvoices.forEach(invoice => {
      totalAmount += parseFloat(invoice.total_amount || 0);
      paidAmount += parseFloat(invoice.paid_amount || 0);
    });
    
    return {
      total,
      started,
      notStarted: total - started,
      inProgress,
      completed,
      expiringSoon,
      totalAmount: totalAmount.toFixed(2),
      paidAmount: paidAmount.toFixed(2),
      remainingAmount: (totalAmount - paidAmount).toFixed(2),
      paymentPercentage: totalAmount > 0 ? ((paidAmount / totalAmount) * 100).toFixed(0) : 0
    };
  };
  
  // Get filtered invoices based on search and active tab
  const getFilteredInvoices = () => {
    return partiallyPaidInvoices.filter(invoice => {
      // Search filter
      const matchesSearch = 
        (invoice.id?.toString() || "").includes(search) ||
        (invoice.job_description || "").toLowerCase().includes(search.toLowerCase()) ||
        (invoice.customer_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (invoice.jobID || "").toLowerCase().includes(search.toLowerCase());
      
      // Tab filter
      if (activeTab === "not-started") {
        return matchesSearch && !invoice.existingJob;
      } else if (activeTab === "in-progress") {
        return matchesSearch && invoice.existingJob && 
               invoice.existingJob.status !== "Completed" && 
               invoice.existingJob.status !== "Cancelled";
      } else if (activeTab === "completed") {
        return matchesSearch && invoice.existingJob && 
               (invoice.existingJob.status === "Completed" || 
                invoice.existingJob.status === "Delivered");
      } else if (activeTab === "expire-soon") {
        return matchesSearch && isExpiringSoon(invoice);
      } else {
        // 'all' tab
        return matchesSearch;
      }
    });
  };
  
  // Get tab title for PDF based on active tab
  const getTabTitle = () => {
    switch (activeTab) {
      case "not-started":
        return "Not Started Jobs";
      case "in-progress":
        return "In Progress Jobs";
      case "completed":
        return "Completed Jobs";
      case "expire-soon":
        return "Jobs Expiring Soon";
      default:
        return "All Jobs";
    }
  };
  
  // Function to generate and download PDF
  const generatePDF = async () => {
    if (!tableRef.current) return;
    
    setGeneratingPdf(true);
    
    try {
      // Create a new jsPDF instance
      const pdf = new jsPDF('landscape', 'pt', 'a4');
      
      // Get the current date for the report
      const currentDate = new Date().toLocaleDateString();
      
      // Get tab title
      const tabTitle = getTabTitle();
      const stats = getJobStats();
      
      // Set PDF title and metadata
      pdf.setProperties({
        title: `${tabTitle} Report - ${currentDate}`,
        author: 'Job Management System',
        creator: 'Job Management System',
      });
      
      // Add report title
      pdf.setFontSize(18);
      pdf.text(`${tabTitle} Report`, 40, 40);
      
      // Add report date
      pdf.setFontSize(12);
      pdf.text(`Generated on: ${currentDate}`, 40, 60);
      
      // Add key statistics
      pdf.setFontSize(12);
      pdf.text('Report Summary:', 40, 80);
      
      let yPosition = 100;
      const xPosition = 40;
      
      // Add different stats based on active tab
      if (activeTab === 'all') {
        pdf.text(`Total Jobs: ${stats.total}`, xPosition, yPosition);
        yPosition += 20;
        pdf.text(`Started Jobs: ${stats.started}`, xPosition, yPosition);
        yPosition += 20;
        pdf.text(`Not Started Jobs: ${stats.notStarted}`, xPosition, yPosition);
        yPosition += 20;
        pdf.text(`In Progress Jobs: ${stats.inProgress}`, xPosition, yPosition);
        yPosition += 20;
        pdf.text(`Completed Jobs: ${stats.completed}`, xPosition, yPosition);
        yPosition += 20;
        pdf.text(`Jobs Expiring Soon: ${stats.expiringSoon}`, xPosition, yPosition);
      } else if (activeTab === 'not-started') {
        pdf.text(`Total Not Started Jobs: ${stats.notStarted}`, xPosition, yPosition);
      } else if (activeTab === 'in-progress') {
        pdf.text(`Total In Progress Jobs: ${stats.inProgress}`, xPosition, yPosition);
      } else if (activeTab === 'completed') {
        pdf.text(`Total Completed Jobs: ${stats.completed}`, xPosition, yPosition);
      } else if (activeTab === 'expire-soon') {
        pdf.text(`Total Jobs Expiring Soon: ${stats.expiringSoon}`, xPosition, yPosition);
      }
      
      yPosition += 40;
      pdf.text(`Total Amount: LKR ${stats.totalAmount}`, xPosition, yPosition);
      yPosition += 20;
      pdf.text(`Paid Amount: LKR ${stats.paidAmount}`, xPosition, yPosition);
      yPosition += 20;
      pdf.text(`Remaining Amount: LKR ${stats.remainingAmount}`, xPosition, yPosition);
      yPosition += 20;
      pdf.text(`Payment Percentage: ${stats.paymentPercentage}%`, xPosition, yPosition);
      
      // Add some space before the table
      yPosition += 40;
      
      // Use html2canvas to capture the table
      const tableElement = tableRef.current;
      const canvas = await html2canvas(tableElement, {
        scale: 1,
        useCORS: true,
        logging: false,
        allowTaint: false
      });
      
      // Convert canvas to image
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate image dimensions to fit on PDF
      const imgWidth = pdf.internal.pageSize.getWidth() - 80;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 40, yPosition, imgWidth, imgHeight);
      
      // Save the PDF
      pdf.save(`${tabTitle.replace(/\s+/g, '_')}_Report_${currentDate.replace(/\//g, '-')}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Error generating PDF: ' + err.message);
    } finally {
      setGeneratingPdf(false);
    }
  };
  
  const stats = getJobStats();
  const filteredInvoices = getFilteredInvoices();

  // Get badge background color based on job status
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "Completed":
        return "success";
      case "In Progress":
        return "info";
      case "Pending":
        return "warning";
      case "Cancelled":
        return "danger";
      case "Delivered":
        return "primary";
      default:
        return "secondary";
    }
  };
  
  // Get progress bar value based on payment percentage
  const getPaymentProgress = (paid, total) => {
    const percentage = (parseFloat(paid) / parseFloat(total)) * 100;
    return Math.min(100, Math.max(0, percentage));
  };
  
  // Get progress bar variant based on payment percentage
  const getProgressVariant = (percentage) => {
    if (percentage >= 75) return "success";
    if (percentage >= 50) return "info";
    if (percentage >= 25) return "warning";
    return "danger";
  };

  // Calculate days remaining to required date
  const getDaysRemaining = (dateString) => {
    if (!dateString) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const targetDate = new Date(dateString);
    targetDate.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  return (
    <div className="leftpart">
      <div className="container mt-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 style={{ color: "#1a2142", fontWeight: 600 }}>
            Partially Paid Jobs Management
          </h2>

          <div className="d-flex">
            {/* Download PDF Button */}
            <Button
              variant="outline-success"
              onClick={generatePDF}
              disabled={generatingPdf || loading || filteredInvoices.length === 0}
              className="d-flex align-items-center me-2"
            >
              {generatingPdf ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Generating PDF...
                </>
              ) : (
                <>
                  <FileEarmarkPdf className="me-2" />
                  Download PDF
                </>
              )}
            </Button>

            {/* Refresh Data Button */}
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
        </div>

        {error && (
          <Alert variant="danger" onClose={() => setError("")} dismissible>
            {error}
          </Alert>
        )}

        {/* Statistics Cards */}
        <div className="row mb-4">
          <div className="col-md-3">
            <Card className="h-100 shadow-sm">
              <Card.Body className="d-flex flex-column align-items-center justify-content-center">
                <div className="d-flex justify-content-center align-items-center">
                  <PeopleFill className="me-2 text-primary" size={24} />
                  <h3 className="text-primary mb-0">{stats.total}</h3>
                </div>
                <p className="text-muted mb-0">Total Jobs</p>
              </Card.Body>
            </Card>
          </div>
          <div className="col-md-3">
            <Card className="h-100 shadow-sm">
              <Card.Body className="d-flex flex-column align-items-center justify-content-center">
                <div className="d-flex justify-content-center align-items-center">
                  <CurrencyDollar className="me-2 text-success" size={24} />
                  <h3 className="text-success mb-0">LKR {stats.paidAmount}</h3>
                </div>
                <p className="text-muted mb-0">Total Paid Amount</p>
              </Card.Body>
            </Card>
          </div>
          <div className="col-md-3">
            <Card className="h-100 shadow-sm">
              <Card.Body className="d-flex flex-column align-items-center justify-content-center">
                <div className="d-flex justify-content-center align-items-center">
                  <ClockHistory className="me-2 text-info" size={24} />
                  <h3 className="text-info mb-0">{stats.inProgress}</h3>
                </div>
                <p className="text-muted mb-0">Jobs In Progress</p>
              </Card.Body>
            </Card>
          </div>
          <div className="col-md-3">
            <Card className="h-100 shadow-sm">
              <Card.Body className="d-flex flex-column align-items-center justify-content-center">
                <div className="d-flex justify-content-center align-items-center">
                  <ExclamationTriangleFill className="me-2 text-warning" size={24} />
                  <h3 className="text-warning mb-0">{stats.expiringSoon}</h3>
                </div>
                <p className="text-muted mb-0">Expiring Soon</p>
              </Card.Body>
            </Card>
          </div>
        </div>

        {/* Overall Payment Progress */}
        <Card className="mb-4 shadow-sm">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5 className="mb-0">Overall Payment Progress</h5>
              <Badge bg="primary">{stats.paymentPercentage}%</Badge>
            </div>
            <ProgressBar 
              variant={getProgressVariant(stats.paymentPercentage)} 
              now={stats.paymentPercentage} 
              className="mb-2"
              style={{ height: "10px" }}
            />
            <div className="d-flex justify-content-between small text-muted">
              <span>Paid: LKR {stats.paidAmount}</span>
              <span>Remaining: LKR {stats.remainingAmount}</span>
              <span>Total: LKR {stats.totalAmount}</span>
            </div>
          </Card.Body>
        </Card>

        {/* Search and Filter Controls */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center w-50">
            <div className="input-group">
              <span className="input-group-text bg-white">
                <Search />
              </span>
              <Form.Control
                type="text"
                placeholder="Search jobs by ID, description, or customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-4">
          <ul className="nav nav-pills nav-fill">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
                style={activeTab === 'all' ? {backgroundColor: "#1a2142"} : {}}
              >
                All Jobs ({stats.total})
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'not-started' ? 'active' : ''}`}
                onClick={() => setActiveTab('not-started')}
                style={activeTab === 'not-started' ? {backgroundColor: "#1a2142"} : {}}
              >
                Not Started ({stats.notStarted})
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'in-progress' ? 'active' : ''}`}
                onClick={() => setActiveTab('in-progress')}
                style={activeTab === 'in-progress' ? {backgroundColor: "#1a2142"} : {}}
              >
                In Progress ({stats.inProgress})
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'completed' ? 'active' : ''}`}
                onClick={() => setActiveTab('completed')}
                style={activeTab === 'completed' ? {backgroundColor: "#1a2142"} : {}}
              >
                Completed ({stats.completed})
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'expire-soon' ? 'active' : ''}`}
                onClick={() => setActiveTab('expire-soon')}
                style={activeTab === 'expire-soon' ? {backgroundColor: "#1a2142"} : {}}
              >
                <ExclamationTriangleFill className="me-1" />
                Expiring Soon ({stats.expiringSoon})
              </button>
            </li>
          </ul>
        </div>

        {loading ? (
          <div className="d-flex justify-content-center my-5">
            <Spinner animation="border" variant="primary" />
            <span className="ms-3">Loading job data...</span>
          </div>
        ) : (
          <>
            {filteredInvoices.length === 0 ? (
              <Alert variant="info">No jobs found matching your criteria.</Alert>
            ) : (
              <Card className="shadow-sm">
                <Card.Body className="p-0">
                  <Table responsive hover className="mb-0" ref={tableRef}>
                    <thead className="bg-light">
                      <tr>
                        <th>Job ID</th>
                        <th>Invoice ID</th>
                        <th>Customer Name</th>
                        <th>Job Description</th>
                        <th>Payment Progress</th>
                        <th>Job Status</th>
                        <th>Start Date</th>
                        <th>Required By</th>
                        {activeTab === 'expire-soon' && <th>Days Left</th>}
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInvoices.map((invoice) => {
                        const paymentPercentage = getPaymentProgress(
                          invoice.paid_amount, 
                          invoice.total_amount
                        );
                        
                        const daysRemaining = getDaysRemaining(invoice.immediate);
                        
                        return (
                          <tr 
                            key={invoice.id} 
                            className={
                              invoice.existingJob && invoice.existingJob.status === "Completed" 
                                ? "table-success" 
                                : isExpiringSoon(invoice) 
                                  ? "table-warning" 
                                  : ""
                            }
                          >
                            <td>{invoice.jobID || "N/A"}</td>
                            <td>{invoice.id}</td>
                            <td>{invoice.customer_name}</td>
                            <td>{invoice.job_description || "N/A"}</td>
                            <td style={{ width: "150px" }}>
                              <div className="d-flex align-items-center">
                                <ProgressBar
                                  variant={getProgressVariant(paymentPercentage)}
                                  now={paymentPercentage}
                                  style={{ height: "10px", flex: 1 }}
                                  className="me-2"
                                />
                                <small>{paymentPercentage.toFixed(0)}%</small>
                              </div>
                              <small className="text-muted">
                                {parseFloat(invoice.paid_amount).toFixed(2)} / {parseFloat(invoice.total_amount).toFixed(2)} LKR
                              </small>
                            </td>
                            <td>
                              {invoice.existingJob ? (
                                <Badge bg={getStatusBadgeColor(invoice.existingJob.status)}>
                                  {invoice.existingJob.status}
                                </Badge>
                              ) : (
                                <Badge bg="secondary">Not Started</Badge>
                              )}
                            </td>
                            <td>
                              {invoice.existingJob ? formatDate(invoice.existingJob.start_date) : "N/A"}
                            </td>
                            <td>
                              {formatDate(invoice.immediate)}
                            </td>
                            {activeTab === 'expire-soon' && (
                              <td>
                                <Badge 
                                  bg={daysRemaining <= 3 ? "danger" : "warning"}
                                  className="d-flex align-items-center justify-content-center"
                                >
                                  {daysRemaining === 0 ? "Today!" : `${daysRemaining} days`}
                                </Badge>
                              </td>
                            )}
                            <td className="text-center">
                              <Button
                                variant={invoice.existingJob ? "success" : "primary"}
                                size="sm"
                                onClick={() => handleOpenModal(invoice)}
                                className="d-flex align-items-center mx-auto"
                                style={{
                                  backgroundColor: invoice.existingJob ? "#28a745" : "#1a2142",
                                  borderColor: invoice.existingJob ? "#28a745" : "#1a2142",
                                }}
                              >
                                {invoice.existingJob ? (
                                  <>
                                    <PencilSquare className="me-1" />
                                    Update
                                  </>
                                ) : (
                                  <>
                                    <Tools className="me-1" />
                                    Start Job
                                  </>
                                )}
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            )}
          </>
        )}

        {/* Job Modal with Card Layout */}
        <Modal show={showModal} onHide={handleCloseModal} centered>
          <Modal.Header closeButton className="bg-light">
            <Modal.Title>
              {existingJob ? (
                <div className="d-flex align-items-center">
                  <PencilSquare className="me-2" />
                  Update Job
                </div>
              ) : (
                <div className="d-flex align-items-center">
                  <Tools className="me-2" />
                  Start New Job
                </div>
              )}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedInvoice && (
              <>
                <Card className="shadow-sm mb-4">
                  <Card.Body>
                    <h5 className="border-bottom pb-2 mb-3">Job Summary</h5>
                    <div className="row">
                      <div className="col-md-6">
                        <p className="mb-2">
                          <strong>Job ID:</strong> {selectedInvoice.jobID || "Will be generated"}
                        </p>
                        <p className="mb-2">
                          <strong>Invoice ID:</strong> {selectedInvoice.id}
                        </p>
                        <p className="mb-2">
                          <strong>Customer:</strong> {selectedInvoice.customer_name}
                        </p>
                      </div>
                      <div className="col-md-6">
                        <p className="mb-2">
                          <strong>Total Amount:</strong> LKR {parseFloat(selectedInvoice.total_amount).toFixed(2)}
                        </p>
                        <p className="mb-2">
                          <strong>Paid Amount:</strong> LKR {parseFloat(selectedInvoice.paid_amount).toFixed(2)}
                        </p>
                        <p className="mb-2">
                          <strong>Remaining:</strong> LKR {(parseFloat(selectedInvoice.total_amount) - parseFloat(selectedInvoice.paid_amount)).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <strong>Job Description:</strong>
                      <p className="mb-2 border p-2 rounded bg-light">
                        {selectedInvoice.job_description || "No description available"}
                      </p>
                    </div>
                    
                    <div className="mt-3">
                      <strong>Payment Progress:</strong>
                      <ProgressBar
                        variant={getProgressVariant(getPaymentProgress(selectedInvoice.paid_amount, selectedInvoice.total_amount))}
                        now={getPaymentProgress(selectedInvoice.paid_amount, selectedInvoice.total_amount)}
                        className="mt-2"
                        style={{ height: "15px" }}
                      />
                      <div className="d-flex justify-content-between mt-1 small text-muted">
                        <span>0%</span>
                        <span>{getPaymentProgress(selectedInvoice.paid_amount, selectedInvoice.total_amount).toFixed(0)}%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
                
                <Card className="shadow-sm">
                  <Card.Body>
                    <h5 className="border-bottom pb-2 mb-3">Job Details</h5>
                    
                    <Form.Group className="mb-3" controlId="formJobStartDate">
                      <Form.Label className="d-flex align-items-center fw-bold">
                        <Calendar2Check className="me-2 text-primary" />
                        Actual Start Date
                      </Form.Label>
                      <Form.Control
                        type="date"
                        value={actualStartDate}
                        onChange={(e) => setActualStartDate(e.target.value)}
                      />
                      <Form.Text className="text-muted">
                        When will the actual work begin? This will be stored as the job's start date.
                      </Form.Text>
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label className="d-flex align-items-center fw-bold">
                        <Calendar2Check className="me-2 text-danger" />
                        Required Completion Date
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={formatDate(selectedInvoice.immediate)}
                        disabled
                        className="bg-light"
                      />
                      <Form.Text className="text-muted">
                        This is the required completion date from the quotation (stored as finish date).
                        {isExpiringSoon(selectedInvoice) && (
                          <span className="text-danger fw-bold ms-2">
                            <ExclamationTriangleFill className="me-1" />
                            Expires in {getDaysRemaining(selectedInvoice.immediate)} days!
                          </span>
                        )}
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="formJobStatus">
                      <Form.Label className="d-flex align-items-center fw-bold">
                        <ThermometerHalf className="me-2 text-warning" />
                        Job Status
                      </Form.Label>
                      <Form.Select
                        value={jobStatus}
                        onChange={(e) => setJobStatus(e.target.value)}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="Delivered">Delivered</option>
                      </Form.Select>
                    </Form.Group>
                    
                    {submitError && (
                      <Alert variant="danger" className="mt-3">
                        {submitError}
                      </Alert>
                    )}
                  </Card.Body>
                </Card>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleCreateOrUpdateJob}
              disabled={isSubmitting}
              style={{
                backgroundColor: "#1a2142",
                borderColor: "#1a2142",
              }}
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
                existingJob ? "Update Job" : "Create Job"
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
};

export default JobManagement;