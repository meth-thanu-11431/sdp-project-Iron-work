import { Card, Button, Row, Col } from "react-bootstrap";
import React, { useEffect, useState, useRef } from "react";
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

const QuotationManagementAnalyze = () => {
  const [quotations, setQuotations] = useState([]);
  const [chartData, setChartData] = useState([]);
  const chartRef = useRef(null);
  const [counts, setCounts] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  // Color scheme for the chart
  const COLORS = ["#0088FE", "#FFBB28", "#00C49F", "#FF8042", "#8884D8"];

  // Fetch Quotations
  useEffect(() => {
    const fetchQuotations = async () => {
      try {
        const response = await fetch(
          "http://localhost:4000/api/quotation/admin"
        );
        const data = await response.json();
        if (data.success) {
          setQuotations(data.quotations);
        } else {
          console.error("Failed to fetch quotations:", data.message);
        }
      } catch (error) {
        console.error("Error fetching quotations:", error);
      }
    };
    fetchQuotations();
  }, []);

  // Prepare chart data
  useEffect(() => {
    const statusCounts = {
      Pending: 0,
      Approved: 0,
      Rejected: 0,
      Other: 0,
    };

    quotations.forEach((q) => {
      if (statusCounts.hasOwnProperty(q.status)) {
        statusCounts[q.status]++;
      } else {
        statusCounts["Other"]++;
      }
    });

    const data = Object.keys(statusCounts)
      .filter((key) => statusCounts[key] > 0) // Only include statuses with counts > 0
      .map((key) => ({
        name: key,
        value: statusCounts[key],
        percentage:
          ((statusCounts[key] / quotations.length) * 100).toFixed(1) + "%",
      }));

    setChartData(data);
  }, [quotations]);

  // Download chart as PDF
  const handleDownloadPDF = async () => {
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
    pdf.text("Quotation Status Distribution", 40, 40);
    pdf.addImage(imgData, "PNG", 40, 60, imgWidth, imgHeight);
    pdf.save("quotation-status-chart.pdf");
  };
  // Count quotations by status
  useEffect(() => {
    const total = quotations.length;
    const pending = quotations.filter((q) => q.status === "Pending").length;
    const approved = quotations.filter((q) => q.status === "Approved").length;
    const rejected = quotations.filter((q) => q.status === "Rejected").length;
    setCounts({ total, pending, approved, rejected });
  }, [quotations]);

  return (
    <div className="p-4">
      <h2 className="mb-4" style={{ color: "#1a2142", fontWeight: 600 }}>
        Quotation Management Analytics
      </h2>
      <Row className="mb-4">
        <Col md={3} sm={6} xs={12} className="mb-2">
          <Card bg="primary" text="white" className="text-center">
            <Card.Body>
              <Card.Title>Total Quotations</Card.Title>
              <Card.Text style={{ fontSize: "1.5rem", fontWeight: 700 ,color: "white"}}>
                {counts.total}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6} xs={12} className="mb-2">
          <Card bg="warning" text="dark" className="text-center">
            <Card.Body>
              <Card.Title>Pending</Card.Title>
              <Card.Text style={{ fontSize: "1.5rem", fontWeight: 700 ,color: "white" }}>
                {counts.pending}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6} xs={12} className="mb-2">
          <Card bg="success" text="white" className="text-center">
            <Card.Body>
              <Card.Title>Approved</Card.Title>
              <Card.Text style={{ fontSize: "1.5rem", fontWeight: 700 ,color: "white"}}>
                {counts.approved}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6} xs={12} className="mb-2">
          <Card bg="danger" text="white" className="text-center">
            <Card.Body>
              <Card.Title>Rejected</Card.Title>
              <Card.Text style={{ fontSize: "1.5rem", fontWeight: 700 ,color: "white"}}>
                {counts.rejected}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      {/* Download PDF Button */}
      <div className="mb-3 text-end">
        <Button
          variant="primary"
          style={{
            backgroundColor: "#1a2142",
            borderColor: "#1a2142",
            fontWeight: 500,
            borderRadius: "6px",
            padding: "8px 20px",
            boxShadow: "0 2px 8px rgba(26,33,66,0.08)",
          }}
          onClick={handleDownloadPDF}
        >
          Download PDF
        </Button>
      </div>

      {/* Pie Chart Visualization */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Card.Title className="text-center mb-3" style={{ color: "#1a2142" }}>
            Quotation Status Distribution
          </Card.Title>
          <div style={{ height: "400px" }} ref={chartRef}>
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
              Total Quotations: {quotations.length}
            </small>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default QuotationManagementAnalyze;
