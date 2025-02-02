import { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

function Login({ onAuth }) {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/users/login/', credentials);
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
    }
  };

  const [rememberMe, setRememberMe] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#141417] p-4">
      <div className="flex items-center justify-center space-x-2 mb-8">
        <div className="text-white text-3xl">⬡</div>
        <div className="text-3xl font-light font-['Inter'] text-white">BetterSplit</div>
      </div>
      
      <div className="w-full max-w-md">
        <div className="bg-[#1A1A1F] backdrop-blur-xl rounded-2xl border border-[#ffffff0a] p-6 lg:p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 relative before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/[0.04] before:to-transparent before:rounded-2xl before:pointer-events-none">
          <h2 className="text-center text-2xl font-light text-white mb-8 relative">
            Sign in to your account
          </h2>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-[#ff000014] backdrop-blur-xl border border-red-500/20 text-red-400 px-6 py-4 rounded-xl text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm text-gray-400 mb-2">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="w-full bg-[#ffffff0a] text-white px-6 py-3 rounded-xl border border-[#ffffff1a] focus:border-[#ffffff33] focus:outline-none text-base placeholder-gray-500"
                  placeholder="Enter your username"
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm text-gray-400 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full bg-[#ffffff0a] text-white px-6 py-3 rounded-xl border border-[#ffffff1a] focus:border-[#ffffff33] focus:outline-none text-base placeholder-gray-500"
                  placeholder="••••••••"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-[#ffffff1a] bg-[#ffffff0a] text-blue-600 focus:ring-blue-500"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="remember-me" className="ml-2 text-sm text-gray-400">
                  Remember me
                </label>
              </div>

              <Link to="/forgot-password" className="text-sm text-blue-400 hover:text-blue-300">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-3 px-6 rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors text-base font-light"
            >
              Sign in
            </button>
          </form>
        </div>

        <div className="text-center mt-6 text-sm text-gray-400">
          Don't have an account yet?{' '}
          <Link to="/signup" className="text-blue-400 hover:text-blue-300">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
export default Login;