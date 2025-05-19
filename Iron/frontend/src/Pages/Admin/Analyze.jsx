import React, { useEffect, useState, useRef } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Table,
  Badge,
  Spinner,
  Alert,
} from "react-bootstrap";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "./ProfessionalDashboard.css";

const AdminDashboard = () => {
  // State for all data
  const [invoices, setInvoices] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // References for PDF export
  const quotationChartRef = useRef(null);
  const invoiceChartRef = useRef(null);
  const jobChartRef = useRef(null);

  // Chart data states
  const [quotationChartData, setQuotationChartData] = useState([]);
  const [invoiceChartData, setInvoiceChartData] = useState([]);
  const [jobChartData, setJobChartData] = useState([]);

  // Summary counts
  const [counts, setCounts] = useState({
    totalRevenue: 0,
    invoices: {
      total: 0,
      pending: 0,
      completed: 0,
      partiallyPaid: 0,
    },
    quotations: {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
    },
    jobs: {
      total: 0,
      progress: 0,
      pending: 0,
      completedPaid: 0,
      cancel: 0,
      delivery: 0,
    },
  });

  // Recent items for quick view
  const [recentItems, setRecentItems] = useState({
    quotations: [],
    invoices: [],
    jobs: [],
  });

  // Professional color schemes
  const COLORS = {
    quotations: ["#1a2142", "#3498db", "#2ecc71", "#e74c3c"],
    invoices: ["#1a2142", "#3498db", "#2ecc71", "#e74c3c"],
    jobs: ["#1a2142", "#3498db", "#2ecc71", "#e74c3c", "#f39c12"],
  };

  // Fetch all data on component mount
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        // Fetch all required data
        const [quotationsRes, invoicesRes, jobsRes, materialsRes] =
          await Promise.all([
            fetch("http://localhost:4000/api/quotation/admin").then((res) =>
              res.json()
            ),
            axios.get("http://localhost:4000/api/quotation/get_all"),
            axios.get("http://localhost:4000/api/quotation/get_all_jobs"),
            fetch("http://localhost:4000/api/material/get_all").then((res) =>
              res.json()
            ),
          ]);

        // Update states with fetched data
        if (quotationsRes.success) {
          setQuotations(quotationsRes.quotations);
          processQuotationData(quotationsRes.quotations);
        }

        setInvoices(invoicesRes.data.invoices || []);
        processInvoiceData(invoicesRes.data.invoices || []);

        setJobs(jobsRes.data.jobs || []);
        processJobData(jobsRes.data.jobs || []);

        if (materialsRes.success) {
          setMaterials(materialsRes.materials);
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Process quotation data for charts and counts
  const processQuotationData = (data) => {
    // Count quotations by status
    const statusCounts = {
      Pending: 0,
      Approved: 0,
      Rejected: 0,
      Other: 0,
    };

    data.forEach((q) => {
      if (statusCounts.hasOwnProperty(q.status)) {
        statusCounts[q.status]++;
      } else {
        statusCounts.Other++;
      }
    });

    // Update counts
    setCounts((prev) => ({
      ...prev,
      quotations: {
        total: data.length,
        pending: statusCounts.Pending,
        approved: statusCounts.Approved,
        rejected: statusCounts.Rejected,
      },
    }));

    // Prepare chart data
    const chartData = Object.keys(statusCounts)
      .filter((key) => statusCounts[key] > 0)
      .map((key) => ({
        name: key,
        value: statusCounts[key],
        percentage:
          ((statusCounts[key] / Math.max(data.length, 1)) * 100).toFixed(1) +
          "%",
      }));

    setQuotationChartData(chartData);

    // Set recent items (5 most recent)
    setRecentItems((prev) => ({
      ...prev,
      quotations: [...data]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5),
    }));
  };

  // Process invoice data for charts and counts
  const processInvoiceData = (data) => {
    // Calculate total revenue
    const revenue = data.reduce(
      (sum, inv) => sum + (parseFloat(inv.paid_amount) || 0),
      0
    );

    // Count invoices by status
    const statusCounts = {
      Pending: 0,
      Completed: 0,
      "Partially Paid": 0,
      Other: 0,
    };

    data.forEach((inv) => {
      if (inv.payment_status) {
        const status = inv.payment_status.toLowerCase();
        if (status === "completed") {
          statusCounts.Completed++;
        } else if (status === "partially paid") {
          statusCounts["Partially Paid"]++;
        } else if (status === "pending") {
          statusCounts.Pending++;
        } else {
          statusCounts.Other++;
        }
      } else {
        statusCounts.Pending++; // Default to pending if no status
      }
    });

    // Update counts
    setCounts((prev) => ({
      ...prev,
      totalRevenue: revenue,
      invoices: {
        total: data.length,
        pending: statusCounts.Pending,
        completed: statusCounts.Completed,
        partiallyPaid: statusCounts["Partially Paid"],
      },
    }));

    // Prepare chart data
    const chartData = Object.keys(statusCounts)
      .filter((key) => statusCounts[key] > 0)
      .map((key) => ({
        name: key,
        value: statusCounts[key],
        percentage:
          ((statusCounts[key] / Math.max(data.length, 1)) * 100).toFixed(1) +
          "%",
      }));

    setInvoiceChartData(chartData);

    // Set recent items (5 most recent)
    setRecentItems((prev) => ({
      ...prev,
      invoices: [...data]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5),
    }));
  };

  // Process job data for charts and counts
  const processJobData = (data) => {
    // Count jobs by status
    const statusGroups = {
      "In Progress": 0,
      Pending: 0,
      "Completed Paid": 0,
      Cancelled: 0,
      Delivery: 0,
      Other: 0,
    };

    data.forEach((job) => {
      const status = (job.status || "").toLowerCase();
      if (status === "in progress" || status === "progress") {
        statusGroups["In Progress"]++;
      } else if (status === "pending") {
        statusGroups.Pending++;
      } else if (
        status === "completed" ||
        status === "completed paid" ||
        status === "paid"
      ) {
        statusGroups["Completed Paid"]++;
      } else if (
        status === "cancel" ||
        status === "cancelled" ||
        status === "cansel"
      ) {
        statusGroups.Cancelled++;
      } else if (status === "delivery" || status === "delivered") {
        statusGroups.Delivery++;
      } else {
        statusGroups.Other++;
      }
    });

    // Update counts
    setCounts((prev) => ({
      ...prev,
      jobs: {
        total: data.length,
        progress: statusGroups["In Progress"],
        pending: statusGroups.Pending,
        completedPaid: statusGroups["Completed Paid"],
        cancel: statusGroups.Cancelled,
        delivery: statusGroups.Delivery,
      },
    }));

    // Prepare chart data
    const chartData = Object.keys(statusGroups)
      .filter((key) => statusGroups[key] > 0)
      .map((key) => ({
        name: key,
        value: statusGroups[key],
        percentage:
          ((statusGroups[key] / Math.max(data.length, 1)) * 100).toFixed(1) +
          "%",
      }));

    setJobChartData(chartData);

    // Set recent items (5 most recent)
    setRecentItems((prev) => ({
      ...prev,
      jobs: [...data]
        .sort(
          (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
        )
        .slice(0, 5),
    }));
  };

  // Function to download chart as PDF
  const handleDownloadPDF = async (chartRef, title) => {
    const input = chartRef.current;
    if (!input) return;

    const canvas = await html2canvas(input, {
      backgroundColor: "#fff",
      scale: 2,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgWidth = Math.min(canvas.width, pageWidth - 40);
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.setFontSize(16);
    pdf.text(title, pageWidth / 2, 40, { align: "center" });
    pdf.addImage(imgData, "PNG", 20, 60, imgWidth, imgHeight);
    pdf.save(`${title.toLowerCase().replace(/\s+/g, "-")}.pdf`);
  };

  // Function to format money amounts
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Function to get status badge
  const getStatusBadge = (status, type = "quotation") => {
    if (!status) return <Badge bg="warning">Pending</Badge>;

    status = status.toLowerCase();

    if (
      status === "approved" ||
      status === "completed" ||
      status === "completed paid" ||
      status === "paid"
    ) {
      return (
        <Badge bg="success">
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    } else if (
      status === "rejected" ||
      status === "cancel" ||
      status === "cancelled"
    ) {
      return (
        <Badge bg="danger">
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    } else if (status === "partially paid") {
      return <Badge bg="info">Partially Paid</Badge>;
    } else if (status === "progress" || status === "in progress") {
      return <Badge bg="primary">In Progress</Badge>;
    } else if (status === "delivery" || status === "delivered") {
      return <Badge bg="secondary">Delivery</Badge>;
    } else {
      return (
        <Badge bg="warning">
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    }
  };

  return (
    <div className="p-4 leftpart">
      <h2 className="mb-4">Admin Dashboard</h2>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Loading dashboard data...</p>
        </div>
      ) : (
        <>
          {/* Summary Cards with professional but subdued colors - inline styles only */}
          <Row className="mb-4">
            {/* Total Revenue Card */}
            <Col md={3} sm={6} xs={12} className="mb-3">
              <Card
                className="h-100"
                style={{
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                  borderRadius: "8px",
                  border: "none",
                }}
              >
                <Card.Body
                  className="d-flex flex-column"
                  style={{
                    backgroundColor: "#f8faf5",
                    borderLeft: "4px solid #4caf50",
                  }}
                >
                  <Card.Title
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "#555",
                    }}
                  >
                    Total Revenue
                  </Card.Title>
                  <div style={{ marginTop: "auto", textAlign: "right" }}>
                    <h3
                      style={{
                        margin: "0",
                        fontWeight: 600,
                        color: "#2e7d32",
                      }}
                    >
                      {formatCurrency(counts.totalRevenue)}
                    </h3>
                    <small style={{ color: "#666" }}>All time revenue</small>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* Quotations Card */}
            <Col md={3} sm={6} xs={12} className="mb-3">
              <Card
                className="h-100"
                style={{
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                  borderRadius: "8px",
                  border: "none",
                }}
              >
                <Card.Body
                  className="d-flex flex-column"
                  style={{
                    backgroundColor: "#f5f9fd",
                    borderLeft: "4px solid #2196f3",
                  }}
                >
                  <Card.Title
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "#555",
                    }}
                  >
                    Quotations
                  </Card.Title>
                  <div style={{ marginTop: "auto", textAlign: "right" }}>
                    <h3
                      style={{
                        margin: "0",
                        fontWeight: 600,
                        color: "#1565c0",
                      }}
                    >
                      {counts.quotations.total}
                    </h3>
                    <small style={{ color: "#666" }}>
                      {counts.quotations.pending} pending
                    </small>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* Invoices Card */}
            <Col md={3} sm={6} xs={12} className="mb-3">
              <Card
                className="h-100"
                style={{
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                  borderRadius: "8px",
                  border: "none",
                }}
              >
                <Card.Body
                  className="d-flex flex-column"
                  style={{
                    backgroundColor: "#f9f5fc",
                    borderLeft: "4px solid #9c27b0",
                  }}
                >
                  <Card.Title
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "#555",
                    }}
                  >
                    Invoices
                  </Card.Title>
                  <div style={{ marginTop: "auto", textAlign: "right" }}>
                    <h3
                      style={{
                        margin: "0",
                        fontWeight: 600,
                        color: "#7b1fa2",
                      }}
                    >
                      {counts.invoices.total}
                    </h3>
                    <small style={{ color: "#666" }}>
                      {counts.invoices.completed} completed
                    </small>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* Jobs Card */}
            <Col md={3} sm={6} xs={12} className="mb-3">
              <Card
                className="h-100"
                style={{
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                  borderRadius: "8px",
                  border: "none",
                }}
              >
                <Card.Body
                  className="d-flex flex-column"
                  style={{
                    backgroundColor: "#fff8f0",
                    borderLeft: "4px solid #ff9800",
                  }}
                >
                  <Card.Title
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "#555",
                    }}
                  >
                    Jobs
                  </Card.Title>
                  <div style={{ marginTop: "auto", textAlign: "right" }}>
                    <h3
                      style={{
                        margin: "0",
                        fontWeight: 600,
                        color: "#e65100",
                      }}
                    >
                      {counts.jobs.total}
                    </h3>
                    <small style={{ color: "#666" }}>
                      {counts.jobs.progress} in progress
                    </small>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          {/* Charts Section with percentage-only labels */}
          <h4
            style={{
              marginTop: "2rem",
              marginBottom: "1rem",
              fontSize: "1.1rem",
              fontWeight: 600,
              color: "#333",
            }}
          >
            Analytics Overview
          </h4>
          <Row className="mb-4">
            {/* Quotation Chart */}
            <Col lg={4} md={6} className="mb-4">
              <Card
                className="h-100"
                style={{
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                  borderRadius: "8px",
                  border: "none",
                }}
              >
                <Card.Body style={{ padding: "1.25rem" }}>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div
                      style={{
                        fontSize: "0.975rem",
                        fontWeight: 600,
                        color: "#333",
                        margin: 0,
                      }}
                    >
                      Quotation Status
                    </div>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() =>
                        handleDownloadPDF(
                          quotationChartRef,
                          "Quotation Status Distribution"
                        )
                      }
                      style={{
                        fontSize: "0.75rem",
                        padding: "0.25rem 0.75rem",
                      }}
                    >
                      Export
                    </Button>
                  </div>
                  <div ref={quotationChartRef} style={{ height: "250px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={quotationChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          innerRadius={40}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ percentage }) => `${percentage}`}
                          labelStyle={{
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            fill: "#fff",
                            textShadow: "0px 1px 2px rgba(0,0,0,0.5)",
                          }}
                        >
                          {quotationChartData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                COLORS.quotations[
                                  index % COLORS.quotations.length
                                ]
                              }
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name) => [`${value} (${name})`]}
                          contentStyle={{
                            fontSize: "0.8rem",
                            padding: "0.5rem",
                            border: "none",
                            borderRadius: "4px",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                          }}
                        />
                        <Legend
                          layout="horizontal"
                          verticalAlign="bottom"
                          align="center"
                          wrapperStyle={{
                            fontSize: "0.75rem",
                            paddingTop: "1rem",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* Invoice Chart */}
            <Col lg={4} md={6} className="mb-4">
              <Card
                className="h-100"
                style={{
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                  borderRadius: "8px",
                  border: "none",
                }}
              >
                <Card.Body style={{ padding: "1.25rem" }}>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div
                      style={{
                        fontSize: "0.975rem",
                        fontWeight: 600,
                        color: "#333",
                        margin: 0,
                      }}
                    >
                      Invoice Status
                    </div>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() =>
                        handleDownloadPDF(
                          invoiceChartRef,
                          "Invoice Status Distribution"
                        )
                      }
                      style={{
                        fontSize: "0.75rem",
                        padding: "0.25rem 0.75rem",
                      }}
                    >
                      Export
                    </Button>
                  </div>
                  <div ref={invoiceChartRef} style={{ height: "250px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={invoiceChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          innerRadius={40}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ percentage }) => `${percentage}`}
                          labelStyle={{
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            fill: "#fff",
                            textShadow: "0px 1px 2px rgba(0,0,0,0.5)",
                          }}
                        >
                          {invoiceChartData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                COLORS.invoices[index % COLORS.invoices.length]
                              }
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name) => [`${value} (${name})`]}
                          contentStyle={{
                            fontSize: "0.8rem",
                            padding: "0.5rem",
                            border: "none",
                            borderRadius: "4px",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                          }}
                        />
                        <Legend
                          layout="horizontal"
                          verticalAlign="bottom"
                          align="center"
                          wrapperStyle={{
                            fontSize: "0.75rem",
                            paddingTop: "1rem",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* Job Chart */}
            <Col lg={4} md={12} className="mb-4">
              <Card
                className="h-100"
                style={{
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                  borderRadius: "8px",
                  border: "none",
                }}
              >
                <Card.Body style={{ padding: "1.25rem" }}>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div
                      style={{
                        fontSize: "0.975rem",
                        fontWeight: 600,
                        color: "#333",
                        margin: 0,
                      }}
                    >
                      Job Status
                    </div>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() =>
                        handleDownloadPDF(
                          jobChartRef,
                          "Job Status Distribution"
                        )
                      }
                      style={{
                        fontSize: "0.75rem",
                        padding: "0.25rem 0.75rem",
                      }}
                    >
                      Export
                    </Button>
                  </div>
                  <div ref={jobChartRef} style={{ height: "250px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={jobChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          innerRadius={40}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ percentage }) => `${percentage}`}
                          labelStyle={{
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            fill: "#fff",
                            textShadow: "0px 1px 2px rgba(0,0,0,0.5)",
                          }}
                        >
                          {jobChartData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS.jobs[index % COLORS.jobs.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name) => [`${value} (${name})`]}
                          contentStyle={{
                            fontSize: "0.8rem",
                            padding: "0.5rem",
                            border: "none",
                            borderRadius: "4px",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                          }}
                        />
                        <Legend
                          layout="horizontal"
                          verticalAlign="bottom"
                          align="center"
                          wrapperStyle={{
                            fontSize: "0.75rem",
                            paddingTop: "1rem",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          {/* Detailed Status Cards */}
          <h4>Status Details</h4>
          <Row className="mb-4">
            {/* Quotation Status Details */}
            <Col lg={4} md={6} className="mb-4">
              <Card className="h-100">
                <Card.Header>
                  <h5 className="mb-0">Quotation Status</h5>
                </Card.Header>
                <Card.Body>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Total Quotations</span>
                    <span className="fw-bold">{counts.quotations.total}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Pending</span>
                    <span className="fw-bold text-warning">
                      {counts.quotations.pending}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Approved</span>
                    <span className="fw-bold text-success">
                      {counts.quotations.approved}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Rejected</span>
                    <span className="fw-bold text-danger">
                      {counts.quotations.rejected}
                    </span>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* Invoice Status Details */}
            <Col lg={4} md={6} className="mb-4">
              <Card className="h-100">
                <Card.Header>
                  <h5 className="mb-0">Invoice Status</h5>
                </Card.Header>
                <Card.Body>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Total Invoices</span>
                    <span className="fw-bold">{counts.invoices.total}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Pending</span>
                    <span className="fw-bold text-warning">
                      {counts.invoices.pending}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Completed</span>
                    <span className="fw-bold text-success">
                      {counts.invoices.completed}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Partially Paid</span>
                    <span className="fw-bold text-info">
                      {counts.invoices.partiallyPaid}
                    </span>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* Job Status Details */}
            <Col lg={4} md={12} className="mb-4">
              <Card className="h-100">
                <Card.Header>
                  <h5 className="mb-0">Job Status</h5>
                </Card.Header>
                <Card.Body>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Total Jobs</span>
                    <span className="fw-bold">{counts.jobs.total}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>In Progress</span>
                    <span className="fw-bold text-primary">
                      {counts.jobs.progress}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Pending</span>
                    <span className="fw-bold text-warning">
                      {counts.jobs.pending}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Completed</span>
                    <span className="fw-bold text-success">
                      {counts.jobs.completedPaid}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Cancelled</span>
                    <span className="fw-bold text-danger">
                      {counts.jobs.cancel}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Delivery</span>
                    <span className="fw-bold text-secondary">
                      {counts.jobs.delivery}
                    </span>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          {/* Recent Activities Section with improved padding and alignment */}
          <h4
            style={{
              marginTop: "2rem",
              marginBottom: "1rem",
              fontSize: "1.1rem",
              fontWeight: 600,
              color: "#333",
            }}
          >
            Recent Activities
          </h4>
          <Row>
            {/* Recent Quotations */}
            <Col lg={4} className="mb-4">
              <Card
                className="h-100"
                style={{
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                  borderRadius: "8px",
                  border: "none",
                }}
              >
                <Card.Header
                  className="d-flex justify-content-between align-items-center"
                  style={{
                    backgroundColor: "white",
                    padding: "0.875rem 1.25rem",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  <h5
                    style={{
                      margin: 0,
                      fontSize: "1rem",
                      fontWeight: 600,
                      color: "#333",
                    }}
                  >
                    Recent Quotations
                  </h5>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    href="/admin/quotations"
                    style={{
                      fontSize: "0.75rem",
                      padding: "0.25rem 0.75rem",
                    }}
                  >
                    View All
                  </Button>
                </Card.Header>
                <Card.Body style={{ padding: 0 }}>
                  <Table responsive hover style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th
                          style={{
                            padding: "0.75rem 1.25rem",
                            borderTop: "none",
                            backgroundColor: "#f8f9fa",
                            fontSize: "0.8125rem",
                            fontWeight: 600,
                            color: "#495057",
                          }}
                        >
                          ID
                        </th>
                        <th
                          style={{
                            padding: "0.75rem 1.25rem",
                            borderTop: "none",
                            backgroundColor: "#f8f9fa",
                            fontSize: "0.8125rem",
                            fontWeight: 600,
                            color: "#495057",
                          }}
                        >
                          Customer
                        </th>
                        <th
                          style={{
                            padding: "0.75rem 1.25rem",
                            borderTop: "none",
                            backgroundColor: "#f8f9fa",
                            fontSize: "0.8125rem",
                            fontWeight: 600,
                            color: "#495057",
                            textAlign: "center",
                          }}
                        >
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentItems.quotations.length > 0 ? (
                        recentItems.quotations.map((quotation) => (
                          <tr key={`quotation-${quotation.id}`}>
                            <td
                              style={{
                                padding: "0.75rem 1.25rem",
                                fontSize: "0.875rem",
                                borderTop: "1px solid #f0f0f0",
                                fontWeight: 500,
                              }}
                            >
                              QID {quotation.id}
                            </td>
                            <td
                              style={{
                                padding: "0.75rem 1.25rem",
                                fontSize: "0.875rem",
                                borderTop: "1px solid #f0f0f0",
                              }}
                            >
                              {quotation.customer_name}
                            </td>
                            <td
                              style={{
                                padding: "0.75rem 1.25rem",
                                fontSize: "0.875rem",
                                borderTop: "1px solid #f0f0f0",
                                textAlign: "center",
                              }}
                            >
                              {getStatusBadge(quotation.status)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="3"
                            style={{
                              padding: "1.25rem",
                              textAlign: "center",
                              color: "#6c757d",
                            }}
                          >
                            No recent quotations found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>

            {/* Recent Invoices */}
            <Col lg={4} className="mb-4">
              <Card
                className="h-100"
                style={{
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                  borderRadius: "8px",
                  border: "none",
                }}
              >
                <Card.Header
                  className="d-flex justify-content-between align-items-center"
                  style={{
                    backgroundColor: "white",
                    padding: "0.875rem 1.25rem",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  <h5
                    style={{
                      margin: 0,
                      fontSize: "1rem",
                      fontWeight: 600,
                      color: "#333",
                    }}
                  >
                    Recent Invoices
                  </h5>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    href="/admin/invoices"
                    style={{
                      fontSize: "0.75rem",
                      padding: "0.25rem 0.75rem",
                    }}
                  >
                    View All
                  </Button>
                </Card.Header>
                <Card.Body style={{ padding: 0 }}>
                  <Table responsive hover style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th
                          style={{
                            padding: "0.75rem 1.25rem",
                            borderTop: "none",
                            backgroundColor: "#f8f9fa",
                            fontSize: "0.8125rem",
                            fontWeight: 600,
                            color: "#495057",
                          }}
                        >
                          ID
                        </th>
                        <th
                          style={{
                            padding: "0.75rem 1.25rem",
                            borderTop: "none",
                            backgroundColor: "#f8f9fa",
                            fontSize: "0.8125rem",
                            fontWeight: 600,
                            color: "#495057",
                          }}
                        >
                          Amount
                        </th>
                        <th
                          style={{
                            padding: "0.75rem 1.25rem",
                            borderTop: "none",
                            backgroundColor: "#f8f9fa",
                            fontSize: "0.8125rem",
                            fontWeight: 600,
                            color: "#495057",
                            textAlign: "center",
                          }}
                        >
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentItems.invoices.length > 0 ? (
                        recentItems.invoices.map((invoice) => (
                          <tr
                            key={`invoice-${invoice.invoice_id || invoice.id}`}
                          >
                            <td
                              style={{
                                padding: "0.75rem 1.25rem",
                                fontSize: "0.875rem",
                                borderTop: "1px solid #f0f0f0",
                                fontWeight: 500,
                              }}
                            >
                              INV {invoice.invoice_id || invoice.id}
                            </td>
                            <td
                              style={{
                                padding: "0.75rem 1.25rem",
                                fontSize: "0.875rem",
                                borderTop: "1px solid #f0f0f0",
                              }}
                            >
                              {formatCurrency(invoice.total_amount)}
                            </td>
                            <td
                              style={{
                                padding: "0.75rem 1.25rem",
                                fontSize: "0.875rem",
                                borderTop: "1px solid #f0f0f0",
                                textAlign: "center",
                              }}
                            >
                              {getStatusBadge(
                                invoice.payment_status,
                                "invoice"
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="3"
                            style={{
                              padding: "1.25rem",
                              textAlign: "center",
                              color: "#6c757d",
                            }}
                          >
                            No recent invoices found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>

            {/* Recent Jobs */}
            <Col lg={4} className="mb-4">
              <Card
                className="h-100"
                style={{
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                  borderRadius: "8px",
                  border: "none",
                }}
              >
                <Card.Header
                  className="d-flex justify-content-between align-items-center"
                  style={{
                    backgroundColor: "white",
                    padding: "0.875rem 1.25rem",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  <h5
                    style={{
                      margin: 0,
                      fontSize: "1rem",
                      fontWeight: 600,
                      color: "#333",
                    }}
                  >
                    Recent Jobs
                  </h5>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    href="/admin/jobs"
                    style={{
                      fontSize: "0.75rem",
                      padding: "0.25rem 0.75rem",
                    }}
                  >
                    View All
                  </Button>
                </Card.Header>
                <Card.Body style={{ padding: 0 }}>
                  <Table responsive hover style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th
                          style={{
                            padding: "0.75rem 1.25rem",
                            borderTop: "none",
                            backgroundColor: "#f8f9fa",
                            fontSize: "0.8125rem",
                            fontWeight: 600,
                            color: "#495057",
                          }}
                        >
                          ID
                        </th>
                        <th
                          style={{
                            padding: "0.75rem 1.25rem",
                            borderTop: "none",
                            backgroundColor: "#f8f9fa",
                            fontSize: "0.8125rem",
                            fontWeight: 600,
                            color: "#495057",
                          }}
                        >
                          Job Name
                        </th>
                        <th
                          style={{
                            padding: "0.75rem 1.25rem",
                            borderTop: "none",
                            backgroundColor: "#f8f9fa",
                            fontSize: "0.8125rem",
                            fontWeight: 600,
                            color: "#495057",
                            textAlign: "center",
                          }}
                        >
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentItems.jobs.length > 0 ? (
                        recentItems.jobs.map((job) => (
                          <tr key={`job-${job.id}`}>
                            <td
                              style={{
                                padding: "0.75rem 1.25rem",
                                fontSize: "0.875rem",
                                borderTop: "1px solid #f0f0f0",
                                fontWeight: 500,
                              }}
                            >
                              JOB {job.id}
                            </td>
                            <td
                              style={{
                                padding: "0.75rem 1.25rem",
                                fontSize: "0.875rem",
                                borderTop: "1px solid #f0f0f0",
                              }}
                            >
                              {job.job_name || job.name || "Job"}
                            </td>
                            <td
                              style={{
                                padding: "0.75rem 1.25rem",
                                fontSize: "0.875rem",
                                borderTop: "1px solid #f0f0f0",
                                textAlign: "center",
                              }}
                            >
                              {getStatusBadge(job.status, "job")}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="3"
                            style={{
                              padding: "1.25rem",
                              textAlign: "center",
                              color: "#6c757d",
                            }}
                          >
                            No recent jobs found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
