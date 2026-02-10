import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SignupForm } from '../components/auth/SignupForm';

export function SignupPage() {
  const navigate = useNavigate();

  const handleSignupSuccess = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-extrabold text-gray-900 mb-8">
          Create Account
        </h1>
        
        <SignupForm onSuccess={handleSignupSuccess} />
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link 
              to="/login" 
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}