import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { endpoints } from '../config/api';
import { useLocation } from 'react-router-dom';

function Login({ onAuth }) {
  const location = useLocation();
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [email, setEmail] = useState('');
  const [resetStatus, setResetStatus] = useState({ type: '', message: '' });
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
    }
  }, [location]);

  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');

  // Add this effect near other useEffect hooks
  useEffect(() => {
    const savedCredentials = localStorage.getItem('rememberedCredentials');
    if (savedCredentials) {
      const { username, rememberMe } = JSON.parse(savedCredentials);
      setCredentials(prev => ({ ...prev, username }));
      setRememberMe(rememberMe);
    }
  }, []);

  // Update the handleSubmit function
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post(endpoints.login, credentials);
      const { data } = response;

      if (data.success) {
        // Save credentials if remember me is checked
        if (rememberMe) {
          localStorage.setItem('rememberedCredentials', JSON.stringify({
            username: credentials.username,
            rememberMe
          }));
        } else {
          localStorage.removeItem('rememberedCredentials');
        }

        localStorage.setItem('access_token', data.data.access_token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        onAuth(true);
        navigate('/dashboard/activity', { replace: true });
      } else {
        setError('Login failed. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
      setCredentials(prev => ({ ...prev, password: '' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setIsResetting(true);
    setResetStatus({ type: '', message: '' });

    try {
      console.log('Sending reset request to:', endpoints.forgotPassword);
      const response = await axios.post(endpoints.forgotPassword, { email });
      console.log('Reset response:', response);

      if (response.data.success) {
        setResetStatus({
          type: 'success',
          message: 'If an account exists, Password reset link will be been sent to your email'
        });
        setTimeout(() => {
          setShowForgotModal(false);
          setEmail('');
          setResetStatus({ type: '', message: '' });
        }, 3000);
      }
    } catch (err) {
      console.error('Reset error:', err);
      setResetStatus({
        type: 'error',
        message: err.response?.data?.message || 'Failed to send reset link. Please try again.'
      });
    } finally {
      setIsResetting(false);
    }
  };

  const [rememberMe, setRememberMe] = useState(false);

  return (
    <div className="h-[calc(100dvh-2rem)] md:h-[calc(100dvh-4rem)] p-2 lg:p-8 flex">
      {/* Left Section with Image */}
      <div className="w-full lg:w-1/2 flex flex-col sm:p-2 md:p-8 lg:p-12 ">
        <div className="max-w-md w-full mx-auto py-10 sm:py-2">
          <h1 className="text-5xl font-light text-white mb-8">Sign in</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {successMessage && (
              <div className="bg-green-500/10 text-green-400 px-4 py-3 rounded-lg text-sm">
                {successMessage}
              </div>
            )}
            {error && (
              <div className="bg-red-500/10 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <input
              type="text"
              placeholder="Username"
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              className="w-full bg-[#ffffff14] text-white md:px-4 lg:px-4 px-2 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              required
            />

            {/* Update the password input section */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                className="w-full bg-[#ffffff14] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-800/40  transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>

                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="remember-me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-[#ffffff14] border-0 text-purple-600 focus:ring-purple-500/50"
                />
                <label htmlFor="remember-me" className="text-sm text-white/60">
                  Remember me
                </label>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-white/60 hover:text-white text-sm transition-colors"
              >
                Forgot password?
              </button>
            </div>



            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg transition-colors relative ${isLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
            >
              {isLoading ? (
                <>
                  <span className="opacity-0">Sign In</span>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                </>
              ) : (
                'Sign In'
              )}
            </button>

            <div className="relative text-center my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              {/* <div className="relative">
                <span className="px-2 text-sm text-white/60 bg-[#1A1A1F]">Or continue with</span>
              </div> */}
            </div>

          </form>

          {/* Add the Forgot Password Modal */}
          {showForgotModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="bg-[#1A1A1F] rounded-2xl p-6 w-full max-w-md border border-white/10">
                <h2 className="text-2xl font-light text-white mb-4">Reset Password</h2>
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  {resetStatus.message && (
                    <div className={`px-4 py-3 rounded-lg text-sm ${resetStatus.type === 'success'
                      ? 'bg-green-500/10 text-green-400'
                      : 'bg-red-500/10 text-red-400'
                      }`}>
                      {resetStatus.message}
                    </div>
                  )}
                  <div>
                    <label className="text-sm text-white/60 mb-1 block">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#ffffff14] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotModal(false);
                        setEmail('');
                        setResetStatus({ type: '', message: '' });
                      }}
                      className="flex-1 px-4 py-2 border border-white/10 rounded-lg text-white/60 hover:bg-white/5 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isResetting}
                      className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors relative"
                    >
                      {isResetting ? (
                        <>
                          <span className="opacity-0">Send Link</span>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                        </>
                      ) : (
                        'Send Link'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          <p className="text-white/60 mt-8">
            New to BetterSplit? <Link to="/signup" className="text-white hover:text-white/80">Create an account</Link>
          </p>
        </div>
      </div>
      {/* right section with image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#1A1A1F] rounded-2xl overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/money.png"
            alt="money"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/50 to-[#1A1A1F]/80" />
        <div className="relative z-10 flex flex-col justify-between p-12">
          <div className="text-2xl relative flex flex-col">
            <div className="flex">
              <span className="text-gray-400">BETTER</span>
              <span className="text-purple-500 font-bold">SPLIT</span>
            </div>
            <div className="flex -mt-1 opacity-60 blur-[1px] transform -skew-x-5">
              <span className="text-purple-500 font-bold">SPLIT</span>
              <span className="text-gray-400">BETTER</span>
            </div>
          </div>
          <div className="text-white mb-12">
            <h2 className="text-5xl font-light">Welcome Back,<br />Ready to Split?</h2>
          </div>
        </div>
      </div>
    </div>



  );
}

export default Login;