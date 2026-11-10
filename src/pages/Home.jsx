import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import CourseCard from '../components/CourseCard.jsx'
import CourseFilters from '../components/CourseFilters.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { courses } from '../data/catalog.js'
import { usePlanner } from '../state/PlannerContext.jsx'
import { CAP_CREDIT_THRESHOLD, TUITION_CAP } from '../config.js'
import { DEFAULT_FILTERS, filterCourses, levelsOf } from '../utils/filterCourses.js'
import { formatMoney } from '../utils/pricing.js'

const levels = levelsOf(courses)

const steps = [
  { title: 'Pick courses', text: 'Browse the CPRE course list and add what you want to your cart.' },
  { title: 'Plan semesters', text: 'Drop them into Spring or Fall of any year and watch the credits add up.' },
  { title: 'Pay per semester', text: `See the cost live. Past ${CAP_CREDIT_THRESHOLD} credits the bill tops out at ${formatMoney(TUITION_CAP)}.` },
]

function Home() {
  const { state, selectedCount } = usePlanner()
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const visible = useMemo(() => filterCourses(courses, filters), [filters])

  return (
    <main id="main">
      <section className="hero">
        <div className="container hero__inner">
          <p className="eyebrow eyebrow--gold">Iowa State · Computer Engineering</p>
          <h1>Plan every CPRE semester before it starts.</h1>
          <p className="lead lead--light">
            CourseFlow lets you build a cart of courses, place them into semesters, check prerequisites and
            see exactly what each semester costs.
          </p>
          <div className="row">
            <Link to="/planner" className="btn btn--gold">
              Open my planner
            </Link>
            <Link to="/cart" className="btn btn--ghost btn--on-dark">
              Cart{selectedCount > 0 || state.cart.length > 0 ? ` (${state.cart.length})` : ''}
            </Link>
          </div>
          <ol className="steps">
            {steps.map((step, index) => (
              <li key={step.title} className="step">
                <span className="step__num">{index + 1}</span>
                <div>
                  <h2>{step.title}</h2>
                  <p>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="container page">
        <div className="page-head">
          <p className="eyebrow">Course catalog</p>
          <h2 className="page-head__title">Find your next courses</h2>
        </div>

        <CourseFilters filters={filters} levels={levels} onChange={setFilters} resultCount={visible.length} />

        {visible.length === 0 ? (
          <EmptyState
            title="No courses match"
            action={
              <button type="button" className="btn btn--primary" onClick={() => setFilters(DEFAULT_FILTERS)}>
                Clear filters
              </button>
            }
          >
            Try a different search or clear the filters.
          </EmptyState>
        ) : (
          <div className="course-grid">
            {visible.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

export default Home
