import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'; // Import Outlet
import Login from './components/Login';
import DashboardLayout from './components/Dashboard/DashboardLayout';
import Balance from './components/Dashboard/Balance';
import Activity from './components/Dashboard/Activity';
import AddExpense from './components/Dashboard/AddExpense';
import SettlementHistory from './components/Dashboard/SettlementHistory';
import { ThemeProvider } from './context/ThemeContext';
import Signup from './components/Signup';
import Groups from './components/Dashboard/Groups';
import GroupDetail from './components/Dashboard/GroupDetail';
import Profile from './components/Dashboard/Profile';
import ResetPasswordConfirm from './components/ResetPasswordConfirm';
import { Toaster } from 'react-hot-toast';
import Dashboard from './components/Dashboard/Dashboard';
import ActivityPage from './components/Dashboard/ActivityPage';
import ExpenseDetail from './components/Dashboard/ExpenseDetail';
import Landing from './components/Landing';
import axios from 'axios';

// Optional Wrapper components to keep styling out of routes
const LoginWrapped = ({ onAuth }) => (
  <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 p-8 md:p-8">
    <div className="rounded-2xl bg-gradient-to-br overflow-hidden shadow-2xl">
      <Login onAuth={onAuth} />
    </div>
  </div>
);

const SignupWrapped = () => (
  <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 p-8 md:p-8">
    <div className="bg-gradient-to-br rounded-2xl overflow-hidden shadow-2xl">
      <Signup />
    </div>
  </div>
);

const ResetPasswordConfirmWrapped = () => (
  <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 p-8 md:p-8">
    <div className="bg-gradient-to-br rounded-2xl overflow-hidden shadow-2xl">
      <ResetPasswordConfirm />
    </div>
  </div>
);


// Component to handle protected routes logic
const ProtectedRoute = ({ isAuth, redirectPath = '/login', children }) => {
  if (!isAuth) {
    return <Navigate to={redirectPath} replace />;
  }

  // Render the children (nested routes or element)
  return children ? children : <Outlet />;
};


function App() {
  const [isAuth, setIsAuth] = useState(!!localStorage.getItem('access_token'));

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.data?.code === 'token_not_valid' || error.response?.status === 401) { // Also check status 401
          console.log("Token invalid or 401, logging out"); // Debugging
          handleAuthUpdate(false);
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const handleAuthUpdate = (status) => {
    console.log("Auth status updated to:", status); // Debugging
    setIsAuth(status);
    if (!status) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      // Consider navigating explicitly here if needed, e.g., navigate('/login')
      // but the Route structure should handle redirects naturally.
    }
  };

  return (
    <>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#333',
            color: '#fff',
            borderRadius: '12px',
          },
          success: {
            style: {
              background: 'rgba(34, 197, 94, 0.9)',
            },
          },
          error: {
            style: {
              background: 'rgba(239, 68, 68, 0.9)',
            },
          },
        }}
      />
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            {/* Root path redirect - must be first */}
            <Route path="/" element={<Navigate to="/landing" replace />} />

            {/* Public Routes */}
            <Route
              path="/landing"
              element={isAuth ? <Navigate to="/dashboard" replace /> : <Landing />}
            />
            <Route
              path="/login"
              element={isAuth ? <Navigate to="/dashboard" replace /> : <LoginWrapped onAuth={handleAuthUpdate} />}
            />
            <Route
              path="/signup"
              element={isAuth ? <Navigate to="/dashboard" replace /> : <SignupWrapped />}
            />
            <Route path="/password-reset-confirm/:uid/:token" element={<ResetPasswordConfirmWrapped />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute isAuth={isAuth} redirectPath="/login">
                  <DashboardLayout onLogout={() => handleAuthUpdate(false)} />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="balance" element={<Balance />} />
              {/* <Route path="activity" element={<Activity />} /> */}
              <Route path="activity_new" element={<ActivityPage />} />
              <Route path="add-expense" element={<AddExpense />} />
              <Route path="settlements" element={<SettlementHistory />} />
              <Route path="groups" element={<Groups />} />
              <Route path="groups/:id" element={<GroupDetail />} />
              <Route path="profile" element={<Profile />} />
              <Route path="expense/:activityId" element={<ExpenseDetail />} />
            </Route>

            {/* Optional: Catch-all for 404 */}
            {/* <Route path="*" element={<NotFoundPage />} /> */}
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </>
  );
}

export default App;