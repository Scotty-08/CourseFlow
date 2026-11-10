import React from 'react';
import { useNavigate } from 'react-router-dom';
import courses from '../data/courses.json'; // Imports JSON file with course information

export default function Home() {
  const navigate = useNavigate();

  // Gets categories from the file for the courses
  const categories = [...new Set(courses.map(course => course.category))];

  // Handler to navigate to details page and pass selected object
  const handleViewDetails = (course) => {
    navigate('/course-details', { state: { course } });
  };

  return (
    <div className="min-h-screen bg-[var(--color-espresso)] p-6 text-[var(--color-text)] md:p-8">
      {/* Main Header / Netflix Title Banner */}
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold tracking-wider text-[var(--color-gold)]">SkillFlix</h1>
        <p className="mt-2 text-[var(--color-muted)]">Explore top-rated technical and engineering courses</p>
      </header>

      {/* Map through each category to create Netflix-style rows */}
      {categories.map((category) => {
        const categoryCourses = courses.filter((c) => c.category === category);
        return (
          <div key={category} className="mb-8">
            <h2 className="mb-4 border-l-4 border-[var(--color-gold)] px-2 text-2xl font-semibold">
              {category}
            </h2>

            {/* Horizontal Scrollable Carousel Container */}
            <div className="flex space-x-6 overflow-x-auto pb-4">
              {categoryCourses.map((course) => (
                <div
                  key={course.id}
                  className="flex min-w-[280px] max-w-[280px] shrink-0 flex-col justify-between overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl transition duration-300 hover:scale-105"
                >
                  {/* Course Thumbnail & Info */}
                  <div>
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-40 object-cover"
                    />
                    <div className="p-4">
                      <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-gold)]">
                        {course.code}
                      </span>
                      <h3 className="text-lg font-bold mt-1 line-clamp-1">{course.title}</h3>
                      <p className="mt-1 text-sm text-[var(--color-muted)]">Instructor: {course.instructor}</p>
                      <p className="mt-2 text-sm font-semibold text-[var(--color-gold-bright)]">${course.price}</p>
                    </div>
                  </div>

                  {/* View Details Button */}
                  <div className="p-4 pt-0">
                    <button
                      onClick={() => handleViewDetails(course)}
                      className="w-full cursor-pointer bg-[var(--color-gold)] py-2 font-medium text-[#1b120d] transition hover:bg-[var(--color-gold-bright)]"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
