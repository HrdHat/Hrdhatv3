import React from 'react';
import { useAuth } from '../session/AuthProvider';
import { Link } from 'react-router-dom';

const Sidebar = () => {
  const { user, signOut } = useAuth();

  return (
    <aside>
      <nav>
        <ul>
          {user ? (
            <>
              <li><Link to="/dashboard">Dashboard</Link></li>
              <li><Link to="/forms">Forms</Link></li>
              <li><Link to="/settings">Settings</Link></li>
              <li><button onClick={signOut}>Logout</button></li>
            </>
          ) : (
            <>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/signup">Create Account</Link></li>
            </>
          )}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar; 