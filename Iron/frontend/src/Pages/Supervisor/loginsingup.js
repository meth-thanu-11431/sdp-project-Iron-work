import './loginsingup.css'; // Import the custom CSS file for better styling
import 'bootstrap/dist/css/bootstrap.min.css';

import React, { useEffect, useState } from 'react';

import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const LoginSignup = () => {
  const [token, setToken] = useState(null);
  const [isLogin, setIsLogin] = useState(true); // Toggle between login and signup
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    tel_num: '',
    nic: '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      navigate('/add-tour'); 
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = isLogin
        ? 'http://localhost:4000/api/guides/login'
        : 'http://localhost:4000/api/guides/register';
      const response = await axios.post(url, formData);

      if (response.data.success) {
        const { token } = response.data;
        localStorage.setItem('token', token); // Save token in localStorage
        setToken(token); // Update state
        navigate('/add-tour'); // Redirect to secure page
      } else {
        setErrorMessage(response.data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage('An error occurred. Please try again.');
    }
  };

  return (
    <div className="login-signup-wrapper">
      <div className="login-signup-card">
        <div className="card-header text-center">
          <h4>{isLogin ? 'Guide Login' : 'Guide Signup'}</h4>
        </div>
        <div className="card-body">
          {errorMessage && (
            <div className="alert alert-danger" role="alert">
              {errorMessage}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="mb-3">
                <label htmlFor="name" className="form-label">Name</label>
                <input
                  type="text"
                  className="form-control"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required={!isLogin}
                />
              </div>
            )}
            {!isLogin && (
              <div className="mb-3">
                <label htmlFor="nic" className="form-label">National ID</label>
                <input
                  type="text"
                  className="form-control"
                  id="nic"
                  name="nic"
                  value={formData.nic}
                  onChange={handleChange}
                  required={!isLogin}
                />
              </div>
            )}
            <div className="mb-3">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            {!isLogin && (
              <div className="mb-3">
                <label htmlFor="tel_num" className="form-label">Phone Number</label>
                <input
                  type="text"
                  className="form-control"
                  id="tel_num"
                  name="tel_num"
                  value={formData.tel_num}
                  onChange={handleChange}
                  required={!isLogin}
                />
              </div>
            )}
            <button type="submit" className="btn btn-primary w-100">
              {isLogin ? 'Login' : 'Signup'}
            </button>
          </form>
          <div className="text-center mt-3">
            <button
              className="btn btn-link"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Don't have an account? Signup" : 'Already have an account? Login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginSignup;
