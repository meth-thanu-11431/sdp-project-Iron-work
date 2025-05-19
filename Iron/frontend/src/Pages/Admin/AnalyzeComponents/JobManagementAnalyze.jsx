import { Card, Spinner, Alert, Button } from "react-bootstrap";
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const JobManagementAnalyze = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chartData, setChartData] = useState([]);
  const [statusCounts, setStatusCounts] = useState({
    progress: 0,
    pending: 0,
    completedPaid: 0,
    cancel: 0,
    delivery: 0,
    total: 0,
  });
  // Color scheme for the chart
  const COLORS = [
    "#FFBB28",
    "#00C49F",
    "#0088FE",
    "#FF8042",
    "#8884D8",
    "#82CA9D",
  ];

  // Fetch all jobs and prepare chart data
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await axios.get(
          "http://localhost:4000/api/quotation/get_all_jobs"
        );
        setJobs(response.data.jobs);

        // Prepare data for the chart
        const statusGroups = {
          "In Progress": 0,
          Pending: 0,
          "Completed Paid": 0,
          Cancelled: 0,
          Delivery: 0,
          Other: 0,
        };

        response.data.jobs.forEach((job) => {
          const status = (job.status || "").toLowerCase();
          if (status === "in progress" || status === "progress") {
            statusGroups["In Progress"]++;
          } else if (status === "pending") {
            statusGroups["Pending"]++;
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
            statusGroups["Cancelled"]++;
          } else if (status === "delivery" || status === "delivered") {
            statusGroups["Delivery"]++;
          } else {
            statusGroups["Other"]++;
          }
        });

        // Update summary box counts here
        setStatusCounts({
          progress: statusGroups["In Progress"],
          pending: statusGroups["Pending"],
          completedPaid: statusGroups["Completed Paid"],
          cancel: statusGroups["Cancelled"],
          delivery: statusGroups["Delivery"],
          total: response.data.jobs.length,
        });

        const data = Object.keys(statusGroups)
          .filter((key) => statusGroups[key] > 0) // Only include statuses with counts > 0
          .map((key) => ({
            name: key,
            value: statusGroups[key],
            percentage:
              ((statusGroups[key] / response.data.jobs.length) * 100).toFixed(
                1
              ) + "%",
          }));

        setChartData(data);
      } catch (err) {
        setError("Failed to fetch job data. Please try again later.");
        console.error("Error fetching jobs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  // Download chart as PDF
  const handleDownloadPDF = async () => {
    const chartElement = document.getElementById("job-status-chart");
    if (!chartElement) return;
    const canvas = await html2canvas(chartElement, { backgroundColor: "#fff" });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgWidth = pageWidth - 80;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.text("Job Status Distribution", pageWidth / 2, 40, { align: "center" });
    pdf.addImage(imgData, "PNG", 40, 60, imgWidth, imgHeight);
    pdf.save("job-status-distribution.pdf");
  };

  return (
    <div className="p-4">
      <h2 className="mb-4" style={{ color: "#1a2142", fontWeight: 600 }}>
        Job Management Analytics
      </h2>
      {/* Status summary boxes */}
      {!loading && !error && (
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginBottom: "24px",
            flexWrap: "wrap",
            justifyContent: "space-between", // add space between boxes
          }}
        >
          <div
            style={{
              background: "#1a2142", // dark blue
              padding: "16px",
              borderRadius: "8px",
              minWidth: "170px",
              textAlign: "center",
              color: "#fff",
            }}
          >
            <div style={{ fontWeight: 600 }}>Total Quotations</div>
            <div style={{ fontSize: "1.5rem" }}>{statusCounts.total}</div>
          </div>
          <div
            style={{
              background: "#ffc107", // bright yellow
              padding: "16px",
              borderRadius: "8px",
              minWidth: "170px",
              textAlign: "center",
              color: "#fff",
            }}
          >
            <div style={{ fontWeight: 600 }}>Progress</div>
            <div style={{ fontSize: "1.5rem" }}>{statusCounts.progress}</div>
          </div>
          <div
            style={{
              background: "#dc3545", // bright red
              padding: "16px",
              borderRadius: "8px",
              minWidth: "170px",
              textAlign: "center",
              color: "#fff",
            }}
          >
            <div style={{ fontWeight: 600 }}>Pending</div>
            <div style={{ fontSize: "1.5rem" }}>{statusCounts.pending}</div>
          </div>
          <div
            style={{
              background: "#28a745", // bright green
              padding: "16px",
              borderRadius: "8px",
              minWidth: "170px",
              textAlign: "center",
              color: "#fff",
            }}
          >
            <div style={{ fontWeight: 600 }}>Completed Paid</div>
            <div style={{ fontSize: "1.5rem" }}>
              {statusCounts.completedPaid}
            </div>
          </div>
          <div
            style={{
              background: "#fd7e14", // bright orange
              padding: "16px",
              borderRadius: "8px",
              minWidth: "170px",
              textAlign: "center",
              color: "#fff",
            }}
          >
            <div style={{ fontWeight: 600 }}>Cancel</div>
            <div style={{ fontSize: "1.5rem" }}>{statusCounts.cancel}</div>
          </div>
          <div
            style={{
              background: "#17a2b8", // bright cyan
              padding: "16px",
              borderRadius: "8px",
              minWidth: "170px",
              textAlign: "center",
              color: "#fff",
            }}
          >
            <div style={{ fontWeight: 600 }}>Delivery</div>
            <div style={{ fontSize: "1.5rem" }}>{statusCounts.delivery}</div>
          </div>
        </div>
      )}
      {/* Download PDF Button */}
      <div className="mb-3 text-end">
        <Button
          variant="outline-primary"
          style={{
            fontWeight: 500,
            borderRadius: "6px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
          onClick={handleDownloadPDF}
        >
          <i
            className="bi bi-file-earmark-arrow-down"
            style={{ marginRight: 6 }}
          ></i>
          Download PDF
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Pie Chart Visualization */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Card.Title className="text-center mb-3" style={{ color: "#1a2142" }}>
            Job Status Distribution
          </Card.Title>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading job data...</p>
            </div>
          ) : error ? (
            <Alert variant="danger" className="text-center">
              {error}
            </Alert>
          ) : (
            <>
              {/* Chart container for PDF export */}
              <div
                id="job-status-chart"
                style={{
                  height: "400px",
                  background: "#fff",
                  padding: "20px",
                  borderRadius: "10px",
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percentage }) => `${name}: ${percentage}`}
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name, props) => [
                        value,
                        `${name}: ${props.payload.percentage}`,
                      ]}
                    />
                    <Legend
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                      wrapperStyle={{ paddingTop: "20px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center mt-2">
                <small className="text-muted">
                  Showing data for {jobs.length} jobs
                </small>
              </div>
            </>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default JobManagementAnalyze;
