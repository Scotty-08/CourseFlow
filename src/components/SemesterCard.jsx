import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCourseActions } from '../hooks/useCourseActions.js'
import { usePlanner } from '../state/PlannerContext.jsx'
import { formatMoney } from '../utils/pricing.js'
import CostBreakdown from './CostBreakdown.jsx'
import CreditMeter from './CreditMeter.jsx'
import IssueList from './IssueList.jsx'

function SemesterCard({ semester, moveTargets }) {
  const { dispatch } = usePlanner()
  const actions = useCourseActions()
  const [confirmingRemove, setConfirmingRemove] = useState(false)
  const paid = Boolean(semester.receipt)
  const empty = semester.courses.length === 0

  function handleMove(courseId, value) {
    if (value === 'cart') actions.unassign(courseId)
    else if (value) actions.assign(courseId, value)
  }

  return (
    <section className={`semester${paid ? ' semester--paid' : ''}`} aria-labelledby={`sem-${semester.id}`}>
      <header className="semester__head">
        <div>
          <h3 id={`sem-${semester.id}`}>{semester.label}</h3>
          <p className="small muted">
            {semester.courses.length} course{semester.courses.length === 1 ? '' : 's'}
          </p>
        </div>
        {paid ? <span className="badge badge--ok">Paid · locked</span> : <span className="badge">Unpaid</span>}
      </header>

      <CreditMeter credits={semester.pricing.credits} />

      {empty ? (
        <p className="semester__empty">Nothing here yet. Add courses from your cart or the catalog.</p>
      ) : (
        <ul className="semester__courses">
          {semester.courses.map((course) => (
            <li key={course.id} className="semester-course">
              <div className="semester-course__main">
                <Link to={`/course/${course.id}`} className="semester-course__code">
                  {course.code}
                </Link>
                <span className="semester-course__title">{course.title}</span>
                <span className="muted small nowrap">
                  {course.registrationOnly ? 'R' : `${course.credits} cr`} ·{' '}
                  {course.price === 0 ? 'Free' : formatMoney(course.price)}
                </span>
              </div>
              {!paid && (
                <label className="semester-course__move">
                  <span className="sr-only">Move {course.code}</span>
                  <select
                    className="select select--sm"
                    value=""
                    onChange={(event) => handleMove(course.id, event.target.value)}
                  >
                    <option value="" disabled>
                      Move…
                    </option>
                    {moveTargets
                      .filter((target) => target.id !== semester.id)
                      .map((target) => (
                        <option key={target.id} value={target.id}>
                          {target.label}
                        </option>
                      ))}
                    <option value="cart">Back to cart</option>
                  </select>
                </label>
              )}
            </li>
          ))}
        </ul>
      )}

      <IssueList issues={semester.issues} />
      <CostBreakdown pricing={semester.pricing} />

      <footer className="semester__foot">
        {paid ? (
          <Link to={`/receipt/${semester.id}`} className="btn btn--ghost btn--block">
            View receipt · {semester.receipt.transactionId}
          </Link>
        ) : (
          <>
            {empty ? (
              <button type="button" className="btn btn--primary btn--block" disabled>
                Pay for this semester
              </button>
            ) : (
              <Link to={`/checkout/${semester.id}`} className="btn btn--primary btn--block">
                Pay {formatMoney(semester.pricing.total)} for {semester.label}
              </Link>
            )}
            {confirmingRemove ? (
              <div className="row">
                <button
                  type="button"
                  className="btn btn--danger btn--sm"
                  onClick={() => dispatch({ type: 'semester/remove', semesterId: semester.id })}
                >
                  Yes, remove{empty ? '' : ' (courses go to cart)'}
                </button>
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => setConfirmingRemove(false)}>
                  Keep
                </button>
              </div>
            ) : (
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setConfirmingRemove(true)}>
                Remove semester
              </button>
            )}
          </>
        )}
      </footer>
    </section>
  )
}

export default SemesterCard
