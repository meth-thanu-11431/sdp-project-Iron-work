import "bootstrap/dist/css/bootstrap.min.css";
import React, { useEffect, useState, useRef } from "react";
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

const InvoiceManagementAnalyze = () => {
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [chartData, setChartData] = useState([]);
  const chartRef = useRef(null);
  const [counts, setCounts] = useState({
    pending: 0,
    completed: 0,
    partiallyPaid: 0,
    total: 0,
  });

  // Color scheme for the chart
  const COLORS = ["#FFBB28", "#00C49F", "#0088FE", "#8884D8", "#FF8042"];

  useEffect(() => {
    const fetchInvoices = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(
          "http://localhost:4000/api/quotation/get_all"
        );
        setInvoices(res.data.invoices);

        // Prepare data for the chart
        const statusCounts = {
          Pending: 0,
          Completed: 0,
          "Partially Paid": 0,
          Other: 0,
        };

        res.data.invoices.forEach((inv) => {
          if (inv.payment_status) {
            const status = inv.payment_status.toLowerCase();
            if (status === "completed") {
              statusCounts["Completed"]++;
            } else if (status === "partially paid") {
              statusCounts["Partially Paid"]++;
            } else if (status === "pending") {
              statusCounts["Pending"]++;
            } else {
              statusCounts["Other"]++;
            }
          } else {
            statusCounts["Pending"]++; // Default to pending if no status
          }
        });

        // Update card counts here
        setCounts({
          total: res.data.invoices.length,
          pending: statusCounts["Pending"],
          completed: statusCounts["Completed"],
          partiallyPaid: statusCounts["Partially Paid"],
        });

        const data = Object.keys(statusCounts)
          .filter((key) => statusCounts[key] > 0)
          .map((key) => ({
            name: key,
            value: statusCounts[key],
            percentage:
              ((statusCounts[key] / res.data.invoices.length) * 100).toFixed(
                1
              ) + "%",
          }));

        setChartData(data);
      } catch (err) {
        console.error("Error fetching invoices:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  const handleDownloadPDF = async () => {
    const input = chartRef.current;
    if (!input) return;
    const canvas = await html2canvas(input, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.text("Invoice Status Distribution", 40, 40);
    pdf.addImage(imgData, "PNG", 40, 60, pdfWidth - 80, pdfHeight - 40);
    pdf.save("invoice-status-chart.pdf");
  };

  return (
    <div className="p-4">
      <h2 className="mb-4" style={{ color: "#1a2142", fontWeight: 600 }}>
        Invoice Management Analytics
      </h2>
      <div className="row mb-4">
        <div className="col-md-3 mb-2">
          <div className="card text-white bg-secondary h-100">
            <div className="card-body">
              <h6 className="card-title">Total Quotations</h6>
              <h3 className="card-text text-white font-bold">{counts.total}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-2">
          <div className="card text-white bg-warning h-100">
            <div className="card-body">
              <h6 className="card-title">Pending Quotations</h6>
              <h3 className="card-text text-white font-bold">
                {counts.pending}
              </h3>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-2">
          <div className="card text-white bg-success h-100">
            <div className="card-body">
              <h6 className="card-title">Completed Quotations</h6>
              <h3 className="card-text text-white font-bold">
                {counts.completed}
              </h3>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-2">
          <div className="card text-white bg-info h-100">
            <div className="card-body">
              <h6 className="card-title">Partially Paid Quotations</h6>
              <h3 className="card-text text-white font-bold">
                {counts.partiallyPaid}
              </h3>
            </div>
          </div>
        </div>
      </div>
      {/* Download PDF Button */}
      <div className="mb-3 d-flex justify-content-end">
        <button
          className="btn btn-outline-primary"
          style={{ fontWeight: 500, borderRadius: "8px" }}
          onClick={handleDownloadPDF}
        >
          <i className="bi bi-download" style={{ marginRight: "6px" }}></i>
          Download PDF
        </button>
      </div>
      {/* Pie Chart Visualization */}
      <div className="card mb-4 shadow-sm">
        <div className="card-body" ref={chartRef}>
          <h5
            className="card-title text-center mb-3"
            style={{ color: "#1a2142" }}
          >
            Invoice Status Distribution
          </h5>
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <>
              <div style={{ height: "400px" }}>
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
                  Showing data for {invoices.length} invoices
                </small>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceManagementAnalyze;
