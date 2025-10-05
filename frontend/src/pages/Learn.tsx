import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from '../config/axios';

interface Lesson {
  id: number;
  title: string;
  content: string;
  video_url?: string;
  transcript?: string;
  order_index: number;
  duration: number;
  course_title: string;
  course_id: number;
}

const Learn: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    fetchLesson();
  }, [lessonId]);

  const fetchLesson = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/lessons/${lessonId}`);
      setLesson(response.data.lesson);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch lesson');
    } finally {
      setLoading(false);
    }
  };

  const markAsCompleted = async () => {
    if (!lesson) return;

    try {
      setCompleting(true);
      await axios.post('/api/progress/complete', { lesson_id: lesson.id });
      setCompleted(true);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to mark lesson as completed');
    } finally {
      setCompleting(false);
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

  if (!lesson) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Lesson not found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <nav className="text-sm text-gray-500 mb-4">
          <Link to="/courses" className="hover:underline">Courses</Link>
          <span className="mx-2">/</span>
          <Link to={`/courses/${lesson.course_id}`} className="hover:underline">
            {lesson.course_title}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-800">{lesson.title}</span>
        </nav>
        
        <h1 className="text-3xl font-bold mb-2">{lesson.title}</h1>
        <p className="text-gray-600">
          Lesson {lesson.order_index} • {lesson.duration} minutes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-body">
              {lesson.video_url && (
                <div className="mb-6">
                  <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                    <video
                      controls
                      className="w-full h-full"
                      src={lesson.video_url}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </div>
              )}

              <div className="prose max-w-none">
                <h3 className="text-xl font-semibold mb-4">Lesson Content</h3>
                <div className="whitespace-pre-wrap">{lesson.content}</div>
              </div>

              {lesson.transcript && (
                <div className="mt-8">
                  <h3 className="text-xl font-semibold mb-4">Transcript</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="whitespace-pre-wrap text-sm">
                      {lesson.transcript}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8 pt-6 border-t">
                {completed ? (
                  <div className="text-center">
                    <div className="text-green-600 mb-4">
                      <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-green-600 font-semibold mb-4">
                      Lesson Completed!
                    </p>
                    <Link
                      to="/progress"
                      className="btn btn-secondary"
                    >
                      View Progress
                    </Link>
                  </div>
                ) : (
                  <div className="text-center">
                    <button
                      onClick={markAsCompleted}
                      disabled={completing}
                      className="btn btn-success"
                    >
                      {completing ? 'Marking Complete...' : 'Mark as Completed'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-header">
              <h3 className="text-xl font-semibold">Course Navigation</h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <Link
                  to={`/courses/${lesson.course_id}`}
                  className="btn btn-secondary w-full"
                >
                  Back to Course
                </Link>
                <Link
                  to="/progress"
                  className="btn btn-secondary w-full"
                >
                  View Progress
                </Link>
                <Link
                  to="/courses"
                  className="btn btn-secondary w-full"
                >
                  Browse Courses
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Learn;
