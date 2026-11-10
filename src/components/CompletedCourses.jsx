import { courses } from '../data/catalog.js'
import { useCourseActions } from '../hooks/useCourseActions.js'
import { usePlanner } from '../state/PlannerContext.jsx'
import { locateCourse } from '../state/plannerReducer.js'

/** Courses already finished count as satisfied prerequisites and reduce what is left to plan. */
function CompletedCourses() {
  const { state, completedCourses } = usePlanner()
  const actions = useCourseActions()
  const candidates = courses.filter((course) => {
    const where = locateCourse(state, course.id)
    return where === null || where === 'cart' || where === 'planned'
  })

  return (
    <section className="card" aria-labelledby="completed-title">
      <div className="card__body stack">
        <h2 id="completed-title" className="h3">
          Already completed
        </h2>
        <p className="small muted">
          Transfer credit or classes you finished? Mark them here so prerequisites and progress are right.
        </p>
        <label className="field">
          <span className="field__label">Mark a course as completed</span>
          <select
            className="select"
            value=""
            onChange={(event) => event.target.value && actions.complete(event.target.value)}
          >
            <option value="" disabled>
              Choose a course…
            </option>
            {candidates.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code} · {course.title}
              </option>
            ))}
          </select>
        </label>
        {completedCourses.length > 0 && (
          <ul className="tag-list">
            {completedCourses.map((course) => (
              <li key={course.id}>
                <span className="tag">
                  {course.code}
                  <button type="button" aria-label={`Unmark ${course.code}`} onClick={() => actions.uncomplete(course.id)}>
                    ×
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

export default CompletedCourses
