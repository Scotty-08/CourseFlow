import { usePlanner } from '../state/PlannerContext.jsx'
import { locateCourse, semesterOfCourse } from '../state/plannerReducer.js'
import { semesterLabel } from '../utils/semester.js'

/** Shows where a course currently lives: cart, a semester, paid or completed. */
function StatusBadge({ courseId }) {
  const { state } = usePlanner()
  const where = locateCourse(state, courseId)
  if (!where) return null

  if (where === 'completed') return <span className="badge badge--ok">Completed</span>
  if (where === 'cart') return <span className="badge badge--gold">In cart</span>

  const label = semesterLabel(semesterOfCourse(state, courseId))
  return where === 'paid' ? (
    <span className="badge badge--ok">Paid · {label}</span>
  ) : (
    <span className="badge badge--info">Planned · {label}</span>
  )
}

export default StatusBadge
