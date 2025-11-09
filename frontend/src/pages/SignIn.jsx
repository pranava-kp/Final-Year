import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode'; // Import jwt-decode
import { useAuth } from '../contexts/AuthContext'; // Import the useAuth hook
import '../App.css';

function SignIn() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth(); // Get the login function from our context

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, {
        email: formData.email,
        password: formData.password
      });

      const { access_token, refresh_token } = response.data;

      // Use the login function from the context
      login(access_token);

      // Also store the refresh token
      localStorage.setItem('refreshToken', refresh_token);

      // Decode the token to check the user's role
      const decodedUser = jwtDecode(access_token);

      // Redirect based on role
      if (decodedUser.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/home'); // Or a candidate-specific dashboard
      }

    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.detail || 'Login failed. Please check your credentials.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="landing-auth">
      <div className="auth-content">
        <h2 className="brand-logo">InterviewPrep</h2>
        <form onSubmit={handleSubmit} className="form-styled">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          {error && <p className="error-message" style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        <div className="auth-links">
          <Link to="/forgot-password" className="forgot-link">Forgot Password?</Link>
          <p>
            Don’t have an account? <Link to="/signup">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignIn;

