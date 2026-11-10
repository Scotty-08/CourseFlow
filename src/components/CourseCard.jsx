import { Link } from 'react-router-dom'
import { getCourse } from '../data/catalog.js'
import { coreqsOf, prereqsOf } from '../data/prerequisites.js'
import { useCourseActions } from '../hooks/useCourseActions.js'
import { usePlanner } from '../state/PlannerContext.jsx'
import { locateCourse } from '../state/plannerReducer.js'
import { formatMoney } from '../utils/pricing.js'
import CourseArtwork from './CourseArtwork.jsx'
import StatusBadge from './StatusBadge.jsx'

function codesOf(ids) {
  return ids.map((id) => getCourse(id)?.code ?? id).join(', ')
}

function CourseCard({ course }) {
  const { state } = usePlanner()
  const actions = useCourseActions()
  const where = locateCourse(state, course.id)
  const prereqs = prereqsOf(course.id)
  const coreqs = coreqsOf(course.id)

  return (
    <article className="course-card">
      <Link to={`/course/${course.id}`} className="course-card__art" tabIndex={-1} aria-hidden="true">
        <CourseArtwork course={course} />
        <span className="course-card__credits">
          {course.registrationOnly ? 'Registration only' : `${course.credits} cr`}
        </span>
      </Link>

      <div className="course-card__body">
        <div className="row row--between">
          <p className="course-card__code">{course.code}</p>
          <StatusBadge courseId={course.id} />
        </div>
        <h3 className="course-card__title">
          <Link to={`/course/${course.id}`}>{course.title}</Link>
        </h3>
        <p className="course-card__meta">
          {prereqs.length > 0 && <span>Prereq: {codesOf(prereqs)}</span>}
          {coreqs.length > 0 && <span>Coreq: {codesOf(coreqs)}</span>}
          {prereqs.length === 0 && coreqs.length === 0 && <span>No prerequisites listed</span>}
        </p>

        <div className="course-card__foot">
          <p className="price">{course.price === 0 ? 'Free' : formatMoney(course.price)}</p>
          {where === null && (
            <button type="button" className="btn btn--primary btn--sm" onClick={() => actions.addToCart(course.id)}>
              Add to cart
            </button>
          )}
          {where === 'cart' && (
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => actions.removeFromCart(course.id)}>
              Remove
            </button>
          )}
          {(where === 'planned' || where === 'paid') && (
            <Link to="/planner" className="btn btn--ghost btn--sm">
              View plan
            </Link>
          )}
          {where === 'completed' && (
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => actions.uncomplete(course.id)}>
              Undo completed
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

export default CourseCard
