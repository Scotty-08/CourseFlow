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
  const { state } = usePlanner()
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const visible = useMemo(() => filterCourses(courses, filters), [filters])

  return (
    <main id="main">
      <section className="hero">
        <div className="container hero__inner">
          <div className="hero__copy">
            <p className="eyebrow">Iowa State · Computer Engineering</p>
            <h1>
              <span className="glitch-text" data-text="Compile your degree plan.">
                Compile your degree plan.
              </span>
            </h1>
            <p className="lead lead--light">
              Build a cart of CPRE courses, schedule them into semesters, catch prerequisite bugs before
              they ship, and see exactly what each semester costs.
            </p>
            <div className="row">
              <Link to="/planner" className="btn btn--primary">
                Open planner
              </Link>
              <Link to="/cart" className="btn btn--ghost">
                Cart{state.cart.length > 0 ? ` (${state.cart.length})` : ''}
              </Link>
            </div>
          </div>

          <div className="term" aria-hidden="true">
            <div className="term__bar">
              <span className="term__dot" />
              <span className="term__dot" />
              <span className="term__dot" />
              <span className="term__title">courseflow — zsh</span>
            </div>
            <pre className="term__body">
              <span className="term__prompt">$</span> courseflow plan --major cpre{'\n'}
              <span className="term__ok">✓</span> loaded {courses.length} courses{'\n'}
              <span className="term__ok">✓</span> resolved prerequisite graph{'\n'}
              <span className="term__warn">!</span> MATH 1660 scheduled before MATH 1650{'\n'}
              <span className="term__dim">  fix: move MATH 1660 to a later semester</span>{'\n'}
              <span className="term__ok">✓</span> {formatMoney(TUITION_CAP)} cap applies past {CAP_CREDIT_THRESHOLD} credits{'\n'}
              <span className="term__prompt">$</span> <span className="term__cursor" />
            </pre>
          </div>

          <ol className="steps hero__steps">
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
