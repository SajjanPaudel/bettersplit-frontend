import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

function App() {
  const [isAuth, setIsAuth] = useState(!!localStorage.getItem('access_token'));

  const handleAuthUpdate = (status) => {
    setIsAuth(status);
    if (!status) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
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
            <Route
              path="/"
              element={isAuth ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/login"
              element={
                isAuth ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 p-8 md:p-8">
                    <div className="rounded-2xl bg-gradient-to-br overflow-hidden shadow-2xl">
                      <Login onAuth={handleAuthUpdate} />
                    </div>
                  </div>
                )
              }
            />
            <Route
              path=""
              element={isAuth ? <DashboardLayout onLogout={() => handleAuthUpdate(false)} /> : <Navigate to="/login" replace />}
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="balance" element={<Balance />} />
              <Route path="activity" element={<Activity />} />
              <Route path="add-expense" element={<AddExpense />} />
              <Route path="settlements" element={<SettlementHistory />} />
              <Route path="groups" element={<Groups />} />
              <Route path="groups/:id" element={<GroupDetail />} />
              <Route path="profile" element={<Profile />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="activity_new" element={<ActivityPage />} />
              <Route path="/expense/:activityId" element={<ExpenseDetail />} />
            </Route>
            <Route
              path="/signup"
              element={
                isAuth ? (
                  <Navigate to="/dashboard/activity" replace />
                ) : (
                  <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 p-8 md:p-8">
                    <div className="bg-gradient-to-br rounded-2xl overflow-hidden shadow-2xl">
                      {/* <div className="bg-gradient-to-br from-purple-900/20 via-purple-950/20 to-gray-950/20 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl"> */}
                      <Signup />
                    </div>
                  </div>
                )
              }
            />
            <Route path="/groups" element={<Groups />} />
            <Route path="/password-reset-confirm/:uid/:token" 
            element={
            <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 p-8 md:p-8">
              <div className="bg-gradient-to-br rounded-2xl overflow-hidden shadow-2xl">
                {/* <div className="bg-gradient-to-br from-purple-900/20 via-purple-950/20 to-gray-950/20 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl"> */}
                <ResetPasswordConfirm />
              </div>
            </div>
            }
            />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </>
  );
}

export default App;