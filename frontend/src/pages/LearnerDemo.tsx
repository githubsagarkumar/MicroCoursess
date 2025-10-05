import React from 'react';
import { Link } from 'react-router-dom';

const demoCourses = [
  { id: 1, title: 'React Basics', description: 'Build components, props, and state' },
  { id: 2, title: 'TypeScript Essentials', description: 'Types, interfaces, generics' },
  { id: 3, title: 'Node & Express', description: 'APIs, middleware, routing' },
];

const LearnerDemo: React.FC = () => {
  return (
    <div className="container py-5">
      <div className="text-center mb-4">
        <h1 className="fw-bold">Explore as a Learner</h1>
        <p className="text-muted mb-0">Preview how the learner experience looks—no login required.</p>
      </div>

      <div className="row g-4">
        {demoCourses.map((c) => (
          <div className="col-12 col-md-6 col-lg-4" key={c.id}>
            <div className="card h-100 shadow-sm">
              <div className="card-body d-flex flex-column">
                <h5 className="card-title">{c.title}</h5>
                <p className="card-text text-muted">{c.description}</p>
                <div className="mt-auto d-grid">
                  <button className="btn btn-outline-primary" disabled>Preview Lesson</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-5">
        <p className="text-muted">Like what you see?</p>
        <div className="d-flex gap-2 justify-content-center">
          <Link className="btn btn-primary" to="/register?role=learner">Sign up as Learner</Link>
          <Link className="btn btn-outline-secondary" to="/login?role=learner">Login</Link>
        </div>
      </div>
    </div>
  );
};

export default LearnerDemo;


