import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Form,
  Modal,
  Spinner,
  Table,
  Tabs,
  Tab,
  InputGroup
} from 'react-bootstrap';
import {
  Search,
  PencilSquare,
  TrashFill,
  SortUp,
  SortDown,
  ArrowClockwise,
  Tools,
  CheckCircleFill,
  ExclamationTriangleFill,
  XCircleFill
} from 'react-bootstrap-icons';
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useMediaQuery } from '@mui/material'; // Reusing your MUI dependency

const MachineList = () => {
  const [machines, setMachines] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortField, setSortField] = useState('id');
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
    machineImage: {
      width: '60px', 
      height: '60px', 
      borderRadius: '8px', 
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#e9ecef',
      border: '1px solid #dee2e6'
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
    modalImage: {
      width: '150px', 
      height: '150px', 
      borderRadius: '12px', 
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#e9ecef',
      border: '1px solid #dee2e6'
    },
    primaryButton: {
      backgroundColor: '#1a2142',
      borderColor: '#1a2142',
    },
    footerText: {
      fontSize: '0.875rem',
      color: '#64748b'
    },
    tabContainer: {
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      justifyContent: 'space-between',
      alignItems: isMobile ? 'stretch' : 'center',
      gap: '1rem',
      marginBottom: '1rem'
    }
  };

  // Fetch machines with error handling and loading state
  const fetchMachines = useCallback(async (showLoadingState = true) => {
    try {
      if (showLoadingState) {
        setLoading(true);
      } else {
        setRefreshingData(true);
      }

      const response = await axios.get('http://localhost:4000/api/machine/get');
      if (response.data.success) {
        setMachines(response.data.machines);
        setError('');
        setLastDataRefresh(Date.now());
      } else {
        setError('Failed to load machine data');
      }
    } catch (error) {
      console.error('Error fetching machines:', error);
      setError('Failed to load machines. Please try again.');
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
    fetchMachines();
  }, [fetchMachines]);

  // Manual refresh handler
  const handleManualRefresh = async () => {
    setError('');
    await fetchMachines(false);
  };

  // Edit machine handler
  const handleEditClick = (machine) => {
    setSelectedMachine(machine);
    setEditDialogOpen(true);
  };

  // Delete machine handler
  const handleDeleteClick = (machine) => {
    setSelectedMachine(machine);
    setDeleteDialogOpen(true);
  };

  // Handle edit submission
  const handleEditSubmit = async () => {
    try {
      const response = await axios.put('http://localhost:4000/api/machine/update', {
        id: selectedMachine.id,
        machineName: selectedMachine.machineName,
        description: selectedMachine.description,
        status: selectedMachine.status,
        hourlyRate: selectedMachine.hourlyRate,
      });

      if (response.data.success) {
        fetchMachines(false);
        setEditDialogOpen(false);
      }
    } catch (error) {
      console.error('Error updating machine:', error);
      // You can add a more user-friendly error handling here
    }
  };

  // Handle delete submission
  const handleDeleteSubmit = async () => {
    try {
      const response = await axios.delete('http://localhost:4000/api/machine/delete', {
        data: { id: selectedMachine.id },
      });

      if (response.data.success) {
        fetchMachines(false);
        setDeleteDialogOpen(false);
      }
    } catch (error) {
      console.error('Error deleting machine:', error);
      // You can add a more user-friendly error handling here
    }
  };

  // Function to get status styling
  const getStatusVariant = (status) => {
    switch (status) {
      case 'Active': return 'success';
      case 'In Maintenance': return 'warning';
      case 'Retired': return 'danger';
      default: return 'secondary';
    }
  };

  // Function to get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Active': return <CheckCircleFill className="me-1" />;
      case 'In Maintenance': return <ExclamationTriangleFill className="me-1" />;
      case 'Retired': return <XCircleFill className="me-1" />;
      default: return null;
    }
  };

  // Function to construct image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `http://localhost:4000/images/${imagePath}`;
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

  // Filter and sort machines
  const getFilteredMachines = () => {
    return machines
      .filter((machine) => {
        // Search filter
        const searchLower = search.toLowerCase();
        const matchesSearch =
          (machine.id?.toString() || '').toLowerCase().includes(searchLower) ||
          (machine.machineName || '').toLowerCase().includes(searchLower) ||
          (machine.description || '').toLowerCase().includes(searchLower) ||
          (machine.status || '').toLowerCase().includes(searchLower) ||
          (machine.hourlyRate?.toString() || '').toLowerCase().includes(searchLower);

        // Tab filter
        if (activeTab === 'active') {
          return matchesSearch && machine.status === 'Active';
        } else if (activeTab === 'maintenance') {
          return matchesSearch && machine.status === 'In Maintenance';
        } else if (activeTab === 'retired') {
          return matchesSearch && machine.status === 'Retired';
        } else {
          return matchesSearch; // All machines
        }
      })
      .sort((a, b) => {
        // Sorting logic
        let comparison = 0;
        
        if (sortField === 'id') {
          comparison = parseInt(a.id || 0) - parseInt(b.id || 0);
        } else if (sortField === 'machineName') {
          comparison = (a.machineName || '').localeCompare(b.machineName || '');
        } else if (sortField === 'status') {
          comparison = (a.status || '').localeCompare(b.status || '');
        } else if (sortField === 'hourlyRate') {
          comparison = parseFloat(a.hourlyRate || 0) - parseFloat(b.hourlyRate || 0);
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

  // Get machine count by status
  const getMachineCountByStatus = (status) => {
    return machines.filter(machine => machine.status === status).length;
  };

  return (
    <div style={styles.leftpart2}>
      <Container fluid style={styles.mainContainer}>
        <Card style={styles.card}>
          <Card.Header style={styles.cardHeader}>
            <div className="d-flex align-items-center">
              <Tools
                size={26}
                className="me-3"
                style={{ color: "#1a2142" }}
              />
              <h3 style={styles.title}>
                Machine Inventory
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
                <span className="ms-3">Loading machine data...</span>
              </div>
            ) : error ? (
              <Alert variant="danger" className="m-4" onClose={() => setError('')} dismissible>
                {error}
              </Alert>
            ) : (
              <div className="p-4">
                {/* Tab and Search Container */}
                <div style={styles.tabContainer}>
                  <Tabs
                    activeKey={activeTab}
                    onSelect={(k) => setActiveTab(k)}
                    className="mb-0"
                  >
                    <Tab 
                      eventKey="all" 
                      title={
                        <span>
                          All Machines <Badge bg="secondary" className="ms-1">{machines.length}</Badge>
                        </span>
                      }
                    />
                    <Tab 
                      eventKey="active" 
                      title={
                        <span>
                          Active <Badge bg="success" className="ms-1">{getMachineCountByStatus('Active')}</Badge>
                        </span>
                      }
                    />
                    <Tab 
                      eventKey="maintenance" 
                      title={
                        <span>
                          In Maintenance <Badge bg="warning" className="ms-1">{getMachineCountByStatus('In Maintenance')}</Badge>
                        </span>
                      }
                    />
                    <Tab 
                      eventKey="retired" 
                      title={
                        <span>
                          Retired <Badge bg="danger" className="ms-1">{getMachineCountByStatus('Retired')}</Badge>
                        </span>
                      }
                    />
                  </Tabs>
                  
                  <div style={styles.searchBar}>
                    <InputGroup>
                      <Form.Control
                        placeholder="Search machines..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                      <InputGroup.Text>
                        <Search />
                      </InputGroup.Text>
                    </InputGroup>
                  </div>
                </div>

                {getFilteredMachines().length === 0 ? (
                  <Alert variant="info" className="mt-4">
                    No machines found matching your search criteria.
                  </Alert>
                ) : (
                  <div className="shadow-sm rounded mt-4">
                    <div className="table-responsive">
                      <Table hover responsive className="align-middle mb-0">
                        <thead style={styles.tableHead}>
                          <tr>
                            <th 
                              style={{ ...styles.sortableHeader, width: '10%' }}
                              onClick={() => handleSort('id')}
                            >
                              <div className="d-flex align-items-center">
                                ID {renderSortIcon('id')}
                              </div>
                            </th>
                            <th style={{ width: '15%' }}>Image</th>
                            <th 
                              style={{ ...styles.sortableHeader, width: '25%' }}
                              onClick={() => handleSort('machineName')}
                            >
                              <div className="d-flex align-items-center">
                                Machine Name {renderSortIcon('machineName')}
                              </div>
                            </th>
                            <th 
                              style={{ ...styles.sortableHeader, width: '15%' }}
                              onClick={() => handleSort('status')}
                            >
                              <div className="d-flex align-items-center">
                                Status {renderSortIcon('status')}
                              </div>
                            </th>
                            <th 
                              style={{ ...styles.sortableHeader, width: '15%' }}
                              onClick={() => handleSort('hourlyRate')}
                            >
                              <div className="d-flex align-items-center">
                                Hourly Rate (LKR) {renderSortIcon('hourlyRate')}
                              </div>
                            </th>
                            <th style={{ width: '20%' }} className="text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getFilteredMachines().map((machine) => (
                            <tr key={machine.id}>
                              <td>{machine.id}</td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div style={styles.machineImage}>
                                    {machine.images && machine.images.length > 0 ? (
                                      <img 
                                        src={getImageUrl(machine.images[0])} 
                                        alt={machine.machineName}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                      />
                                    ) : (
                                      <Tools size={30} color="#6c757d" />
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="fw-bold">{machine.machineName}</div>
                                {machine.description && (
                                  <div className="text-muted small text-truncate" style={{ maxWidth: '300px' }}>
                                    {machine.description}
                                  </div>
                                )}
                              </td>
                              <td>
                                <Badge 
                                  bg={getStatusVariant(machine.status)}
                                  style={styles.statusBadge}
                                >
                                  {getStatusIcon(machine.status)}
                                  {machine.status}
                                </Badge>
                              </td>
                              <td>
                                {parseFloat(machine.hourlyRate || 0).toLocaleString()}/hr
                              </td>
                              <td className="text-center">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => handleEditClick(machine)}
                                  className="me-2"
                                  style={styles.actionButton}
                                >
                                  <PencilSquare size={18} />
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleDeleteClick(machine)}
                                  style={styles.actionButton}
                                >
                                  <TrashFill size={18} />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </div>
                )}
                
                <div className="mt-3 d-flex justify-content-between" style={styles.footerText}>
                  <span>
                    Showing {getFilteredMachines().length} of {machines.length} machines
                  </span>
                  <span>
                    Last updated: {new Date(lastDataRefresh).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Edit Machine Modal */}
        <Modal 
          show={editDialogOpen} 
          onHide={() => setEditDialogOpen(false)}
          centered
          size="lg"
        >
          <Modal.Header closeButton className="bg-light">
            <Modal.Title>
              <div className="d-flex align-items-center">
                <PencilSquare className="me-2" />
                Edit Machine
              </div>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedMachine && (
              <Form>
                <div className="d-flex justify-content-center mb-4">
                  {selectedMachine.images && selectedMachine.images.length > 0 ? (
                    <div style={styles.modalImage}>
                      <img 
                        src={getImageUrl(selectedMachine.images[0])} 
                        alt={selectedMachine.machineName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    </div>
                  ) : (
                    <div style={styles.modalImage}>
                      <Tools size={80} color="#6c757d" />
                    </div>
                  )}
                </div>

                <Form.Group className="mb-3">
                  <Form.Label>Machine Name</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={selectedMachine.machineName || ''}
                    onChange={(e) => setSelectedMachine({
                      ...selectedMachine,
                      machineName: e.target.value
                    })}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={3}
                    value={selectedMachine.description || ''}
                    onChange={(e) => setSelectedMachine({
                      ...selectedMachine,
                      description: e.target.value
                    })}
                  />
                </Form.Group>

                <div className="row">
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label>Status</Form.Label>
                      <Form.Select
                        value={selectedMachine.status || ''}
                        onChange={(e) => setSelectedMachine({
                          ...selectedMachine,
                          status: e.target.value
                        })}
                      >
                        <option value="Active">Active</option>
                        <option value="In Maintenance">In Maintenance</option>
                        <option value="Retired">Retired</option>
                      </Form.Select>
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label>Hourly Rate (LKR)</Form.Label>
                      <InputGroup>
                        <InputGroup.Text>LKR</InputGroup.Text>
                        <Form.Control 
                          type="number" 
                          value={selectedMachine.hourlyRate || ''}
                          onChange={(e) => setSelectedMachine({
                            ...selectedMachine,
                            hourlyRate: e.target.value
                          })}
                        />
                        <InputGroup.Text>/hr</InputGroup.Text>
                      </InputGroup>
                    </Form.Group>
                  </div>
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
              onClick={handleEditSubmit}
              style={styles.primaryButton}
            >
              Save Changes
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal 
          show={deleteDialogOpen} 
          onHide={() => setDeleteDialogOpen(false)}
          centered
        >
          <Modal.Header closeButton className="bg-danger text-white">
            <Modal.Title>
              <div className="d-flex align-items-center">
                <TrashFill className="me-2" />
                Confirm Deletion
              </div>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>
              Are you sure you want to delete <strong>{selectedMachine?.machineName}</strong>?
            </p>
            <Alert variant="warning">
              <strong>Warning:</strong> This action cannot be undone. All data associated with this machine will be permanently removed.
            </Alert>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteSubmit}>
              Delete Machine
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};

export default MachineList;