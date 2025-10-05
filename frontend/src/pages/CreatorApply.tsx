import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from '../config/axios';

const CreatorApply: React.FC = () => {
  const { user } = useAuth();
  const [motivation, setMotivation] = useState('');
  const [experience, setExperience] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [applicationStatus, setApplicationStatus] = useState<any>(null);

  useEffect(() => {
    checkApplicationStatus();
  }, []);

  const checkApplicationStatus = async () => {
    try {
      const response = await axios.get('/api/users/creator-status');
      setApplicationStatus(response.data);
    } catch (err) {
      // User might not have applied yet
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!motivation.trim() || !experience.trim()) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      await axios.post('/api/users/apply-creator', {
        motivation,
        experience
      });
      setSuccess('Application submitted successfully! You will be notified once it is reviewed.');
      setMotivation('');
      setExperience('');
      checkApplicationStatus();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  if (user?.role === 'creator' || user?.role === 'admin') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card">
          <div className="card-body text-center">
            <div className="text-green-600 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-4">You're Already a Creator!</h1>
            <p className="text-gray-600 mb-6">
              You already have creator access. You can start creating courses from your dashboard.
            </p>
            <a href="/creator/dashboard" className="btn btn-primary">
              Go to Creator Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (applicationStatus?.status === 'pending') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card">
          <div className="card-body text-center">
            <div className="text-yellow-600 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-4">Application Under Review</h1>
            <p className="text-gray-600 mb-6">
              Your creator application is currently being reviewed by our admin team. 
              You will be notified once a decision is made.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg text-left">
              <h3 className="font-semibold mb-2">Your Application Details:</h3>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Motivation:</strong> {applicationStatus.application.motivation}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Experience:</strong> {applicationStatus.application.experience}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (applicationStatus?.status === 'approved') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card">
          <div className="card-body text-center">
            <div className="text-green-600 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-4">Application Approved!</h1>
            <p className="text-gray-600 mb-6">
              Congratulations! Your creator application has been approved. 
              You can now start creating and publishing courses.
            </p>
            <a href="/creator/dashboard" className="btn btn-primary">
              Go to Creator Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (applicationStatus?.status === 'rejected') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card">
          <div className="card-body text-center">
            <div className="text-red-600 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-4">Application Not Approved</h1>
            <p className="text-gray-600 mb-6">
              Unfortunately, your creator application was not approved at this time. 
              You can submit a new application with additional information.
            </p>
            <button
              onClick={() => setApplicationStatus(null)}
              className="btn btn-primary"
            >
              Submit New Application
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <div className="card-header">
          <h1 className="text-2xl font-bold">Apply to Become a Creator</h1>
          <p className="text-gray-600 mt-2">
            Share your knowledge by creating courses for our community
          </p>
        </div>
        <div className="card-body">
          {error && (
            <div className="alert alert-error mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success mb-4">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">
                Why do you want to become a creator? *
              </label>
              <textarea
                className="form-textarea"
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                placeholder="Tell us about your motivation for creating courses..."
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                What is your experience with teaching or content creation? *
              </label>
              <textarea
                className="form-textarea"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="Describe your background in education, training, or content creation..."
                required
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-blue-800 mb-2">What to expect:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Your application will be reviewed by our admin team</li>
                <li>• You'll receive an email notification once reviewed</li>
                <li>• Approved creators can create and publish courses</li>
                <li>• All courses go through admin review before publication</li>
              </ul>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? 'Submitting Application...' : 'Submit Application'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatorApply;
