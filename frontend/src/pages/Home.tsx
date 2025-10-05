import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="text-center">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4 text-gray-800">
          Welcome to MicroCourses
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Learn, Create, and Share Knowledge with Our Mini LMS Platform
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="card-body text-center">
            <h3 className="text-xl font-semibold mb-2">For Learners</h3>
            <p className="text-gray-600 mb-4">
              Browse courses, track your progress, and earn certificates
            </p>
            <Link to="/courses" className="btn btn-primary">
              Browse Courses
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="card-body text-center">
            <h3 className="text-xl font-semibold mb-2">For Creators</h3>
            <p className="text-gray-600 mb-4">
              Create and publish your own courses with auto-generated transcripts
            </p>
            {user ? (
              <Link to="/creator/apply" className="btn btn-primary">
                Apply to Create
              </Link>
            ) : (
              <Link to="/register" className="btn btn-primary">
                Get Started
              </Link>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-body text-center">
            <h3 className="text-xl font-semibold mb-2">For Admins</h3>
            <p className="text-gray-600 mb-4">
              Review and approve creator applications and course submissions
            </p>
            {user?.role === 'admin' ? (
              <Link to="/admin/review/courses" className="btn btn-primary">
                Admin Panel
              </Link>
            ) : (
              <span className="text-gray-500">Admin access required</span>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h3 className="font-semibold mb-2">Apply to Create</h3>
              <p className="text-gray-600">
                Submit your application to become a course creator
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <h3 className="font-semibold mb-2">Create Courses</h3>
              <p className="text-gray-600">
                Build your courses with lessons and auto-generated transcripts
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">3</span>
              </div>
              <h3 className="font-semibold mb-2">Get Certified</h3>
              <p className="text-gray-600">
                Complete courses and earn certificates with unique serial numbers
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
