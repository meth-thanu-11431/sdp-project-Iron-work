import {
  Alert,
  Badge,
  Button,
  Container,
  Form,
  Modal,
  Spinner,
  Table,
  Tabs,
  Tab,
  InputGroup,
  Image,
  Card
} from 'react-bootstrap';
import {
  Search,
  PencilSquare,
  PersonFill,
  SortUp,
  SortDown,
  ArrowClockwise,
  CheckCircleFill,
  XCircleFill,
  CurrencyDollar,
  BriefcaseFill,
  EnvelopeFill,
  PhoneFill,
  GeoAltFill
} from 'react-bootstrap-icons';
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useMediaQuery } from '@mui/material'; // Reusing your MUI dependency

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [activeTab, setActiveTab] = useState('all');
  const [lastDataRefresh, setLastDataRefresh] = useState(Date.now());
  const [refreshingData, setRefreshingData] = useState(false);
  
  // Responsive design handling
  const isMobile = useMediaQuery('(max-width:900px)');
  
  // Dynamic styles based on screen size
  const styles = {
    leftpart2: {
      transition: 'margin-left 0.3s ease',
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      marginLeft: isMobile ? '0' : '240px', // Match sidebar width
      width: isMobile ? '100%' : 'calc(100% - 240px)',
    },
    mainContainer: {
      padding: '1.5rem',
      maxWidth: '100%', // Full container width
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
    title: {
      color: '#1a2142',
      fontWeight: 600,
      margin: 0,
      fontSize: '1.5rem',
    },
    searchBar: {
      width: isMobile ? '100%' : '300px',
    },
    tableHead: {
      backgroundColor: '#f8fafc',
    },
    sortableHeader: {
      cursor: 'pointer',
    },
    avatar: {
      width: '60px', 
      height: '60px', 
      borderRadius: '50%', 
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '2px solid #e5e7eb'
    },
    avatarActive: {
      backgroundColor: '#4f46e5',
    },
    avatarInactive: {
      backgroundColor: '#94a3b8',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    },
    avatarInitial: {
      color: 'white',
      fontSize: '1.5rem',
      fontWeight: 'bold'
    },
    employeeName: {
      fontWeight: 'bold',
      color: '#334155'
    },
    statusBadge: {
      fontSize: '0.9rem', 
      padding: '6px 12px',
      display: 'inline-flex',
      alignItems: 'center'
    },
    actionButton: {
      width: '40px',
      height: '40px',
      borderRadius: '8px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    modalAvatar: {
      width: '120px', 
      height: '120px', 
      borderRadius: '50%', 
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '3px solid #e5e7eb'
    },
    modalAvatarInitial: {
      color: 'white',
      fontSize: '3rem',
      fontWeight: 'bold'
    },
    primaryButton: {
      backgroundColor: '#1a2142',
      borderColor: '#1a2142',
    },
    footerText: {
      fontSize: '0.875rem',
      color: '#64748b'
    },
    contactInfo: {
      fontSize: '0.9rem',
      color: '#64748b',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    infoIcon: {
      color: '#6b7280',
      fontSize: '0.9rem'
    },
    textMuted: {
      color: '#9ca3af',
      fontStyle: 'italic',
      fontSize: '0.85rem'
    }
  };

  // Fetch employees with error handling and loading state
  const fetchEmployees = useCallback(async (showLoadingState = true) => {
    try {
      if (showLoadingState) {
        setLoading(true);
      } else {
        setRefreshingData(true);
      }

      const response = await axios.get('http://localhost:4000/api/employee/get');
      
      // Normalize active status to boolean for consistent handling
      const normalizedEmployees = response.data.employees.map(emp => ({
        ...emp,
        active: emp.active === 1 || emp.active === true
      }));
      
      setEmployees(normalizedEmployees);
      setError('');
      setLastDataRefresh(Date.now());
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError('Failed to load employees. Please try again.');
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
    fetchEmployees();
  }, [fetchEmployees]);

  // Manual refresh handler
  const handleManualRefresh = async () => {
    setError('');
    await fetchEmployees(false);
  };

  // Update employee handler
  const handleUpdate = (employee) => {
    // Clone employee but ensure active is a boolean
    setSelectedEmployee({
      id: employee.id,
      name: employee.name,
      position: employee.position,
      salary: employee.salary,
      email: employee.email || '',
      phone: employee.phone || '',
      address: employee.address || '',
      active: employee.active,
      profileImage: employee.profileImage
    });
    setEditDialogOpen(true);
  };

  // Handle edit submission
  const handleSave = async () => {
    if (!selectedEmployee.name || !selectedEmployee.position || !selectedEmployee.salary) {
      alert('Please fill in all required fields.');
      return;
    }

    try {
      // Convert boolean active to number for backend
      const employeeToSave = {
        ...selectedEmployee,
        active: selectedEmployee.active ? 1 : 0
      };

      await axios.put('http://localhost:4000/api/employee/update', employeeToSave);
      fetchEmployees(false);
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating employee:', error);
      alert('Failed to update employee. Please try again.');
    }
  };

  // Toggle active status
  const handleToggleActive = async (employee) => {
    try {
      // Convert boolean active to number for backend
      const newStatus = employee.active ? 0 : 1;
      
      await axios.put('http://localhost:4000/api/employee/toggle-active', {
        id: employee.id,
        active: newStatus
      });
      
      // Immediately update local state with the new boolean value
      setEmployees(employees.map(emp =>
        emp.id === employee.id ? { ...emp, active: !emp.active } : emp
      ));
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Failed to update status.');
      // Refresh data from server in case of error
      await fetchEmployees(false);
    }
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

  // Filter and sort employees
  const getFilteredEmployees = () => {
    return employees
      .filter((emp) => {
        // Search filter
        const searchLower = search.toLowerCase();
        const matchesSearch = 
          (emp.name || '').toLowerCase().includes(searchLower) ||
          (emp.position || '').toLowerCase().includes(searchLower) ||
          (emp.salary?.toString() || '').includes(searchLower) ||
          (emp.email || '').toLowerCase().includes(searchLower) ||
          (emp.phone || '').toLowerCase().includes(searchLower) ||
          (emp.address || '').toLowerCase().includes(searchLower);

        // Tab filter - using boolean comparison
        if (activeTab === 'active') {
          return matchesSearch && emp.active === true;
        } else if (activeTab === 'inactive') {
          return matchesSearch && emp.active === false;
        } else {
          return matchesSearch; // All employees
        }
      })
      .sort((a, b) => {
        // Sorting logic
        let comparison = 0;
        
        if (sortField === 'name') {
          comparison = (a.name || '').localeCompare(b.name || '');
        } else if (sortField === 'position') {
          comparison = (a.position || '').localeCompare(b.position || '');
        } else if (sortField === 'salary') {
          comparison = parseFloat(a.salary || 0) - parseFloat(b.salary || 0);
        } else if (sortField === 'email') {
          comparison = (a.email || '').localeCompare(b.email || '');
        } else if (sortField === 'phone') {
          comparison = (a.phone || '').localeCompare(b.phone || '');
        }
        
        return sortDirection === 'asc' ? comparison : -comparison;
      });
  };

  // Render the sort icon
  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return null;
    }
    return sortDirection === 'asc' ? 
      <SortUp className="ms-1" /> : 
      <SortDown className="ms-1" />;
  };

  // Get employee count by status - using strict boolean comparison 
  const getEmployeeCountByStatus = (status) => {
    if (status === 'active') {
      return employees.filter(emp => emp.active === true).length;
    } else if (status === 'inactive') {
      return employees.filter(emp => emp.active === false).length;
    }
    return employees.length;
  };

  // Get profile image
  const getProfileImage = (employee) => {
    if (employee.profileImage) {
      return `http://localhost:4000/images/${employee.profileImage}`;
    }
    return null;
  };

  return (
    <div style={styles.leftpart2}>
      <Container fluid style={styles.mainContainer}>
        <Card style={styles.card}>
          <Card.Header style={styles.cardHeader}>
            <div className="d-flex align-items-center">
              <PersonFill
                size={26}
                className="me-3"
                style={{ color: "#1a2142" }}
              />
              <h3 style={styles.title}>
                Employee Management
              </h3>
            </div>

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
          </Card.Header>

          <Card.Body className="p-0">
            {loading ? (
              <div className="d-flex justify-content-center my-5">
                <Spinner animation="border" variant="primary" />
                <span className="ms-3">Loading employee data...</span>
              </div>
            ) : error ? (
              <Alert variant="danger" className="m-4" onClose={() => setError('')} dismissible>
                {error}
              </Alert>
            ) : (
              <>
                <div className="p-4">
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-start mb-3 gap-3">
                    <Tabs
                      activeKey={activeTab}
                      onSelect={(k) => setActiveTab(k)}
                      className="mb-3 flex-grow-1"
                    >
                      <Tab 
                        eventKey="all" 
                        title={
                          <span>
                            All Employees <Badge bg="secondary" className="ms-1">{employees.length}</Badge>
                          </span>
                        }
                      />
                      <Tab 
                        eventKey="active" 
                        title={
                          <span>
                            Active <Badge bg="success" className="ms-1">{getEmployeeCountByStatus('active')}</Badge>
                          </span>
                        }
                      />
                      <Tab 
                        eventKey="inactive" 
                        title={
                          <span>
                            Inactive <Badge bg="danger" className="ms-1">{getEmployeeCountByStatus('inactive')}</Badge>
                          </span>
                        }
                      />
                    </Tabs>
                    
                    <div style={styles.searchBar}>
                      <InputGroup>
                        <Form.Control
                          placeholder="Search employees..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                        />
                        <InputGroup.Text>
                          <Search />
                        </InputGroup.Text>
                      </InputGroup>
                    </div>
                  </div>

                  {getFilteredEmployees().length === 0 ? (
                    <Alert variant="info">
                      No employees found matching your search criteria.
                    </Alert>
                  ) : (
                    <div className="shadow-sm rounded">
                      <div className="table-responsive">
                        <Table hover responsive className="align-middle mb-0">
                          <thead style={styles.tableHead}>
                            <tr>
                              <th style={{ width: '15%' }}>Profile</th>
                              <th 
                                style={{ ...styles.sortableHeader, width: '15%' }}
                                onClick={() => handleSort('name')}
                              >
                                <div className="d-flex align-items-center">
                                  Name {renderSortIcon('name')}
                                </div>
                              </th>
                              <th 
                                style={{ ...styles.sortableHeader, width: '15%' }}
                                onClick={() => handleSort('position')}
                              >
                                <div className="d-flex align-items-center">
                                  Position {renderSortIcon('position')}
                                </div>
                              </th>
                              <th 
                                style={{ ...styles.sortableHeader, width: '10%' }}
                                onClick={() => handleSort('salary')}
                              >
                                <div className="d-flex align-items-center">
                                  Salary {renderSortIcon('salary')}
                                </div>
                              </th>
                              <th 
                                style={{ ...styles.sortableHeader, width: '15%' }}
                                onClick={() => handleSort('phone')}
                              >
                                <div className="d-flex align-items-center">
                                  Contact Info {renderSortIcon('phone')}
                                </div>
                              </th>
                              <th style={{ width: '10%' }}>Status</th>
                              <th style={{ width: '10%' }} className="text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getFilteredEmployees().map((employee) => (
                              <tr key={employee.id}>
                                <td>
                                  <div className="d-flex align-items-center">
                                    <div 
                                      style={{
                                        ...styles.avatar,
                                        ...(employee.active === true ? styles.avatarActive : styles.avatarInactive)
                                      }}
                                    >
                                      {employee.profileImage ? (
                                        <Image 
                                          src={getProfileImage(employee)} 
                                          alt={employee.name}
                                          style={styles.avatarImage} 
                                          roundedCircle
                                        />
                                      ) : (
                                        <span style={styles.avatarInitial}>
                                          {employee.name.charAt(0)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td style={styles.employeeName}>
                                  {employee.name}
                                </td>
                                <td style={{ color: '#64748b' }}>
                                  <div className="d-flex align-items-center">
                                    <BriefcaseFill className="me-2" size={14} />
                                    {employee.position}
                                  </div>
                                </td>
                                <td style={{ color: '#64748b' }}>
                                  <div className="d-flex align-items-center">
                                    <span className="me-1">LKR</span>
                                    {parseFloat(employee.salary).toLocaleString()}
                                  </div>
                                </td>
                                <td>
                                  <div>
                                    {employee.email ? (
                                      <div style={styles.contactInfo} className="mb-1">
                                        <EnvelopeFill size={14} style={styles.infoIcon} />
                                        {employee.email}
                                      </div>
                                    ) : (
                                      <div className="mb-1" style={styles.textMuted}>No email</div>
                                    )}
                                    
                                    {employee.phone ? (
                                      <div style={styles.contactInfo}>
                                        <PhoneFill size={14} style={styles.infoIcon} />
                                        {employee.phone}
                                      </div>
                                    ) : (
                                      <div style={styles.textMuted}>No phone</div>
                                    )}
                                  </div>
                                </td>
                                <td>
                                  <Badge 
                                    bg={employee.active === true ? 'success' : 'danger'}
                                    style={styles.statusBadge}
                                  >
                                    {employee.active === true ? 
                                      <><CheckCircleFill className="me-1" /> Active</> : 
                                      <><XCircleFill className="me-1" /> Inactive</>
                                    }
                                  </Badge>
                                </td>
                                <td className="text-center">
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => handleUpdate(employee)}
                                    className="me-2"
                                    style={styles.actionButton}
                                  >
                                    <PencilSquare size={18} />
                                  </Button>
                                  <Button
                                    variant={employee.active === true ? "outline-danger" : "outline-success"}
                                    size="sm"
                                    onClick={() => handleToggleActive(employee)}
                                    style={styles.actionButton}
                                  >
                                    {employee.active === true ? 
                                      <XCircleFill size={18} /> : 
                                      <CheckCircleFill size={18} />
                                    }
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </Card.Body>
          
          {!loading && !error && getFilteredEmployees().length > 0 && (
            <Card.Footer className="d-flex justify-content-between align-items-center py-3 px-4">
              <span style={styles.footerText}>
                Showing {getFilteredEmployees().length} of {employees.length} employees
              </span>
              <span style={styles.footerText}>
                Last updated: {new Date(lastDataRefresh).toLocaleTimeString()}
              </span>
            </Card.Footer>
          )}
        </Card>

        {/* Edit Employee Modal */}
        <Modal 
          show={editDialogOpen} 
          onHide={() => setEditDialogOpen(false)}
          centered
          size="lg"
        >
          <Modal.Header closeButton className="bg-light">
            <Modal.Title>
              <div className="d-flex align-items-center">
                <PersonFill className="me-2" />
                Update Employee
              </div>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedEmployee && (
              <Form>
                <div className="d-flex justify-content-center mb-4">
                  <div 
                    style={{
                      ...styles.modalAvatar,
                      ...(selectedEmployee.active === true ? styles.avatarActive : styles.avatarInactive)
                    }}
                  >
                    {selectedEmployee.profileImage ? (
                      <Image 
                        src={getProfileImage(selectedEmployee)} 
                        alt={selectedEmployee.name}
                        style={styles.avatarImage} 
                        roundedCircle
                      />
                    ) : (
                      <span style={styles.modalAvatarInitial}>
                        {selectedEmployee.name?.charAt(0) || 'E'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <h5 className="border-bottom pb-2 mb-3">Basic Information</h5>
                  <Form.Group className="mb-3">
                    <Form.Label>Name <span className="text-danger">*</span></Form.Label>
                    <Form.Control 
                      type="text" 
                      value={selectedEmployee.name || ''}
                      onChange={(e) => setSelectedEmployee({
                        ...selectedEmployee,
                        name: e.target.value
                      })}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Position <span className="text-danger">*</span></Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <BriefcaseFill />
                      </InputGroup.Text>
                      <Form.Control 
                        type="text" 
                        value={selectedEmployee.position || ''}
                        onChange={(e) => setSelectedEmployee({
                          ...selectedEmployee,
                          position: e.target.value
                        })}
                        required
                      />
                    </InputGroup>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Salary (LKR) <span className="text-danger">*</span></Form.Label>
                    <InputGroup>
                      <InputGroup.Text>LKR</InputGroup.Text>
                      <Form.Control 
                        type="number" 
                        value={selectedEmployee.salary || ''}
                        onChange={(e) => setSelectedEmployee({
                          ...selectedEmployee,
                          salary: e.target.value
                        })}
                        min="0"
                        required
                      />
                    </InputGroup>
                  </Form.Group>
                </div>

                <div className="mb-4">
                  <h5 className="border-bottom pb-2 mb-3">Contact Information</h5>
                  <Form.Group className="mb-3">
                    <Form.Label>Email Address</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <EnvelopeFill />
                      </InputGroup.Text>
                      <Form.Control 
                        type="email" 
                        value={selectedEmployee.email || ''}
                        onChange={(e) => setSelectedEmployee({
                          ...selectedEmployee,
                          email: e.target.value
                        })}
                        placeholder="employee@example.com"
                      />
                    </InputGroup>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Phone Number</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <PhoneFill />
                      </InputGroup.Text>
                      <Form.Control 
                        type="tel" 
                        value={selectedEmployee.phone || ''}
                        onChange={(e) => setSelectedEmployee({
                          ...selectedEmployee,
                          phone: e.target.value
                        })}
                        placeholder="+94 XX XXX XXXX"
                      />
                    </InputGroup>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Address</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <GeoAltFill />
                      </InputGroup.Text>
                      <Form.Control 
                        as="textarea" 
                        rows={2}
                        value={selectedEmployee.address || ''}
                        onChange={(e) => setSelectedEmployee({
                          ...selectedEmployee,
                          address: e.target.value
                        })}
                        placeholder="Residential address"
                      />
                    </InputGroup>
                  </Form.Group>
                </div>

                <div className="mb-3">
                  <h5 className="border-bottom pb-2 mb-3">Status</h5>
                  <Form.Group>
                    <div>
                      <Form.Check
                        type="radio"
                        label="Active"
                        name="status"
                        id="status-active"
                        checked={selectedEmployee.active === true}
                        onChange={() => setSelectedEmployee({
                          ...selectedEmployee,
                          active: true
                        })}
                        className="mb-2"
                      />
                      <Form.Check
                        type="radio"
                        label="Inactive"
                        name="status"
                        id="status-inactive"
                        checked={selectedEmployee.active === false}
                        onChange={() => setSelectedEmployee({
                          ...selectedEmployee,
                          active: false
                        })}
                      />
                    </div>
                  </Form.Group>
                </div>
              </Form>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSave}
              style={styles.primaryButton}
            >
              Save Changes
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};

export default EmployeeList;