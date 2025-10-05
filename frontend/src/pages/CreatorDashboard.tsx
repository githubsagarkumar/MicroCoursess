import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../config/axios';

interface Course {
  id: number;
  title: string;
  description: string;
  status: string;
  lesson_count: number;
  enrollment_count: number;
  created_at: string;
  updated_at: string;
  thumbnail_url?: string;
}

interface Lesson {
  id: number;
  title: string;
  content: string;
  video_url?: string;
  transcript?: string;
  order_index: number;
  duration: number;
}

const CreatorDashboard: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    thumbnail_url: ''
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [showLessons, setShowLessons] = useState(false);
  const [newLesson, setNewLesson] = useState({
    title: '',
    content: '',
    video_url: '',
    transcript: '',
    order_index: 1,
    duration: 0
  });
  const [addingLesson, setAddingLesson] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/courses/creator/my-courses');
      setCourses(response.data.items);
    } catch (err: any) {
      setError('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.title.trim() || !newCourse.description.trim()) {
      return;
    }

    try {
      setCreating(true);
      await axios.post('/api/courses', newCourse);
      setNewCourse({ title: '', description: '', thumbnail_url: '' });
      setShowCreateForm(false);
      fetchCourses();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create course');
    } finally {
      setCreating(false);
    }
  };

  const updateCourseStatus = async (course: Course, status: string) => {
    try {
      await axios.put(`/api/courses/${course.id}`, {
        title: course.title,
        description: course.description,
        thumbnail_url: course.thumbnail_url,
        status
      });
      await fetchCourses();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to update course');
    }
  };

  const fetchLessons = async (courseId: number) => {
    try {
      const response = await axios.get(`/api/lessons/course/${courseId}`);
      setLessons(response.data.lessons);
    } catch (err: any) {
      setError('Failed to fetch lessons');
    }
  };

  const handleViewLessons = async (course: Course) => {
    setSelectedCourse(course);
    await fetchLessons(course.id);
    setShowLessons(true);
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;

    try {
      setAddingLesson(true);
      await axios.post('/api/lessons', {
        ...newLesson,
        course_id: selectedCourse.id
      });
      setNewLesson({
        title: '',
        content: '',
        video_url: '',
        transcript: '',
        order_index: lessons.length + 1,
        duration: 0
      });
      fetchLessons(selectedCourse.id);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to add lesson');
    } finally {
      setAddingLesson(false);
    }
  };

  const handleDeleteLesson = async (lessonId: number) => {
    if (!window.confirm('Are you sure you want to delete this lesson?')) return;

    try {
      await axios.delete(`/api/lessons/${lessonId}`);
      if (selectedCourse) {
        fetchLessons(selectedCourse.id);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to delete lesson');
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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Creator Dashboard</h1>
            <p className="text-gray-600">
              Manage your courses and track their performance
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary"
          >
            Create New Course
          </button>
        </div>

        {error && (
          <div className="alert alert-error mb-6">
            {error}
          </div>
        )}
      </div>

      {showCreateForm && (
        <div className="card mb-8">
          <div className="card-header">
            <h2 className="text-xl font-semibold">Create New Course</h2>
          </div>
          <div className="card-body">
            <form onSubmit={handleCreateCourse}>
              <div className="form-group">
                <label className="form-label">Course Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  placeholder="Enter course title"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  placeholder="Describe what students will learn in this course"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Thumbnail URL (optional)</label>
                <input
                  type="url"
                  className="form-input"
                  value={newCourse.thumbnail_url}
                  onChange={(e) => setNewCourse({ ...newCourse, thumbnail_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={creating}
                >
                  {creating ? 'Creating...' : 'Create Course'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {courses.length === 0 ? (
        <div className="text-center py-12">
          <div className="mb-6">
            <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">No courses yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first course to start sharing knowledge
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary"
          >
            Create Your First Course
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div key={course.id} className="card">
              <div className="card-body">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold">{course.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    course.status === 'published' 
                      ? 'bg-green-100 text-green-800' 
                      : course.status === 'draft'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {course.status}
                  </span>
                </div>

                <p className="text-gray-600 mb-4 line-clamp-3">
                  {course.description}
                </p>

                <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                  <span>{course.lesson_count} lessons</span>
                  <span>{course.enrollment_count} enrolled</span>
                </div>

                <div className="space-y-2">
                  <div className="space-y-2">
                    <button
                      onClick={() => handleViewLessons(course)}
                      className="btn btn-primary btn-sm w-full"
                    >
                      Manage Lessons ({course.lesson_count})
                    </button>

                    <Link
                      to={`/courses/${course.id}`}
                      className="btn btn-secondary btn-sm w-full"
                    >
                      View Course
                    </Link>

                    {course.status === 'draft' && (
                      <button
                        onClick={() => updateCourseStatus(course, 'published')}
                        className="btn btn-success btn-sm w-full"
                      >
                        Submit for Review
                      </button>
                    )}

                    {course.status === 'published' && (
                      <button
                        onClick={() => updateCourseStatus(course, 'draft')}
                        className="btn btn-warning btn-sm w-full"
                      >
                        Unpublish
                      </button>
                    )}

                    {course.status === 'rejected' && (
                      <button
                        onClick={() => updateCourseStatus(course, 'draft')}
                        className="btn btn-secondary btn-sm w-full"
                      >
                        Edit & Resubmit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )          )}
        </div>
      )}

      {/* Lesson Management Modal */}
      {showLessons && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                  Manage Lessons - {selectedCourse.title}
                </h2>
                <button
                  onClick={() => setShowLessons(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Add New Lesson Form */}
              <div className="card mb-6">
                <div className="card-header">
                  <h3 className="text-lg font-semibold">Add New Lesson</h3>
                </div>
                <div className="card-body">
                  <form onSubmit={handleAddLesson}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-group">
                        <label className="form-label">Lesson Title</label>
                        <input
                          type="text"
                          className="form-input"
                          value={newLesson.title}
                          onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Order Index</label>
                        <input
                          type="number"
                          className="form-input"
                          value={newLesson.order_index}
                          onChange={(e) => setNewLesson({ ...newLesson, order_index: parseInt(e.target.value) })}
                          required
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Content</label>
                      <textarea
                        className="form-textarea"
                        value={newLesson.content}
                        onChange={(e) => setNewLesson({ ...newLesson, content: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-group">
                        <label className="form-label">Video URL (optional)</label>
                        <input
                          type="url"
                          className="form-input"
                          value={newLesson.video_url}
                          onChange={(e) => setNewLesson({ ...newLesson, video_url: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Duration (minutes)</label>
                        <input
                          type="number"
                          className="form-input"
                          value={newLesson.duration}
                          onChange={(e) => setNewLesson({ ...newLesson, duration: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Transcript (optional)</label>
                      <textarea
                        className="form-textarea"
                        value={newLesson.transcript}
                        onChange={(e) => setNewLesson({ ...newLesson, transcript: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={addingLesson}
                    >
                      {addingLesson ? 'Adding...' : 'Add Lesson'}
                    </button>
                  </form>
                </div>
              </div>

              {/* Existing Lessons */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Existing Lessons</h3>
                {lessons.length === 0 ? (
                  <p className="text-gray-500">No lessons added yet</p>
                ) : (
                  lessons.map((lesson) => (
                    <div key={lesson.id} className="card">
                      <div className="card-body">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold">{lesson.title}</h4>
                            <p className="text-sm text-gray-600 mb-2">
                              Order: {lesson.order_index} • Duration: {lesson.duration} min
                            </p>
                            <p className="text-sm text-gray-700 line-clamp-2">
                              {lesson.content}
                            </p>
                            {lesson.video_url && (
                              <p className="text-xs text-blue-600 mt-1">
                                Video: {lesson.video_url}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => handleDeleteLesson(lesson.id)}
                              className="btn btn-danger btn-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatorDashboard;
