import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import CourseArtwork from '../components/CourseArtwork.jsx'
import EmptyState from '../components/EmptyState.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { getCourse } from '../data/catalog.js'
import { coreqsOf, prereqsOf, unlocksOf } from '../data/prerequisites.js'
import { useCourseActions } from '../hooks/useCourseActions.js'
import { usePlanner } from '../state/PlannerContext.jsx'
import { locateCourse } from '../state/plannerReducer.js'
import { formatMoney } from '../utils/pricing.js'
import { semesterLabel, sortSemesters } from '../utils/semester.js'

function CourseLinks({ ids }) {
  if (ids.length === 0) return <p className="muted small">None listed.</p>
  return (
    <ul className="link-list">
      {ids.map((id) => {
        const course = getCourse(id)
        return (
          <li key={id}>
            <Link to={`/course/${id}`} className="link-pill">
              <strong>{course?.code ?? id}</strong>
              <span>{course?.title}</span>
              <StatusBadge courseId={id} />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

function CourseDetails() {
  const { id } = useParams()
  const course = getCourse(id)
  const { state } = usePlanner()
  const actions = useCourseActions()
  const [showTrailer, setShowTrailer] = useState(false)

  if (!course) {
    return (
      <main id="main" className="container page">
        <EmptyState
          title="Course not found"
          action={
            <Link to="/" className="btn btn--primary">
              Back to the catalog
            </Link>
          }
        >
          We could not find a course called “{id}”.
        </EmptyState>
      </main>
    )
  }

  const where = locateCourse(state, course.id)
  const unpaidSemesters = sortSemesters(state.semesters).filter((semesterId) => !state.paid[semesterId])

  return (
    <main id="main" className="container page">
      <p className="small">
        <Link to="/" className="link">
          ← All courses
        </Link>
      </p>

      <div className="details">
        <div className="stack">
          <div className="details__media">
            {showTrailer ? (
              <iframe
                className="details__video"
                src={course.trailer}
                title={`${course.title} preview`}
                allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            ) : (
              <>
                <CourseArtwork course={course} />
                {course.trailer && (
                  <button type="button" className="details__play" onClick={() => setShowTrailer(true)}>
                    ▶ Watch course preview
                  </button>
                )}
              </>
            )}
          </div>

          <section className="card">
            <div className="card__body stack">
              <h2>About this course</h2>
              <p>{course.description}</p>
              <dl className="facts">
                <div>
                  <dt>Instructor</dt>
                  <dd>{course.instructor}</dd>
                </div>
                <div>
                  <dt>Format</dt>
                  <dd>{course.duration}</dd>
                </div>
                <div>
                  <dt>Area</dt>
                  <dd>{course.category}</dd>
                </div>
              </dl>
            </div>
          </section>
        </div>

        <aside className="stack">
          <section className="card">
            <div className="card__body stack">
              <div className="row row--between">
                <p className="eyebrow">{course.code}</p>
                <StatusBadge courseId={course.id} />
              </div>
              <h1 className="details__title">{course.title}</h1>
              <div className="row">
                <span className="badge badge--cardinal">
                  {course.registrationOnly ? 'Registration only · 0 credits' : `${course.credits} credits`}
                </span>
                <span className="price price--lg">{course.price === 0 ? 'Free' : formatMoney(course.price)}</span>
              </div>

              <div className="stack">
                {where === null && (
                  <button type="button" className="btn btn--primary btn--block" onClick={() => actions.addToCart(course.id)}>
                    Add to cart
                  </button>
                )}
                {where === 'cart' && (
                  <button type="button" className="btn btn--ghost btn--block" onClick={() => actions.removeFromCart(course.id)}>
                    Remove from cart
                  </button>
                )}
                {(where === null || where === 'cart' || where === 'planned') && (
                  <label className="field">
                    <span className="field__label">Plan it for a semester</span>
                    <select
                      className="select"
                      value=""
                      onChange={(event) => event.target.value && actions.assign(course.id, event.target.value)}
                    >
                      <option value="" disabled>
                        Choose a semester…
                      </option>
                      {unpaidSemesters.map((semesterId) => (
                        <option key={semesterId} value={semesterId}>
                          {semesterLabel(semesterId)}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {where === 'completed' ? (
                  <button type="button" className="btn btn--ghost btn--block" onClick={() => actions.uncomplete(course.id)}>
                    Not completed after all
                  </button>
                ) : (
                  where !== 'paid' && (
                    <button type="button" className="btn btn--ghost btn--block" onClick={() => actions.complete(course.id)}>
                      I already took this
                    </button>
                  )
                )}
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card__body stack">
              <h2 className="h3">Before this course</h2>
              <p className="small muted">Prerequisites (earlier semester)</p>
              <CourseLinks ids={prereqsOf(course.id)} />
              <p className="small muted">Corequisites (same semester is fine)</p>
              <CourseLinks ids={coreqsOf(course.id)} />
              <p className="small muted">
                Advisory only. Confirm with the ISU catalog or your advisor.
              </p>
            </div>
          </section>

          <section className="card">
            <div className="card__body stack">
              <h2 className="h3">What it unlocks</h2>
              <CourseLinks ids={unlocksOf(course.id)} />
            </div>
          </section>
        </aside>
      </div>
    </main>
  )
}

export default CourseDetails
