import { Link, Navigate, useParams } from 'react-router-dom'
import { getCourse } from '../data/catalog.js'
import { usePlanner } from '../state/PlannerContext.jsx'
import { formatMoney, priceSemester } from '../utils/pricing.js'
import { semesterLabel } from '../utils/semester.js'

function Receipt() {
  const { semesterId } = useParams()
  const { state } = usePlanner()
  const receipt = state.paid[semesterId]

  if (!receipt) return <Navigate to="/planner" replace />

  const courses = receipt.courseIds.map(getCourse).filter(Boolean)
  const pricing = priceSemester(courses)
  const paidOn = new Date(receipt.paidAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <main id="main" className="container page">
      <div className="receipt card">
        <div className="card__body stack">
          <div className="receipt__top">
            <span className="receipt__check" aria-hidden="true">
              ✓
            </span>
            <div>
              <p className="eyebrow">Payment received (demo)</p>
              <h1 className="receipt__title">{semesterLabel(semesterId)} is paid</h1>
            </div>
          </div>

          <dl className="facts facts--grid">
            <div>
              <dt>Transaction</dt>
              <dd>{receipt.transactionId}</dd>
            </div>
            <div>
              <dt>Date</dt>
              <dd>{paidOn}</dd>
            </div>
            <div>
              <dt>Student</dt>
              <dd>{receipt.studentName}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{receipt.studentEmail}</dd>
            </div>
          </dl>

          <table className="receipt__table">
            <thead>
              <tr>
                <th scope="col">Course</th>
                <th scope="col">Credits</th>
                <th scope="col" className="num">
                  Price
                </th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id}>
                  <td>
                    <strong>{course.code}</strong> {course.title}
                  </td>
                  <td>{course.registrationOnly ? 'R' : course.credits}</td>
                  <td className="num">{course.price === 0 ? 'Free' : formatMoney(course.price)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>Subtotal ({receipt.credits} credits)</td>
                <td />
                <td className="num">{formatMoney(receipt.subtotal)}</td>
              </tr>
              {receipt.capApplied && (
                <tr>
                  <td>Over-12-credit cap adjustment</td>
                  <td />
                  <td className="num">{formatMoney(receipt.total - receipt.subtotal)}</td>
                </tr>
              )}
              <tr className="receipt__total">
                <td>Total paid</td>
                <td />
                <td className="num">{formatMoney(receipt.total)}</td>
              </tr>
            </tfoot>
          </table>
          {pricing.total !== receipt.total && (
            <p className="small muted">Prices may have changed since this receipt was issued.</p>
          )}

          <p className="small muted">
            This is a demonstration receipt from a class project. No money moved and the courses are not real
            Iowa State registrations.
          </p>

          <div className="row no-print">
            <button type="button" className="btn btn--ghost" onClick={() => window.print()}>
              Print receipt
            </button>
            <Link to="/planner" className="btn btn--primary">
              Back to planner
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

export default Receipt
