import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Form, Button, Image, Spinner, Alert, Tab, Nav } from 'react-bootstrap';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { FaUser, FaCamera, FaEdit, FaKey, FaInfoCircle, FaCheck, FaCalendarAlt, FaEnvelope, FaPhone } from 'react-icons/fa';


const ProfilePage = () => {
  // User data states
  const [user, setUser] = useState({});
  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile image states
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // Form states for personal info
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  
  // Form states for password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  // Fetch token and decode user ID on component mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      try {
        const decoded = jwtDecode(savedToken);
        setUserId(decoded.id);
      } catch (error) {
        console.error('Error decoding token:', error);
        setError('Your session is invalid. Please login again.');
        setLoading(false);
      }
    } else {
      setError('You are not authorized. Please login again.');
      setLoading(false);
    }
  }, []);

  // Fetch user profile information
  useEffect(() => {
    if (token && userId) {
      fetchUserProfile();
    }
  }, [token, userId]);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:4000/api/user/get_user', {
        headers: { token }
      });
      
      if (response.data.success) {
        const userData = response.data.user;
        setUser(userData);
        setName(userData.customer_name || '');
        setPhone(userData.tel_num || '');
        
        // Set image path
        if (userData.profile_image) {
          setImagePreview(`http://localhost:4000/images/${userData.profile_image}`);
        }
      } else {
        setError('Failed to load profile. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle profile image update
  const handleProfileImageUpdate = async (e) => {
    e.preventDefault();
    
    if (!imageFile) {
      setError('Please select an image to upload.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');
    
    const formData = new FormData();
    formData.append('profile_image', imageFile);
    formData.append('userId', userId);
    
    try {
      const response = await axios.post(
        'http://localhost:4000/api/user/update', 
        formData, 
        { headers: { token } }
      );

      if (response.data.success) {
        setSuccessMessage('Profile image updated successfully');
        fetchUserProfile(); // Refresh user data
      } else {
        setError('Failed to update profile image: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error updating profile image:', error);
      setError('Error updating profile image. Please try again.');
    } finally {
      setLoading(false);
      setTimeout(() => {
        setSuccessMessage('');
        setError('');
      }, 3000);
    }
  };

  // Handle personal info update
  const handleInfoUpdate = async (e) => {
    e.preventDefault();
    
    if (!name || !phone) {
      setError('Name and phone number are required.');
      return;
    }
    
    if (phone.length !== 10) {
      setError('Phone number must be 10 digits.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      // Assuming your backend endpoint for updating user info
      const response = await axios.post(
        'http://localhost:4000/api/user/update_info', 
        { 
          userId, 
          customer_name: name, 
          tel_num: phone 
        }, 
        { headers: { token } }
      );

      if (response.data.success) {
        setSuccessMessage('Profile information updated successfully');
        setIsEditingInfo(false);
        
        // Update local storage if name changed
        if (user.customer_name !== name) {
          localStorage.setItem('userName', name);
        }
        
        fetchUserProfile(); // Refresh user data
      } else {
        setError('Failed to update profile information: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error updating profile information:', error);
      setError('Error updating profile information. Please try again.');
    } finally {
      setLoading(false);
      setTimeout(() => {
        setSuccessMessage('');
        setError('');
      }, 3000);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    // Reset error and success messages
    setPasswordError('');
    setError('');
    setSuccessMessage('');
    
    // Validate password fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required.');
      return;
    }
    
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setLoading(true);
    
    try {
      // Assuming your backend endpoint for changing password
      const response = await axios.post(
        'http://localhost:4000/api/user/change_password', 
        { 
          userId, 
          currentPassword, 
          newPassword 
        }, 
        { headers: { token } }
      );

      if (response.data.success) {
        setSuccessMessage('Password changed successfully');
        // Reset password fields
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(response.data.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordError('Error changing password. Please try again.');
    } finally {
      setLoading(false);
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    }
  };

  // Cancel editing mode
  const handleCancelEdit = () => {
    setIsEditingInfo(false);
    setName(user.customer_name || '');
    setPhone(user.tel_num || '');
  };

  if (loading && !user.customer_name) {
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

  return (
    <div className="leftpart2">
      <Card className="shadow-sm mb-4 border-0">
        <Card.Body className="px-4 py-4">
          <Card.Title as="h2" className="mb-4" style={{ color: "#1a2142", fontWeight: 600 }}>
            My Profile
          </Card.Title>
          
          {/* Error and success messages */}
          {error && (
            <Alert variant="danger" className="d-flex align-items-center mb-4">
              <FaInfoCircle className="me-2" />
              <div>{error}</div>
            </Alert>
          )}
          
          {successMessage && (
            <Alert variant="success" className="d-flex align-items-center mb-4">
              <FaCheck className="me-2" />
              <div>{successMessage}</div>
            </Alert>
          )}
          
          {/* Tabs for different sections */}
          <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
            <Row>
              <Col md={3}>
                <Nav variant="pills" className="flex-column">
                  <Nav.Item>
                    <Nav.Link 
                      eventKey="profile" 
                      className="d-flex align-items-center mb-2"
                      style={{ 
                        backgroundColor: activeTab === 'profile' ? '#4F46E5' : 'transparent',
                        color: activeTab === 'profile' ? 'white' : '#6c757d'
                      }}
                    >
                      <FaUser className="me-2" />
                      Profile Information
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link 
                      eventKey="photo" 
                      className="d-flex align-items-center mb-2"
                      style={{ 
                        backgroundColor: activeTab === 'photo' ? '#4F46E5' : 'transparent',
                        color: activeTab === 'photo' ? 'white' : '#6c757d'
                      }}
                    >
                      <FaCamera className="me-2" />
                      Profile Photo
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link 
                      eventKey="password" 
                      className="d-flex align-items-center"
                      style={{ 
                        backgroundColor: activeTab === 'password' ? '#4F46E5' : 'transparent',
                        color: activeTab === 'password' ? 'white' : '#6c757d'
                      }}
                    >
                      <FaKey className="me-2" />
                      Change Password
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </Col>
              
              <Col md={9}>
                <Tab.Content>
                  {/* Profile Information Tab */}
                  <Tab.Pane eventKey="profile">
                    <Card className="border-0 shadow-sm">
                      <Card.Body className="p-4">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                          <h5 className="mb-0" style={{ color: "#1a2142", fontWeight: 600 }}>Personal Information</h5>
                          {!isEditingInfo && (
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              onClick={() => setIsEditingInfo(true)}
                              className="d-flex align-items-center"
                            >
                              <FaEdit className="me-2" />
                              Edit Information
                            </Button>
                          )}
                        </div>
                        
                        {isEditingInfo ? (
                          <Form onSubmit={handleInfoUpdate}>
                            <Form.Group className="mb-3">
                              <Form.Label className="text-muted">Full Name</Form.Label>
                              <Form.Control
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                              />
                            </Form.Group>
                            
                            <Form.Group className="mb-3">
                              <Form.Label className="text-muted">Email Address</Form.Label>
                              <Form.Control
                                type="email"
                                value={user.email || ''}
                                disabled
                                className="bg-light"
                              />
                              <Form.Text className="text-muted">
                                Email address cannot be changed.
                              </Form.Text>
                            </Form.Group>
                            
                            <Form.Group className="mb-4">
                              <Form.Label className="text-muted">Phone Number</Form.Label>
                              <Form.Control
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                              />
                            </Form.Group>
                            
                            <div className="d-flex justify-content-end">
                              <Button
                                variant="outline-secondary"
                                className="me-2"
                                onClick={handleCancelEdit}
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="primary"
                                type="submit"
                                style={{ backgroundColor: "#4F46E5", borderColor: "#4F46E5" }}
                                disabled={loading}
                              >
                                {loading ? (
                                  <>
                                    <Spinner
                                      as="span"
                                      animation="border"
                                      size="sm"
                                      role="status"
                                      aria-hidden="true"
                                      className="me-2"
                                    />
                                    Saving...
                                  </>
                                ) : (
                                  "Save Changes"
                                )}
                              </Button>
                            </div>
                          </Form>
                        ) : (
                          <div>
                            <Row className="mb-3">
                              <Col md={3} className="text-muted d-flex align-items-center">
                                <FaUser className="me-2 text-secondary" />
                                Full Name:
                              </Col>
                              <Col md={9} className="fw-medium">
                                {user.customer_name || 'Not provided'}
                              </Col>
                            </Row>
                            
                            <Row className="mb-3">
                              <Col md={3} className="text-muted d-flex align-items-center">
                                <FaEnvelope className="me-2 text-secondary" />
                                Email:
                              </Col>
                              <Col md={9}>{user.email || 'Not provided'}</Col>
                            </Row>
                            
                            <Row className="mb-3">
                              <Col md={3} className="text-muted d-flex align-items-center">
                                <FaPhone className="me-2 text-secondary" />
                                Phone:
                              </Col>
                              <Col md={9}>{user.tel_num || 'Not provided'}</Col>
                            </Row>
                            
                            <Row>
                              <Col md={3} className="text-muted d-flex align-items-center">
                                <FaCalendarAlt className="me-2 text-secondary" />
                                Joined:
                              </Col>
                              <Col md={9}>
                                {user.join_date 
                                  ? new Date(user.join_date).toLocaleDateString() 
                                  : 'Date not available'}
                              </Col>
                            </Row>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Tab.Pane>
                  
                  {/* Profile Photo Tab */}
                  <Tab.Pane eventKey="photo">
                    <Card className="border-0 shadow-sm">
                      <Card.Body className="p-4">
                        <h5 className="mb-4" style={{ color: "#1a2142", fontWeight: 600 }}>Profile Photo</h5>
                        
                        <div className="text-center mb-4">
                          <Image 
                            src={imagePreview || 'https://via.placeholder.com/150'} 
                            roundedCircle 
                            className="profile-image mb-3 shadow-sm" 
                            style={{ 
                              width: '150px', 
                              height: '150px',
                              objectFit: 'cover',
                              border: '4px solid #f8f9fa'
                            }} 
                          />
                          <h5 className="mt-2">{user.customer_name}</h5>
                        </div>
                        
                        <Form onSubmit={handleProfileImageUpdate}>
                          <Form.Group controlId="formProfileImage" className="mb-4">
                            <Form.Label>Update Profile Image</Form.Label>
                            <Form.Control 
                              type="file" 
                              accept="image/*" 
                              onChange={handleImageChange} 
                              className="mb-3"
                            />
                            <Form.Text className="text-muted">
                              Recommended image size: 300x300 pixels. Maximum file size: 5MB.
                            </Form.Text>
                          </Form.Group>
                          
                          <Button
                            variant="primary"
                            type="submit"
                            disabled={!imageFile || loading}
                            style={{ backgroundColor: "#4F46E5", borderColor: "#4F46E5" }}
                          >
                            {loading ? (
                              <>
                                <Spinner
                                  as="span"
                                  animation="border"
                                  size="sm"
                                  role="status"
                                  aria-hidden="true"
                                  className="me-2"
                                />
                                Uploading...
                              </>
                            ) : (
                              "Upload Image"
                            )}
                          </Button>
                        </Form>
                      </Card.Body>
                    </Card>
                  </Tab.Pane>
                  
                  {/* Change Password Tab */}
                  <Tab.Pane eventKey="password">
                    <Card className="border-0 shadow-sm">
                      <Card.Body className="p-4">
                        <h5 className="mb-4" style={{ color: "#1a2142", fontWeight: 600 }}>Change Password</h5>
                        
                        {passwordError && (
                          <Alert variant="danger" className="d-flex align-items-center mb-4">
                            <FaInfoCircle className="me-2" />
                            <div>{passwordError}</div>
                          </Alert>
                        )}
                        
                        <Form onSubmit={handlePasswordChange}>
                          <Form.Group className="mb-3">
                            <Form.Label>Current Password</Form.Label>
                            <Form.Control
                              type="password"
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              required
                            />
                          </Form.Group>
                          
                          <Form.Group className="mb-3">
                            <Form.Label>New Password</Form.Label>
                            <Form.Control
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              required
                            />
                            <Form.Text className="text-muted">
                              Password must be at least 8 characters long.
                            </Form.Text>
                          </Form.Group>
                          
                          <Form.Group className="mb-4">
                            <Form.Label>Confirm New Password</Form.Label>
                            <Form.Control
                              type="password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              required
                            />
                          </Form.Group>
                          
                          <Button
                            variant="primary"
                            type="submit"
                            disabled={loading}
                            style={{ backgroundColor: "#4F46E5", borderColor: "#4F46E5" }}
                          >
                            {loading ? (
                              <>
                                <Spinner
                                  as="span"
                                  animation="border"
                                  size="sm"
                                  role="status"
                                  aria-hidden="true"
                                  className="me-2"
                                />
                                Changing Password...
                              </>
                            ) : (
                              "Change Password"
                            )}
                          </Button>
                        </Form>
                      </Card.Body>
                    </Card>
                  </Tab.Pane>
                </Tab.Content>
              </Col>
            </Row>
          </Tab.Container>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ProfilePage;