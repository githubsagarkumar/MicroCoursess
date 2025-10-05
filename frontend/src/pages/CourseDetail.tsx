import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from '../config/axios';

interface Course {
  id: number;
  title: string;
  description: string;
  creator_name: string;
  lesson_count: number;
  thumbnail_url?: string;
  created_at: string;
}

interface Lesson {
  id: number;
  title: string;
  order_index: number;
  duration: number;
}

const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrolled, setEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    fetchCourseDetails();
    if (user) {
      checkEnrollment();
    }
  }, [id, user]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      const [courseResponse, lessonsResponse] = await Promise.all([
        axios.get(`/api/courses/${id}`),
        axios.get(`/api/lessons/course/${id}`)
      ]);
      
      setCourse(courseResponse.data.course);
      setLessons(lessonsResponse.data.lessons);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch course details');
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollment = async () => {
    try {
      const response = await axios.get(`/api/enrollments/check/${id}`);
      setEnrolled(response.data.enrolled);
    } catch (err) {
      // User might not be enrolled, which is fine
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      return;
    }

    try {
      setEnrolling(true);
      await axios.post('/api/enrollments', { course_id: parseInt(id!) });
      setEnrolled(true);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to enroll in course');
    } finally {
      setEnrolling(false);
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

  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Course not found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="card">
            {course.thumbnail_url && (
              <div className="aspect-video bg-gray-200 flex items-center justify-center">
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="card-body">
              <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
              <p className="text-gray-600 mb-6">{course.description}</p>
              
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-gray-500">Created by</p>
                  <p className="font-semibold">{course.creator_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Lessons</p>
                  <p className="font-semibold">{course.lesson_count}</p>
                </div>
              </div>

              {user ? (
                enrolled ? (
                  <div className="flex gap-4">
                    <Link
                      to={`/learn/${lessons[0]?.id}`}
                      className="btn btn-primary"
                    >
                      Start Learning
                    </Link>
                    <Link
                      to="/progress"
                      className="btn btn-secondary"
                    >
                      View Progress
                    </Link>
                  </div>
                ) : (
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="btn btn-primary"
                  >
                    {enrolling ? 'Enrolling...' : 'Enroll in Course'}
                  </button>
                )
              ) : (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    Please login to enroll in this course
                  </p>
                  <Link to="/login" className="btn btn-primary">
                    Login
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-header">
              <h3 className="text-xl font-semibold">Course Lessons</h3>
            </div>
            <div className="card-body">
              {lessons.length === 0 ? (
                <p className="text-gray-500">No lessons available yet</p>
              ) : (
                <div className="space-y-3">
                  {lessons.map((lesson) => (
                    <div key={lesson.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{lesson.title}</p>
                        <p className="text-sm text-gray-500">
                          Lesson {lesson.order_index}
                          {lesson.duration > 0 && ` • ${lesson.duration} min`}
                        </p>
                      </div>
                      {enrolled && (
                        <Link
                          to={`/learn/${lesson.id}`}
                          className="btn btn-sm btn-secondary"
                        >
                          Learn
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
