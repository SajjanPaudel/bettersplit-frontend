import { useState ,useEffect} from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { endpoints } from '../config/api';
import { useLocation } from 'react-router-dom';

function Login({ onAuth }) {
  const location = useLocation();
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const response = await axios.post(endpoints.login, credentials);
      const { data } = response;
      
      if (data.success) {
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

  const [rememberMe, setRememberMe] = useState(false);

  return (
    <div className="h-[calc(100vh-2rem)] md:h-[calc(100vh-4rem)] p-8 flex">
      {/* Left Section with Image */}
    
      {/* Right Section with Form */}
      <div className="w-full lg:w-1/2 flex flex-col p-8 lg:p-12 ">
        {/* <div className="flex justify-end mb-12">
          <Link to="/" className="text-white/80 hover:text-white transition-colors px-6 py-2 rounded-full bg-white/10">
            Back to website →
          </Link>
        </div>
     */}
        <div className="max-w-md w-full mx-auto py-10">
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
              className="w-full bg-[#ffffff14] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              required
            />
    
            <div className="relative">
              <input
                type="password"
                placeholder="Password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                className="w-full bg-[#ffffff14] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 pr-10"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
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
              <Link to="/forgot-password" className="text-white hover:text-white/80 text-sm">
                Forgot password?
              </Link>
            </div>
    
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg transition-colors relative ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
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
              <div className="relative">
                <span className="px-2 text-sm text-white/60 bg-[#1A1A1F]">Or continue with</span>
              </div>
            </div>
    
            <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              className="flex items-center justify-center space-x-2 py-3 px-4 rounded-lg bg-[#ffffff14] hover:bg-[#ffffff1a] text-white transition-colors opacity-50 cursor-not-allowed"
              disabled
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                </svg>
                <span>Google</span>
              </button>
                <button
                type="button"
                className="flex items-center justify-center space-x-2 py-3 px-4 rounded-lg bg-[#ffffff14] hover:bg-[#ffffff1a] text-white transition-colors opacity-50 cursor-not-allowed"
                disabled
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M17.05,11.97 C17.0389,9.164 19.4253,7.80133333 19.4947,7.754 C18.1987,5.89333333 16.1667,5.60266667 15.4733,5.57733333 C13.716,5.39333333 12.0187,6.574 11.1267,6.574 C10.2187,6.574 8.83066667,5.60266667 7.364,5.63866667 C5.46666667,5.674 3.72466667,6.71466667 2.78733333,8.32933333 C0.8536,11.528 2.25466667,16.1013333 4.12666667,18.5813333 C5.05333333,19.7953333 6.12933333,21.1633333 7.55466667,21.1147333 C8.94933333,21.0607333 9.48133333,20.2147333 11.1533333,20.2147333 C12.8067333,20.2147333 13.3027333,21.1147333 14.7687333,21.0840667 C16.2733333,21.0607333 17.2027333,19.8620667 18.1053333,18.6373333 C19.1947333,17.2267333 19.6413333,15.8407333 19.6667333,15.7473333 C19.6333333,15.7367333 17.0647333,14.7767333 17.05,11.97"/>
                </svg>
                <span>Apple</span>
              </button>
            </div>
          </form>
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