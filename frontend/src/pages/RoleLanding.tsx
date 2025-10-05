import React from 'react';
import { Link } from 'react-router-dom';

const roles = [
  { key: 'admin', title: 'Admin', desc: 'Manage and review courses' },
  { key: 'creator', title: 'Creator', desc: 'Create and manage content' },
  { key: 'learner', title: 'Learner', desc: 'Learn and track progress' },
];

const RoleLanding: React.FC = () => {
  return (
    <div className="container py-5">
      <div className="text-center mb-5">
        <h1 className="fw-bold">Welcome to MicroCourses</h1>
        <p className="text-muted">Choose how you want to continue</p>
      </div>

      <div className="row g-4 justify-content-center">
        {roles.map((r) => (
          <div className="col-12 col-sm-6 col-lg-4" key={r.key}>
            <div className="card h-100 shadow-sm">
              <div className="card-body d-flex flex-column">
                <div className="d-flex align-items-center mb-3">
                  <div className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center me-3" style={{ width: 48, height: 48 }}>
                    <span className="fw-bold text-uppercase">{r.title.charAt(0)}</span>
                  </div>
                  <div>
                    <h5 className="card-title mb-0">{r.title}</h5>
                    <small className="text-muted">{r.desc}</small>
                  </div>
                </div>
                <div className="mt-auto d-grid gap-2">
                  <Link className="btn btn-primary" to={`/login?role=${r.key}`}>Login as {r.title}</Link>
                  <Link className="btn btn-outline-secondary" to={`/register?role=${r.key}`}>Register as {r.title}</Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoleLanding;


