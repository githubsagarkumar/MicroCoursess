import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from '../config/axios';

interface ProgressItem {
  id: number;
  title: string;
  thumbnail_url?: string;
  total_lessons: number;
  completed_lessons: number;
  progress_percentage: number;
}

const Progress: React.FC = () => {
  const [progress, setProgress] = useState<ProgressItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/progress/overview');
      setProgress(response.data.items);
    } catch (err: any) {
      setError('Failed to fetch progress data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">My Learning Progress</h1>
        <p className="text-gray-600">
          Track your progress across all enrolled courses
        </p>
      </div>

      {progress.length === 0 ? (
        <div className="text-center py-12">
          <div className="mb-6">
            <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">No courses enrolled yet</h3>
          <p className="text-gray-600 mb-6">
            Start your learning journey by enrolling in courses
          </p>
          <Link to="/courses" className="btn btn-primary">
            Browse Courses
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {progress.map((item) => (
            <div key={item.id} className="card">
              {item.thumbnail_url && (
                <div className="aspect-video bg-gray-200 flex items-center justify-center">
                  <img
                    src={item.thumbnail_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="card-body">
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Progress</span>
                    <span className="text-sm font-semibold">
                      {item.progress_percentage}%
                    </span>
                  </div>
                  <div className="progress">
                    <div
                      className="progress-bar"
                      style={{ width: `${item.progress_percentage}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
                  <span>
                    {item.completed_lessons} of {item.total_lessons} lessons completed
                  </span>
                </div>

                <div className="flex gap-2">
                  <Link
                    to={`/courses/${item.id}`}
                    className="btn btn-primary btn-sm flex-1"
                  >
                    Continue Learning
                  </Link>
                  {item.progress_percentage === 100 && (
                    <Link
                      to="/certificates"
                      className="btn btn-success btn-sm"
                    >
                      Get Certificate
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 text-center">
        <Link to="/courses" className="btn btn-secondary">
          Browse More Courses
        </Link>
      </div>
    </div>
  );
};

export default Progress;
