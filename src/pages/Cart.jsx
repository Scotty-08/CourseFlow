import { Link } from 'react-router-dom'
import CourseArtwork from '../components/CourseArtwork.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { coreqsOf, prereqsOf } from '../data/prerequisites.js'
import { useCourseActions } from '../hooks/useCourseActions.js'
import { usePlanner } from '../state/PlannerContext.jsx'
import { priceSemester, formatMoney } from '../utils/pricing.js'
import { semesterLabel, sortSemesters } from '../utils/semester.js'

function Cart() {
  const { state, dispatch, cartCourses } = usePlanner()
  const actions = useCourseActions()
  const unpaid = sortSemesters(state.semesters).filter((id) => !state.paid[id])
  const totals = priceSemester(cartCourses)

  function moveAll(semesterId) {
    for (const course of cartCourses) dispatch({ type: 'plan/assign', courseId: course.id, semesterId })
  }

  return (
    <main id="main" className="container page">
      <div className="page-head">
        <p className="eyebrow">Your cart</p>
        <h1>Courses you are considering</h1>
        <p className="lead">
          The cart holds courses you have not placed yet. Put each one into a semester to see what that
          semester will cost.
        </p>
      </div>

      {cartCourses.length === 0 ? (
        <EmptyState
          title="Your cart is empty"
          action={
            <div className="row">
              <Link to="/" className="btn btn--primary">
                Browse courses
              </Link>
              <Link to="/planner" className="btn btn--ghost">
                Open planner
              </Link>
            </div>
          }
        >
          Add courses from the catalog and they will show up here. Courses you have already placed in a
          semester live in the planner.
        </EmptyState>
      ) : (
        <div className="two-col">
          <ul className="cart-list">
            {cartCourses.map((course) => (
              <li key={course.id} className="cart-item card">
                <div className="cart-item__art">
                  <CourseArtwork course={course} />
                </div>
                <div className="cart-item__body">
                  <div>
                    <Link to={`/course/${course.id}`} className="cart-item__code">
                      {course.code}
                    </Link>
                    <h2 className="cart-item__title">{course.title}</h2>
                    <p className="small muted">
                      {course.registrationOnly ? 'Registration only' : `${course.credits} credits`} ·{' '}
                      {course.price === 0 ? 'Free' : formatMoney(course.price)}
                      {(prereqsOf(course.id).length > 0 || coreqsOf(course.id).length > 0) && ' · has prerequisites'}
                    </p>
                  </div>
                  <div className="row">
                    <label className="field field--inline">
                      <span className="sr-only">Plan {course.code} for</span>
                      <select
                        className="select select--sm"
                        value=""
                        onChange={(event) => event.target.value && actions.assign(course.id, event.target.value)}
                      >
                        <option value="" disabled>
                          Plan for…
                        </option>
                        {unpaid.map((id) => (
                          <option key={id} value={id}>
                            {semesterLabel(id)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => actions.removeFromCart(course.id)}>
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <aside className="card summary">
            <div className="card__body stack">
              <h2 className="h3">Cart summary</h2>
              <dl className="summary__rows">
                <div>
                  <dt>Courses</dt>
                  <dd>{cartCourses.length}</dd>
                </div>
                <div>
                  <dt>Credits</dt>
                  <dd>{totals.credits}</dd>
                </div>
                <div>
                  <dt>List price</dt>
                  <dd>{formatMoney(totals.subtotal)}</dd>
                </div>
              </dl>
              <p className="small muted">
                Nothing is charged from the cart. You pay one semester at a time from the planner.
              </p>
              <label className="field">
                <span className="field__label">Move everything to</span>
                <select className="select" value="" onChange={(event) => event.target.value && moveAll(event.target.value)}>
                  <option value="" disabled>
                    Choose a semester…
                  </option>
                  {unpaid.map((id) => (
                    <option key={id} value={id}>
                      {semesterLabel(id)}
                    </option>
                  ))}
                </select>
              </label>
              <Link to="/planner" className="btn btn--primary btn--block">
                Go to planner
              </Link>
              <button type="button" className="btn btn--ghost btn--block" onClick={() => dispatch({ type: 'cart/clear' })}>
                Empty cart
              </button>
            </div>
          </aside>
        </div>
      )}
    </main>
  )
}

export default Cart
