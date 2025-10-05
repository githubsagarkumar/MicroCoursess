import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../config/axios';

interface Course {
  id: number;
  title: string;
  description: string;
  status: string;
  creator_name: string;
  creator_email: string;
  lesson_count: number;
  created_at: string;
}

interface Application {
  id: number;
  user_name: string;
  user_email: string;
  motivation: string;
  experience: string;
  status: string;
  created_at: string;
}

const AdminReview: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'courses' | 'applications'>('courses');
  const [courses, setCourses] = useState<Course[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchStats();
    if (activeTab === 'courses') {
      fetchCourses();
    } else {
      fetchApplications();
    }
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/admin/stats');
      setStats(response.data.stats);
    } catch (err) {
      console.error('Failed to fetch stats');
    }
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/courses');
      setCourses(response.data.items);
    } catch (err: any) {
      setError('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/applications');
      setApplications(response.data.items);
    } catch (err: any) {
      setError('Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const reviewCourse = async (courseId: number, status: string, feedback?: string) => {
    try {
      const payload: { status: string; feedback?: string } = { status };
      if (feedback) {
        payload.feedback = feedback;
      }
      await axios.put(`/api/admin/courses/${courseId}/review`, payload);
      fetchCourses();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to review course');
    }
  };

  const handleApproveCourse = async (courseId: number) => {
    if (window.confirm('Are you sure you want to approve this course? It will be visible to all learners.')) {
      await reviewCourse(courseId, 'published');
    }
  };

  const handleRejectCourse = async (courseId: number) => {
    const feedback = window.prompt('Please provide feedback for rejection (optional):');
    await reviewCourse(courseId, 'rejected', feedback || undefined);
  };

  const reviewApplication = async (applicationId: number, status: string) => {
    try {
      await axios.put(`/api/admin/applications/${applicationId}/review`, { status });
      fetchApplications();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to review application');
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Admin Review Panel</h1>
        <p className="text-gray-600">
          Review and approve creator applications and course submissions
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="card-body text-center">
              <h3 className="text-2xl font-bold text-blue-600">{stats.total_users}</h3>
              <p className="text-gray-600">Total Users</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <h3 className="text-2xl font-bold text-green-600">{stats.total_courses}</h3>
              <p className="text-gray-600">Total Courses</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <h3 className="text-2xl font-bold text-purple-600">{stats.total_enrollments}</h3>
              <p className="text-gray-600">Total Enrollments</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <h3 className="text-2xl font-bold text-orange-600">{stats.pending_applications}</h3>
              <p className="text-gray-600">Pending Applications</p>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('courses')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === 'courses'
                  ? 'bg-blue-100 text-blue-800'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Course Reviews
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === 'applications'
                  ? 'bg-blue-100 text-blue-800'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Creator Applications
            </button>
          </div>
        </div>

        <div className="card-body">
          {error && (
            <div className="alert alert-error mb-6">
              {error}
            </div>
          )}

          {activeTab === 'courses' ? (
            <div>
              <h2 className="text-xl font-semibold mb-6">Course Reviews</h2>
              {courses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No courses to review</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {courses.map((course) => (
                    <div key={course.id} className="border rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-semibold">{course.title}</h3>
                          <p className="text-gray-600">By {course.creator_name}</p>
                          <p className="text-sm text-gray-500">{course.creator_email}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          course.status === 'published' 
                            ? 'bg-green-100 text-green-800' 
                            : course.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {course.status}
                        </span>
                      </div>

                      <p className="text-gray-700 mb-4">{course.description}</p>

                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          {course.lesson_count} lessons • Created {new Date(course.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex gap-2">
                          {course.status === 'draft' && (
                            <>
                              <button
                                onClick={() => handleApproveCourse(course.id)}
                                className="btn btn-success btn-sm"
                              >
                                ✓ Approve Course
                              </button>
                              <button
                                onClick={() => handleRejectCourse(course.id)}
                                className="btn btn-danger btn-sm"
                              >
                                ✗ Reject Course
                              </button>
                            </>
                          )}
                          {course.status === 'published' && (
                            <span className="text-green-600 font-semibold text-sm">
                              ✓ Approved & Live
                            </span>
                          )}
                          {course.status === 'rejected' && (
                            <span className="text-red-600 font-semibold text-sm">
                              ✗ Rejected
                            </span>
                          )}
                          <Link
                            to={`/courses/${course.id}`}
                            className="btn btn-secondary btn-sm"
                          >
                            View Course
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold mb-6">Creator Applications</h2>
              {applications.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No applications to review</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {applications.map((application) => (
                    <div key={application.id} className="border rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-semibold">{application.user_name}</h3>
                          <p className="text-gray-600">{application.user_email}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          application.status === 'approved' 
                            ? 'bg-green-100 text-green-800' 
                            : application.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {application.status}
                        </span>
                      </div>

                      <div className="mb-4">
                        <h4 className="font-semibold mb-2">Motivation:</h4>
                        <p className="text-gray-700 mb-4">{application.motivation}</p>
                        
                        <h4 className="font-semibold mb-2">Experience:</h4>
                        <p className="text-gray-700">{application.experience}</p>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          Applied {new Date(application.created_at).toLocaleDateString()}
                        </div>
                        {application.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => reviewApplication(application.id, 'approved')}
                              className="btn btn-success btn-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => reviewApplication(application.id, 'rejected')}
                              className="btn btn-danger btn-sm"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReview;
