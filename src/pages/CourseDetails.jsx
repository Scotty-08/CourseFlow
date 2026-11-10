import { Link, useLocation, useNavigate } from 'react-router-dom'
import CourseArtwork from '../components/CourseArtwork.jsx'
import { formatPrice } from '../utils/courseFormat.js'

function CourseDetails() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const course = state?.course

  if (!course) {
    return (
      <main className="mx-auto max-w-3xl space-y-4 px-5 py-12">
        <h1 className="text-3xl font-bold">Choose a course first</h1>
        <p className="text-[var(--color-muted)]">
          Open a course from the browse page to see its details.
        </p>
        <Link to="/" className="text-[var(--color-gold)] hover:underline">
          Return to Browse Courses
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-5 py-10 md:grid-cols-2 md:items-center">
      <CourseArtwork course={course} />

      <section className="space-y-3">
        <p className="font-semibold text-[var(--color-gold)]">{course.code}</p>
        <h1 className="text-4xl font-bold">{course.title}</h1>
        <p className="text-lg text-[var(--color-muted)]">{course.category}</p>
        <p className="text-[var(--color-muted)]">
          Instructor: {course.instructor}
        </p>
        <p className="text-[var(--color-muted)]">
          Duration: {course.duration}
        </p>
        <p className="text-[var(--color-muted)]">Price: {formatPrice(course)}</p>

        <p className="leading-relaxed text-[var(--color-muted)]">
          {course.description}
        </p>

        <div className="border-y border-[var(--color-border)] py-4">
          <h2 className="font-semibold">Course preview</h2>
          <iframe
            className="mt-3 aspect-video w-full"
            src={course.trailer}
            title={`${course.title} trailer`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>

        <button
          type="button"
          onClick={() => navigate('/enrollment', { state: { course } })}
          className="bg-[var(--color-gold)] px-5 py-3 font-bold text-[#1b120d] hover:bg-[var(--color-gold-bright)]"
        >
          Enroll Now
        </button>
      </section>
    </main>
  )
}

export default CourseDetails
