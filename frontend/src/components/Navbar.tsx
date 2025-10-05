import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar navbar-light bg-light">
      <div className="container d-flex align-items-center justify-content-between">
        <Link to="/" className="navbar-brand mb-0 h1">
          MicroCourses
        </Link>
        {user ? (
          <button onClick={handleLogout} className="btn" style={{ backgroundColor: '#ffc0cb', color: '#6b0000' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#ffb0c0'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#ffc0cb'; }}>
            Logout
          </button>
        ) : (
          <Link to="/demo/learner" className="btn btn-primary">
            Learner Demo
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
