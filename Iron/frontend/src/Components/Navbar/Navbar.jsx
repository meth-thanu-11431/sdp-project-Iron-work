import "bootstrap/dist/css/bootstrap.min.css";
import "./Navbar.css";

import { Button, Container, Form, Modal, Nav, Navbar, Spinner } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import React, { useEffect, useRef, useState } from "react";

import { assest } from "../../assest/assest";
import axios from "axios";

const CustomNavbar = ({ isHomePage }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [scrolling, setScrolling] = useState(false);
  const [loginRole, setLoginRole] = useState("customer");
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [userData, setUserData] = useState(null);
  
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Check if the user is logged in on component mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userName = localStorage.getItem("userName");
    
    if (token) {
      setIsAuthenticated(true);
      setUserData({
        name: userName || "User",
      });
    }
  }, []);

  // Handle scroll event and update navbar background color
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > window.innerHeight * 0.1) {
        setScrolling(true);
      } else {
        setScrolling(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const handleToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLinkClick = (path) => {
    if (path.startsWith("#")) {
      window.location.href = path;
    } else {
      navigate(path);
    }
    setIsMenuOpen(false);
  };

  const handleButtonClick = () => {
    setShowModal(true);
    setErrorMessage("");
  };

  const closeModal = () => {
    setShowModal(false);
    setErrorMessage("");
  };

  const handleAuthFormSwitch = () => {
    setIsLogin(!isLogin);
    setErrorMessage("");
  };

  // Handle Login
  const handleLogin = async (email, password, role) => {
    setIsLoading(true);
    setErrorMessage("");
    
    try {
      if (role === "customer") {
        const response = await axios.post(
          "http://localhost:4000/api/user/login",
          { email, password }
        );
        
        if (response.data.success) {
          localStorage.setItem("token", response.data.token);
          localStorage.setItem("userId", response.data.userId);
          localStorage.setItem("userName", response.data.name);
          localStorage.setItem("phone", response.data.phone);
          setIsAuthenticated(true);
          setUserData({
            name: response.data.name,
          });
          closeModal();
          window.location.reload();
        } else {
          setErrorMessage(response.data.message || "Login failed. Please check your credentials.");
        }
      } else if (role === "admin") {
        if (email === "admin@gmail.com" && password === "123") {
          closeModal();
          navigate("/admin/Analyze");
        } else {
          setErrorMessage("Invalid admin credentials.");
        }
      } else if (role === "supervisor") {
        if (email === "supervisor@gmail.com" && password === "123") {
          closeModal();
          navigate("/supervisor/materialListAnalyze");
        } else {
          setErrorMessage("Invalid supervisor credentials.");
        }
      }
    } catch (error) {
      setErrorMessage("Login failed. Please try again.");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Signup
  const handleSignup = async (name, email, password, tel_num) => {
    setIsLoading(true);
    setErrorMessage("");
    
    try {
      const response = await axios.post(
        "http://localhost:4000/api/user/register",
        { name, email, password, tel_num }
      );
      
      if (response.data.success) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("userId", response.data.userId);
        localStorage.setItem("userName", response.data.name);
        localStorage.setItem("phone", response.data.phone);
        setIsAuthenticated(true);
        setUserData({
          name: response.data.name,
        });
        closeModal();
        window.location.reload();
      } else {
        setErrorMessage(response.data.message || "Signup failed. Please try again.");
      }
    } catch (error) {
      setErrorMessage("Signup failed. Please try again.");
      console.error("Signup error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    
    if (isLogin) {
      handleLogin(email, password, loginRole);
    } else {
      const name = e.target.name.value;
      const tel_num = e.target.tel_num.value;
      handleSignup(name, email, password, tel_num);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
    setIsDropdownOpen(false);
    window.location.reload();
  };

  // Determine navbar styles based on scrolling and page type
  const navbarStyle = {
    backgroundColor: scrolling 
      ? 'rgba(33, 37, 41, 0.95)' 
      : isHomePage 
        ? 'rgba(33, 37, 41, 0.1)' 
        : 'rgba(33, 37, 41, 0.95)',
    backdropFilter: scrolling ? 'blur(10px)' : 'none',
    boxShadow: scrolling ? '0 2px 10px rgba(0, 0, 0, 0.1)' : 'none',
    transition: 'all 0.3s ease',
  };

  return (
    <>
      <Navbar
        variant="dark"
        expand="lg"
        className="custom-navbar fixed-top"
        style={navbarStyle}
      >
        <Container>
          <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
            <img 
              src={assest.expo} 
              width="60" 
              height="30" 
              alt="Logo" 
              className="me-2" 
            />
            <span className="fw-bold">ExpoMachinery</span>
          </Navbar.Brand>

          <Navbar.Toggle
            aria-controls="basic-navbar-nav"
            onClick={handleToggle}
          />
          
          <Navbar.Collapse id="basic-navbar-nav" in={isMenuOpen}>
            <Nav className="mx-auto custom-nav">
              <Nav.Link 
                onClick={() => handleLinkClick("/")}
                className="px-3 fw-medium"
                active={window.location.pathname === "/"}
              >
                Home
              </Nav.Link>
              <Nav.Link 
                onClick={() => handleLinkClick("#services")}
                className="px-3 fw-medium"
              >
                Services
              </Nav.Link>
              <Nav.Link 
                onClick={() => handleLinkClick("#about")}
                className="px-3 fw-medium"
              >
                About
              </Nav.Link>
              <Nav.Link 
                onClick={() => handleLinkClick("#footer")}
                className="px-3 fw-medium"
              >
                Contact
              </Nav.Link>
            </Nav>

            <div className="d-flex align-items-center">
              {!isAuthenticated ? (
                <Button 
                  variant="outline-light" 
                  onClick={handleButtonClick}
                  className="fw-medium px-3 py-2"
                >
                  Sign In
                </Button>
              ) : (
                <div 
                  className="position-relative" 
                  ref={dropdownRef}
                >
                  <div 
                    className="user-profile-container"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <div className="d-flex align-items-center">
                      <div className="user-avatar me-2">
                        {userData?.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="d-none d-md-block text-light">
                        {userData?.name}
                      </div>
                    </div>
                  </div>
                  
                  <div
                    className={`dropdown-menu-custom ${
                      isDropdownOpen ? "show" : ""
                    }`}
                  >
                    <div className="dropdown-header">
                      <div className="fw-bold">{userData?.name}</div>
                      <div className="small text-muted">Customer</div>
                    </div>
                    <div className="dropdown-divider"></div>
                    <div
                      className="dropdown-item"
                      onClick={() => {
                        navigate("/profile");
                        setIsDropdownOpen(false);
                      }}
                    >
                      <i className="bi bi-person me-2"></i>
                      My Profile
                    </div>
                    <div
                      className="dropdown-item"
                      onClick={() => {
                        navigate("/dashboard/quotations");
                        setIsDropdownOpen(false);
                      }}
                    >
                      <i className="bi bi-speedometer2 me-2"></i>
                      My Dashboard
                    </div>
                    <div className="dropdown-divider"></div>
                    <div 
                      className="dropdown-item text-danger" 
                      onClick={handleLogout}
                    >
                      <i className="bi bi-box-arrow-right me-2"></i>
                      Sign Out
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {isMenuOpen && <div className="overlay" onClick={handleToggle}></div>}

      {/* Login/Signup Modal */}
      <Modal 
        show={showModal} 
        onHide={closeModal} 
        centered
        className="auth-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>{isLogin ? "Sign In" : "Create Account"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {errorMessage && (
            <div className="alert alert-danger" role="alert">
              {errorMessage}
            </div>
          )}
          
          <Form onSubmit={handleSubmit}>
            {/* Add role dropdown only for login */}
            {isLogin && (
              <Form.Group controlId="formRole" className="mb-3">
                <Form.Label>Sign in as</Form.Label>
                <Form.Select
                  name="role"
                  value={loginRole}
                  onChange={(e) => setLoginRole(e.target.value)}
                  required
                >
                  <option value="customer">Customer</option>
                  <option value="admin">Admin</option>
                  <option value="supervisor">Supervisor</option>
                </Form.Select>
              </Form.Group>
            )}
            
            {!isLogin && (
              <Form.Group controlId="formName" className="mb-3">
                <Form.Label>Full Name</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  required
                />
              </Form.Group>
            )}
            
            <Form.Group controlId="formEmail" className="mb-3">
              <Form.Label>Email Address</Form.Label>
              <Form.Control
                type="email"
                name="email"
                placeholder="Enter your email"
                required
              />
            </Form.Group>
            
            <Form.Group controlId="formPassword" className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                name="password"
                placeholder="Enter your password"
                required
              />
            </Form.Group>
            
            {!isLogin && (
              <Form.Group controlId="formTelNum" className="mb-3">
                <Form.Label>Phone Number</Form.Label>
                <Form.Control
                  type="tel"
                  name="tel_num"
                  placeholder="Enter your phone number"
                  required
                />
              </Form.Group>
            )}
            
            <Button 
              variant="primary" 
              type="submit" 
              className="w-100 py-2 mt-3"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  {isLogin ? "Signing in..." : "Creating account..."}
                </>
              ) : (
                isLogin ? "Sign In" : "Create Account"
              )}
            </Button>
            
            <div className="text-center mt-3">
              <span 
                onClick={handleAuthFormSwitch} 
                className="switch-form-link"
              >
                {isLogin
                  ? "New here? Create an account"
                  : "Already have an account? Sign in"}
              </span>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default CustomNavbar;