import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import DashboardLayout from './components/Dashboard/DashboardLayout';
import Balance from './components/Dashboard/Balance';
import './index.css';
import Activity from './components/Dashboard/Activity';
import AddExpense from './components/Dashboard/AddExpense';
import SettlementHistory from './components/Dashboard/SettlementHistory';

function App() {
  const [isAuth, setIsAuth] = useState(localStorage.getItem('access_token') !== null);

  useEffect(() => {
    const handleAuthChange = () => {
      setIsAuth(localStorage.getItem('access_token') !== null);
    };

    // Listen for custom auth events
    window.addEventListener('auth-change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  const handleAuthUpdate = (status) => {
    setIsAuth(status);
    window.dispatchEvent(new Event('auth-change'));
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={isAuth ? <Navigate to="/dashboard/activity" replace /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/login"
          element={isAuth ? <Navigate to="/dashboard/activity" replace /> : <Login onAuth={handleAuthUpdate} />}
        />
        <Route
          path="/dashboard"
          element={isAuth ? <DashboardLayout onLogout={() => handleAuthUpdate(false)} /> : <Navigate to="/login" replace />}>
          <Route index element={<Navigate to="activity" replace />} />
          <Route path="balance" element={<Balance />} />
          <Route path="activity" element={<Activity />} />
          <Route path="add-expense" element={<AddExpense />} />
          <Route path="settlements" element={<SettlementHistory />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;