import { 
  Alert, 
  Spinner, 
  Table, 
  Card, 
  Row, 
  Col, 
  Badge, 
  Form,
  Button 
} from 'react-bootstrap';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  FaTools, 
  FaSearch, 
  FaInfoCircle, 
  FaCalendarAlt, 
  FaCalendarCheck, 
  FaClipboardList,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaHammer,
  FaTasks,
  FaSyncAlt
} from 'react-icons/fa';
import { BsBarChart, BsClipboardCheck, BsClipboardX } from 'react-icons/bs';

const JobsByUser = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('start_date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [stats, setStats] = useState({
    totalJobs: 0,
    completedJobs: 0,
    ongoingJobs: 0,
    pendingJobs: 0
  });

  const fetchJobs = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Not authorized. Please log in.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        'http://localhost:4000/api/quotation/get_job',
        {},
        { headers: { token } }
      );
      
      const fetchedJobs = response.data.jobs || [];
      setJobs(fetchedJobs);
      
      // Calculate statistics
      const completedCount = fetchedJobs.filter(job => 
        job.status === 'Completed' || job.status === 'Finished'
      ).length;
      
      const ongoingCount = fetchedJobs.filter(job => 
        job.status === 'In Progress' || job.status === 'Started'
      ).length;
      
      const pendingCount = fetchedJobs.filter(job => 
        job.status === 'Pending' || job.status === 'Not Started'
      ).length;
      
      setStats({
        totalJobs: fetchedJobs.length,
        completedJobs: completedCount,
        ongoingJobs: ongoingCount,
        pendingJobs: pendingCount
      });
      
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError('Unauthorized. Please log in again.');
      } else {
        setError('Error fetching jobs. Please try again later.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // Filter and sort jobs
  const getFilteredData = () => {
    return jobs
      .filter((job) => {
        // Search functionality
        const searchLower = searchTerm.toLowerCase();
        return (
          searchTerm === '' ||
          job.id?.toString().toLowerCase().includes(searchLower) ||
          job.job_category?.toLowerCase().includes(searchLower) ||
          job.status?.toLowerCase().includes(searchLower)
        );
      })
      .sort((a, b) => {
        // Handle sorting
        if (sortField === 'start_date') {
          return sortDirection === 'asc'
            ? new Date(a.start_date) - new Date(b.start_date)
            : new Date(b.start_date) - new Date(a.start_date);
        }
        
        if (sortField === 'finish_date') {
          // Handle null finish dates
          if (!a.finish_date && !b.finish_date) return 0;
          if (!a.finish_date) return sortDirection === 'asc' ? -1 : 1;
          if (!b.finish_date) return sortDirection === 'asc' ? 1 : -1;
          
          return sortDirection === 'asc'
            ? new Date(a.finish_date) - new Date(b.finish_date)
            : new Date(b.finish_date) - new Date(a.finish_date);
        }
        
        // Default string comparison for other fields
        const valA = String(a[sortField] || '');
        const valB = String(b[sortField] || '');
        
        return sortDirection === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      });
  };

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Function to get status badge
  const getStatusBadge = (status) => {
    const lowerStatus = (status || '').toLowerCase();
    
    if (lowerStatus.includes('complete') || lowerStatus.includes('finish')) {
      return (
        <Badge bg="success" className="px-3 py-2 d-flex align-items-center">
          <FaCheckCircle className="me-1" size={12} /> {status}
        </Badge>
      );
    } else if (lowerStatus.includes('progress') || lowerStatus.includes('start')) {
      return (
        <Badge bg="primary" className="px-3 py-2 d-flex align-items-center">
          <FaHammer className="me-1" size={12} /> {status}
        </Badge>
      );
    } else if (lowerStatus.includes('pending') || lowerStatus.includes('not')) {
      return (
        <Badge bg="warning" className="px-3 py-2 d-flex align-items-center">
          <FaClock className="me-1" size={12} /> {status}
        </Badge>
      );
    } else if (lowerStatus.includes('cancel') || lowerStatus.includes('reject')) {
      return (
        <Badge bg="danger" className="px-3 py-2 d-flex align-items-center">
          <FaTimesCircle className="me-1" size={12} /> {status}
        </Badge>
      );
    } else {
      return (
        <Badge bg="secondary" className="px-3 py-2 d-flex align-items-center">
          <FaInfoCircle className="me-1" size={12} /> {status}
        </Badge>
      );
    }
  };

  // Calculate job duration in days
  const calculateDuration = (startDate, finishDate) => {
    if (!startDate) return 'N/A';
    
    const start = new Date(startDate);
    const end = finishDate ? new Date(finishDate) : new Date();
    
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  };

  // Display a formatted date or 'N/A'
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
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
            My Jobs
          </Card.Title>
          
          {/* Summary cards */}
          <Row className="mb-4 g-3">
            {/* Total Jobs */}
            <Col md={3}>
              <Card className="border-0 shadow-sm bg-light h-100">
                <Card.Body className="d-flex align-items-center">
                  <div className="rounded-circle me-3 d-flex justify-content-center align-items-center" 
                       style={{ 
                         backgroundColor: "#e3f2fd", 
                         width: "50px", 
                         height: "50px" 
                       }}>
                    <FaClipboardList size={22} style={{ color: "#1976d2" }} />
                  </div>
                  <div>
                    <Card.Title className="mb-1 h6">Total Jobs</Card.Title>
                    <h3 className="mb-0 text-primary">{stats.totalJobs}</h3>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            {/* Completed Jobs */}
            <Col md={3}>
              <Card className="border-0 shadow-sm bg-light h-100">
                <Card.Body className="d-flex align-items-center">
                  <div className="rounded-circle me-3 d-flex justify-content-center align-items-center" 
                       style={{ 
                         backgroundColor: "#e8f5e9", 
                         width: "50px", 
                         height: "50px" 
                       }}>
                    <BsClipboardCheck size={22} style={{ color: "#388e3c" }} />
                  </div>
                  <div>
                    <Card.Title className="mb-1 h6">Completed</Card.Title>
                    <h3 className="mb-0 text-success">{stats.completedJobs}</h3>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            {/* Ongoing Jobs */}
            <Col md={3}>
              <Card className="border-0 shadow-sm bg-light h-100">
                <Card.Body className="d-flex align-items-center">
                  <div className="rounded-circle me-3 d-flex justify-content-center align-items-center" 
                       style={{ 
                         backgroundColor: "#e3f2fd", 
                         width: "50px", 
                         height: "50px" 
                       }}>
                    <FaTasks size={20} style={{ color: "#1976d2" }} />
                  </div>
                  <div>
                    <Card.Title className="mb-1 h6">In Progress</Card.Title>
                    <h3 className="mb-0 text-primary">{stats.ongoingJobs}</h3>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            {/* Pending Jobs */}
            <Col md={3}>
              <Card className="border-0 shadow-sm bg-light h-100">
                <Card.Body className="d-flex align-items-center">
                  <div className="rounded-circle me-3 d-flex justify-content-center align-items-center" 
                       style={{ 
                         backgroundColor: "#fff8e1", 
                         width: "50px", 
                         height: "50px" 
                       }}>
                    <FaClock size={20} style={{ color: "#f57c00" }} />
                  </div>
                  <div>
                    <Card.Title className="mb-1 h6">Pending</Card.Title>
                    <h3 className="mb-0 text-warning">{stats.pendingJobs}</h3>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Search and refresh controls */}
          <Row className="mb-3 align-items-center">
            <Col md={6} className="mb-2 mb-md-0">
              <div className="position-relative">
                <Form.Control
                  type="text"
                  placeholder="Search by job ID, category, or status..."
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
                variant="outline-primary"
                onClick={() => fetchJobs()}
                className="d-inline-flex align-items-center"
              >
                <FaSyncAlt className="me-2" />
                Refresh Jobs
              </Button>
            </Col>
          </Row>

          {/* Error message */}
          {error && (
            <Alert variant="danger" className="mb-3 d-flex align-items-center">
              <FaInfoCircle className="me-2" />
              <div>{error}</div>
            </Alert>
          )}

          {/* Display jobs */}
          {!error && filteredData.length === 0 ? (
            <Alert variant="info" className="border-0 shadow-sm">
              <div className="text-center py-4">
                <FaInfoCircle size={32} className="mb-3 text-info" />
                <h5>No jobs found</h5>
                <p className="mb-0 text-muted">
                  {searchTerm ? "No jobs match your search criteria." : "You don't have any jobs yet."}
                </p>
              </div>
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table hover bordered className="shadow-sm bg-white">
                <thead style={{ backgroundColor: "#f8fafc" }}>
                  <tr>
                    <th 
                      className="cursor-pointer" 
                      onClick={() => handleSort("id")}
                      style={{ cursor: "pointer", borderTop: "none" }}
                    >
                      Job ID
                      {sortField === "id" && (
                        <span className="ms-1">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </th>
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
                      onClick={() => handleSort("start_date")}
                      style={{ cursor: "pointer", borderTop: "none" }}
                    >
                      <div className="d-flex align-items-center">
                        <FaCalendarAlt className="me-1" size={14} />
                        Start Date
                        {sortField === "start_date" && (
                          <span className="ms-1">
                            {sortDirection === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="cursor-pointer" 
                      onClick={() => handleSort("finish_date")}
                      style={{ cursor: "pointer", borderTop: "none" }}
                    >
                      <div className="d-flex align-items-center">
                        <FaCalendarCheck className="me-1" size={14} />
                        Finish Date
                        {sortField === "finish_date" && (
                          <span className="ms-1">
                            {sortDirection === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      style={{ borderTop: "none" }}
                    >
                      Duration
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
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((job) => (
                    <tr key={job.id}>
                      <td className="align-middle">
                        <span className="fw-medium text-primary">
                          #{job.id}
                        </span>
                      </td>
                      <td className="align-middle">
                        <div className="d-flex align-items-center">
                          <FaTools className="me-2 text-secondary" size={14} />
                          <span>{job.job_category}</span>
                        </div>
                      </td>
                      <td className="align-middle">
                        {formatDate(job.start_date)}
                      </td>
                      <td className="align-middle">
                        {formatDate(job.finish_date)}
                      </td>
                      <td className="align-middle">
                        {calculateDuration(job.start_date, job.finish_date)}
                      </td>
                      <td className="align-middle">
                        {getStatusBadge(job.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default JobsByUser;