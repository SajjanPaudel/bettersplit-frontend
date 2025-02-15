import { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { endpoints } from '../config/api';

function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    username: ''
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  // First, add loading state
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Update handleSubmit function
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setIsLoading(true);
    
    try {
      const response = await axios.post(endpoints.register, formData);
      if (response.data.success) {
        navigate('/login', { 
          state: { message: 'Registration successful! Please login.' }
        });
      }
    } catch (err) {
      if (err.response?.data && typeof err.response.data === 'object') {
        // Handle field-specific errors
        setFieldErrors(err.response.data);
      } else {
        setError(err.response?.data?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update submit button
  <button
    type="submit"
    disabled={isLoading}
    className={`w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg transition-colors relative ${
      isLoading ? 'opacity-70 cursor-not-allowed' : ''
    }`}
  >
    {isLoading ? 'Creating account...' : 'Create account'}
  </button>
  
  // Add error display if not already present
  {error && (
    <div className="bg-red-500/10 text-red-400 px-4 py-3 rounded-lg text-sm">
      {error}
    </div>
  )}

  return (
    <div className="h-[calc(100dvh-2rem)] md:h-[calc(100dvh-4rem)] p-2 lg:p-8 flex overflow-none">
      {/* Left Section with Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#1A1A1F] rounded-2xl overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="/money.png" 
            alt="Desert" 
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
            <h2 className="text-5xl font-light">BetterSplit,<br />Smarter, Fairer, Better</h2>
          </div>
        </div>
      </div>

      {/* Right Section with Form */}
      <div className="w-full lg:w-1/2 flex flex-col sm:p-2 md:p-8 lg:p-12">
        <div className="flex justify-end mb-5">
          <Link to="/login" className="text-white/80 hover:text-white transition-colors px-6  rounded-full bg-white/10">
            Back to login →
          </Link>
        </div>

        <div className="max-w-md w-full mx-auto">
          <h1 className="md:text-5xl lg:text-5xl text-3xl font-light text-white mb-4">Create an account</h1>
          <p className="text-white/60 mb-2 md:mb-8 lg:mb-8">
            Already have an account? <Link to="/login" className="text-white hover:text-white/80">Log in</Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="First name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full bg-[#ffffff14] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                required
              />
              <input
                type="text"
                placeholder="Last name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full bg-[#ffffff14] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                required
              />
            </div>

            <div className="space-y-1">
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full bg-[#ffffff14] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                  fieldErrors.email ? 'border border-red-500' : ''
                }`}
                required
              />
              {fieldErrors.email && (
                <p className="text-red-400 text-sm">{fieldErrors.email[0]}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4">
              <input
                type="text"
                placeholder="Username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full bg-[#ffffff14] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                required
              />
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-[#ffffff14] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50"
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

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg transition-colors relative ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <>
                  <span className="opacity-0">Create account</span>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                </>
              ) : (
                'Create account'
              )}
            </button>

            {/* <div className="relative text-center my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative">
                <span className="px-2 text-sm text-white/60 bg-[#1A1A1F]">Or register with</span>
              </div>
            </div> */}

            {/* <div className="grid grid-cols-2 gap-4">
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
            </div> */}
          </form>
        </div>
      </div>
    </div>
  );
}

export default Signup;