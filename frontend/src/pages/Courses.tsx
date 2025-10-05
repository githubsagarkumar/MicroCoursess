import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../config/axios';

interface Course {
  id: number;
  title: string;
  description: string;
  creator_name: string;
  lesson_count: number;
  enrollment_count: number;
  thumbnail_url?: string;
  created_at: string;
}

const Courses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async (newOffset = 0) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/courses?limit=12&offset=${newOffset}`);
      const { items, next_offset } = response.data;
      
      if (newOffset === 0) {
        setCourses(items);
      } else {
        setCourses(prev => [...prev, ...items]);
      }
      
      setHasMore(!!next_offset);
      setOffset(newOffset);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchCourses(offset + 12);
    }
  };

  if (loading && courses.length === 0) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Available Courses</h1>
        <p className="text-gray-600">
          Discover and enroll in courses created by our community of educators
        </p>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          {error}
        </div>
      )}

      {courses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No courses available yet</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div key={course.id} className="card">
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
                  <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {course.description}
                  </p>
                  <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                    <span>By {course.creator_name}</span>
                    <span>{course.lesson_count} lessons</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      {course.enrollment_count} enrolled
                    </span>
                    <Link
                      to={`/courses/${course.id}`}
                      className="btn btn-primary btn-sm"
                    >
                      View Course
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="text-center mt-8">
              <button
                onClick={loadMore}
                disabled={loading}
                className="btn btn-secondary"
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Courses;
