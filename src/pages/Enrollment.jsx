import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Enrollment() {
  const location = useLocation();
  const navigate = useNavigate();

  // Grab the course object passed from router state
  const course = location.state?.course || { title: "Selected Course", price: 0 };

  // Forms the inputs using Hooks
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    startDate: '',
    learningMode: 'Online',
    comments: '',
  });

  // Error message
  const [error, setError] = useState('');

  // Handle changes for all form fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Form submission and validation
  const handleSubmit = (e) => {
    e.preventDefault();

    //Makes sure required fields are filled out
    if (!formData.fullName || !formData.email || !formData.startDate) {
      setError('Please fill in all required fields.');
      return;
    }

    // Ensures email is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setError('');
    // Pass both  course data and user enrollment form data to  payment page with route state
    navigate('/payment', { state: { course, enrollment: formData } });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-espresso)] p-6 text-[var(--color-text)]">
      <div className="w-full max-w-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-xl">
        <h2 className="mb-2 text-3xl font-bold text-[var(--color-gold)]">Course Enrollment</h2>
        <p className="mb-6 font-medium text-[var(--color-muted)]">
          Enrolling in: <span className="text-[var(--color-text)] underline">{course.title}</span> (${course.price})
        </p>

        {/* Error notification alert */}
        {error && (
          <div className="mb-4 border border-[var(--color-error)] bg-[var(--color-error)]/10 p-3 text-sm text-[var(--color-error)]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Section 1: User Information */}
          <div className="space-y-4 border-b border-[var(--color-border)] pb-4">
            <h3 className="text-xl font-semibold text-[var(--color-text)]">1. User Information</h3>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-muted)]">Full Name *</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full border border-[var(--color-border)] bg-[var(--color-espresso)] px-3 py-2 text-[var(--color-text)] outline-none focus:border-[var(--color-gold)]"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-muted)]">Email Address *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border border-[var(--color-border)] bg-[var(--color-espresso)] px-3 py-2 text-[var(--color-text)] outline-none focus:border-[var(--color-gold)]"
                placeholder="john@example.com"
              />
            </div>
          </div>

          {/* Section 2: Enrollment Details */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-[var(--color-text)]">2. Enrollment Details</h3>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-muted)]">Preferred Start Date *</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full border border-[var(--color-border)] bg-[var(--color-espresso)] px-3 py-2 text-[var(--color-text)] outline-none focus:border-[var(--color-gold)]"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-muted)]">Preferred Mode of Learning</label>
              <select
                name="learningMode"
                value={formData.learningMode}
                onChange={handleChange}
                className="w-full border border-[var(--color-border)] bg-[var(--color-espresso)] px-3 py-2 text-[var(--color-text)] outline-none focus:border-[var(--color-gold)]"
              >
                <option value="Online">Online</option>
                <option value="In-Person">In-Person</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-muted)]">Comment or Message to Instructor (Optional)</label>
              <textarea
                name="comments"
                value={formData.comments}
                onChange={handleChange}
                rows="3"
                className="w-full border border-[var(--color-border)] bg-[var(--color-espresso)] px-3 py-2 text-[var(--color-text)] outline-none focus:border-[var(--color-gold)]"
                placeholder="Any questions or notes..."
              ></textarea>
            </div>
          </div>

          {/* Submit button to move to Payment view */}
          <button
            type="submit"
            className="w-full cursor-pointer bg-[var(--color-gold)] py-3 font-bold text-[#1b120d] transition duration-200 hover:bg-[var(--color-gold-bright)]"
          >
            Proceed to Payment
          </button>
        </form>
      </div>
    </div>
  );
}
