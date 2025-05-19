import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Row,
  Spinner
} from 'react-bootstrap';
import {
  FileEarmarkArrowDown,
  BoxSeam,
  ExclamationTriangle,
  Percent,
  Download
} from 'react-bootstrap-icons';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useMediaQuery } from '@mui/material'; // Reusing your MUI dependency

const MaterialListAnalyze = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMobile = useMediaQuery('(max-width:900px)');

  // Inline styles object for reuse and better organization
  const styles = {
    leftpart2: {
      transition: 'margin-left 0.3s ease',
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      marginLeft: isMobile ? '0' : '240px', // Match your sidebar width
      width: isMobile ? '100%' : 'calc(100% - 240px)',
    },
    card: {
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      borderRadius: '8px',
      border: 'none',
    },
    cardHeader: {
      backgroundColor: 'white',
      borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
      padding: '1rem 1.5rem',
      borderTopLeftRadius: '8px',
      borderTopRightRadius: '8px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardTitle: {
      margin: 0,
      color: '#1a2142',
      fontWeight: 600,
    },
    statsCard: {
      borderRadius: '8px',
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
    },
    statsCardPrimary: {
      borderLeft: '4px solid #4361ee',
    },
    statsCardWarning: {
      borderLeft: '4px solid #f59e0b',
    },
    statsCardInfo: {
      borderLeft: '4px solid #0ea5e9',
    },
    statsNumber: {
      fontSize: '2rem',
      fontWeight: 700,
      color: '#1a2142',
      marginBottom: '0.25rem',
    },
    statsLabel: {
      color: '#64748b',
      fontWeight: 500,
    },
    iconContainer: {
      width: '50px',
      height: '50px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconContainerPrimary: {
      backgroundColor: 'rgba(67, 97, 238, 0.1)',
    },
    iconContainerWarning: {
      backgroundColor: 'rgba(245, 158, 11, 0.1)',
    },
    iconContainerInfo: {
      backgroundColor: 'rgba(14, 165, 233, 0.1)',
    },
    chartContainer: {
      height: '400px',
      width: '100%',
    },
    emptyState: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 0',
      color: '#64748b',
    },
    emptyStateIcon: {
      fontSize: '3rem',
      color: '#cbd5e1',
      marginBottom: '1rem',
    },
    lowStockBadge: {
      backgroundColor: '#fef2f2',
      color: '#b91c1c',
      padding: '6px 12px',
      borderRadius: '6px',
      fontWeight: 600,
      fontSize: '0.9rem',
      display: 'flex',
      alignItems: 'center',
    },
    cardFooter: {
      backgroundColor: 'white',
      borderTop: '1px solid rgba(0, 0, 0, 0.1)',
      padding: '0.75rem 1.5rem',
      color: '#64748b',
      fontSize: '0.875rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    titleWithIcon: {
      display: 'flex',
      alignItems: 'center',
    },
    listItem: {
      fontWeight: 500,
      color: '#334155',
    }
  };

  // Fetch materials data from backend
  useEffect(() => {
    axios
      .get('http://localhost:4000/api/material/get')
      .then((response) => {
        setMaterials(response.data.materials);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching materials:", err);
        setError('Failed to fetch materials. Please try again.');
        setLoading(false);
      });
  }, []);

  // Prepare chart data - sort by quantity and limit to top 20 for better visualization
  const chartData = materials
    .map(material => ({
      name: material.itemName,
      quantity: parseInt(material.availableQty)
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 20);

  // Download chart as PDF
  const handleDownloadPDF = async () => {
    const chartElement = document.getElementById("material-bar-chart");
    if (!chartElement) return;
    
    try {
      const canvas = await html2canvas(chartElement, { 
        backgroundColor: "#fff",
        scale: 2 // Higher quality
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape", // Changed to landscape for better chart fit
        unit: "pt",
        format: "a4",
      });
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 80;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.text("Material Inventory Analysis", pageWidth / 2, 40, { align: "center" });
      pdf.addImage(imgData, "PNG", 40, 60, imgWidth, imgHeight);
      pdf.save("material-inventory-analysis.pdf");
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  const LOW_STOCK_THRESHOLD = 10;
  const lowStockMaterials = materials.filter(
    (material) => parseInt(material.availableQty) < LOW_STOCK_THRESHOLD
  );

  return (
    <div style={styles.leftpart2}>
      <Container fluid style={{ padding: '1.25rem' }}>
        <Card style={styles.card}>
          {/* Card Header */}
          <Card.Header style={styles.cardHeader}>
            <div style={styles.titleWithIcon}>
              <BoxSeam size={26} style={{ marginRight: '0.75rem', color: '#1a2142' }} />
              <h3 style={styles.cardTitle}>
                Inventory Dashboard
              </h3>
            </div>
            
            <Button
              variant="outline-primary"
              onClick={handleDownloadPDF}
              style={{
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Download style={{ marginRight: '0.5rem' }} />
              Export Report
            </Button>
          </Card.Header>
          
          <Card.Body style={{ padding: '1.5rem' }}>
            {/* Stats Cards */}
            <Row className="mb-4">
              <Col md={4} className="mb-3 mb-md-0">
                <Card style={{...styles.statsCard, ...styles.statsCardPrimary}}>
                  <Card.Body style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '0.75rem 1.25rem' 
                  }}>
                    <div>
                      <h5 style={styles.statsNumber}>
                        {materials.length}
                      </h5>
                      <div style={styles.statsLabel}>Total Materials</div>
                    </div>
                    <div style={{...styles.iconContainer, ...styles.iconContainerPrimary}}>
                      <BoxSeam size={24} style={{ color: '#4361ee' }} />
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={4} className="mb-3 mb-md-0">
                <Card style={{...styles.statsCard, ...styles.statsCardWarning}}>
                  <Card.Body style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '0.75rem 1.25rem' 
                  }}>
                    <div>
                      <h5 style={styles.statsNumber}>
                        {lowStockMaterials.length}
                      </h5>
                      <div style={styles.statsLabel}>Low Stock Items</div>
                    </div>
                    <div style={{...styles.iconContainer, ...styles.iconContainerWarning}}>
                      <ExclamationTriangle size={24} style={{ color: '#f59e0b' }} />
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={4}>
                <Card style={{...styles.statsCard, ...styles.statsCardInfo}}>
                  <Card.Body style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '0.75rem 1.25rem' 
                  }}>
                    <div>
                      <h5 style={styles.statsNumber}>
                        {materials.length > 0 
                          ? `${Math.round((lowStockMaterials.length / materials.length) * 100)}%` 
                          : '0%'}
                      </h5>
                      <div style={styles.statsLabel}>Low Stock Ratio</div>
                    </div>
                    <div style={{...styles.iconContainer, ...styles.iconContainerInfo}}>
                      <Percent size={24} style={{ color: '#0ea5e9' }} />
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <Row>
              {/* Chart Section */}
              <Col lg={8} className="mb-4 mb-lg-0">
                <Card style={{ ...styles.card, height: '100%' }}>
                  <Card.Header style={{
                    backgroundColor: 'white',
                    borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
                    padding: '1rem 1.25rem',
                    borderTopLeftRadius: '8px',
                    borderTopRightRadius: '8px',
                  }}>
                    <h5 style={styles.cardTitle}>Material Quantity Analysis</h5>
                    <div style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                      Top {chartData.length} materials by quantity
                    </div>
                  </Card.Header>
                  
                  <Card.Body>
                    {loading ? (
                      <div style={{ 
                        textAlign: 'center', 
                        padding: '2.5rem 0' 
                      }}>
                        <Spinner animation="border" variant="primary" />
                        <p style={{ marginTop: '0.75rem' }}>Loading materials data...</p>
                      </div>
                    ) : error ? (
                      <Alert variant="danger" style={{ margin: '1rem' }}>
                        {error}
                      </Alert>
                    ) : materials.length === 0 ? (
                      <div style={styles.emptyState}>
                        <BoxSeam style={styles.emptyStateIcon} />
                        <p>No materials found in inventory</p>
                      </div>
                    ) : (
                      <div id="material-bar-chart" style={styles.chartContainer}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={chartData}
                            margin={{
                              top: 20,
                              right: 30,
                              left: 20,
                              bottom: 60,
                            }}
                            layout="vertical"
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis 
                              type="number" 
                              label={{ value: 'Quantity', position: 'bottom', fill: '#64748b' }} 
                              tick={{ fill: '#64748b' }}
                            />
                            <YAxis
                              type="category"
                              dataKey="name"
                              width={150}
                              tick={{ fontSize: 12, fill: '#64748b' }}
                              label={{ value: 'Material Name', angle: -90, position: 'left', fill: '#64748b' }}
                            />
                            <Tooltip
                              formatter={(value) => [`${value} units`, 'Quantity']}
                              contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                              }}
                            />
                            <Legend />
                            <Bar
                              dataKey="quantity"
                              name="Available "
                              fill="#4361ee"
                              radius={[0, 4, 4, 0]}
                              barSize={20}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
              
              {/* Low Stock Section */}
              <Col lg={4}>
                <Card style={{ ...styles.card, height: '100%' }}>
                  <Card.Header style={{
                    backgroundColor: 'white',
                    borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
                    padding: '1rem 1.25rem',
                    borderTopLeftRadius: '8px',
                    borderTopRightRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <div>
                      <h5 style={styles.cardTitle}>Low Stock Alerts</h5>
                      <div style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        Items below {LOW_STOCK_THRESHOLD} units
                      </div>
                    </div>
                    <div style={{ 
                      backgroundColor: '#dc3545', 
                      color: 'white', 
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.875rem',
                    }}>
                      {lowStockMaterials.length}
                    </div>
                  </Card.Header>
                  
                  <Card.Body style={{ padding: 0 }}>
                    {loading ? (
                      <div style={{ 
                        textAlign: 'center', 
                        padding: '2.5rem 0' 
                      }}>
                        <Spinner animation="border" variant="primary" />
                      </div>
                    ) : lowStockMaterials.length === 0 ? (
                      <div style={styles.emptyState}>
                        <BoxSeam style={styles.emptyStateIcon} />
                        <p>No low stock materials</p>
                      </div>
                    ) : (
                      <div className="list-group list-group-flush">
                        {lowStockMaterials.map((material, index) => (
                          <div 
                            key={material.id || index} 
                            className="list-group-item"
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '0.75rem 1.25rem'
                            }}
                          >
                            <div style={styles.listItem}>
                              {material.itemName}
                            </div>
                            <div style={styles.lowStockBadge}>
                              <ExclamationTriangle size={14} style={{ marginRight: '0.25rem' }} />
                              {material.availableQty} units
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Card.Body>
          
          <Card.Footer style={styles.cardFooter}>
            <span>
              Dashboard data is updated in real-time with inventory changes
            </span>
            <span>
              Last updated: {new Date().toLocaleTimeString()}
            </span>
          </Card.Footer>
        </Card>
      </Container>
    </div>
  );
};

export default MaterialListAnalyze;