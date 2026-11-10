import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import CostBreakdown from '../components/CostBreakdown.jsx'
import IssueList from '../components/IssueList.jsx'
import { usePlanner } from '../state/PlannerContext.jsx'
import {
  buildReceipt,
  formatCardNumber,
  formatExpiry,
  validateCheckout,
} from '../utils/payment.js'
import { formatMoney } from '../utils/pricing.js'
import { parseSemesterId } from '../utils/semester.js'

const PROCESSING_MS = 900

function Field({ label, name, form, errors, onChange, ...inputProps }) {
  const errorId = `${name}-error`
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <input
        className="input"
        name={name}
        value={form[name]}
        onChange={onChange}
        aria-invalid={errors[name] ? 'true' : 'false'}
        aria-describedby={errors[name] ? errorId : undefined}
        {...inputProps}
      />
      {errors[name] && (
        <span id={errorId} className="field__error">
          {errors[name]}
        </span>
      )}
    </label>
  )
}

function Checkout() {
  const { semesterId } = useParams()
  const { state, dispatch, semesters } = usePlanner()
  const navigate = useNavigate()
  const timer = useRef(null)
  const [processing, setProcessing] = useState(false)
  const [errors, setErrors] = useState({})
  const [form, setForm] = useState({
    name: state.student.name,
    email: state.student.email,
    cardholder: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
    zip: '',
  })

  useEffect(() => {
    const pending = timer
    return () => clearTimeout(pending.current)
  }, [])

  const semester = semesters.find((item) => item.id === semesterId)

  if (!parseSemesterId(semesterId) || !semester) return <Navigate to="/planner" replace />
  if (semester.receipt) return <Navigate to={`/receipt/${semesterId}`} replace />
  if (semester.courses.length === 0) return <Navigate to="/planner" replace />

  function handleChange(event) {
    const { name, value } = event.target
    let next = value
    if (name === 'cardNumber') next = formatCardNumber(value)
    if (name === 'expiry') next = formatExpiry(value)
    if (name === 'cvv') next = value.replace(/\D/g, '').slice(0, 4)
    setForm((current) => ({ ...current, [name]: next }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    const found = validateCheckout(form)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setProcessing(true)
    timer.current = setTimeout(() => {
      const student = { name: form.name, email: form.email }
      const receipt = buildReceipt({
        semesterId,
        courses: semester.courses,
        pricing: semester.pricing,
        student,
      })
      dispatch({ type: 'student/set', ...student })
      dispatch({ type: 'pay/semester', semesterId, receipt })
      navigate(`/receipt/${semesterId}`, { replace: true })
    }, PROCESSING_MS)
  }

  const fieldProps = { form, errors, onChange: handleChange }

  return (
    <main id="main" className="container page">
      <p className="small">
        <Link to="/planner" className="link">
          ← Back to planner
        </Link>
      </p>
      <div className="page-head">
        <p className="eyebrow">Checkout</p>
        <h1>Pay for {semester.label}</h1>
      </div>

      <div className="two-col two-col--checkout">
        <form className="card" onSubmit={handleSubmit} noValidate>
          <div className="card__body stack">
            <div className="notice notice--warn">
              <span>
                <strong>Demo checkout.</strong> No real payment is made and nothing here is sent anywhere. Try test
                card 4242 4242 4242 4242 with any future date.
              </span>
            </div>

            <h2 className="h3">Student</h2>
            <div className="form-grid">
              <Field label="Full name" name="name" autoComplete="name" {...fieldProps} />
              <Field label="Email" name="email" type="email" autoComplete="email" {...fieldProps} />
            </div>

            <h2 className="h3">Card</h2>
            <div className="form-grid">
              <Field label="Name on card" name="cardholder" autoComplete="cc-name" {...fieldProps} />
              <Field
                label="Card number"
                name="cardNumber"
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="4242 4242 4242 4242"
                {...fieldProps}
              />
              <Field label="Expires (MM/YY)" name="expiry" inputMode="numeric" autoComplete="cc-exp" placeholder="12/29" {...fieldProps} />
              <Field label="Security code" name="cvv" inputMode="numeric" autoComplete="cc-csc" {...fieldProps} />
              <Field label="Billing ZIP" name="zip" inputMode="numeric" autoComplete="postal-code" {...fieldProps} />
            </div>

            <button type="submit" className="btn btn--primary btn--block" disabled={processing}>
              {processing ? 'Processing…' : `Pay ${formatMoney(semester.pricing.total)}`}
            </button>
            <p className="small muted">Card details are checked in your browser and are never saved.</p>
          </div>
        </form>

        <aside className="card summary">
          <div className="card__body stack">
            <h2 className="h3">Order summary</h2>
            <ul className="order-list">
              {semester.courses.map((course) => (
                <li key={course.id}>
                  <span>
                    <strong>{course.code}</strong> {course.title}
                  </span>
                  <span className="nowrap">{course.price === 0 ? 'Free' : formatMoney(course.price)}</span>
                </li>
              ))}
            </ul>
            <CostBreakdown pricing={semester.pricing} />
            <IssueList issues={semester.issues} />
            {state.paid && Object.keys(state.paid).length > 0 && (
              <p className="small muted">
                You have already paid for {Object.keys(state.paid).length} other semester
                {Object.keys(state.paid).length === 1 ? '' : 's'}.
              </p>
            )}
          </div>
        </aside>
      </div>
    </main>
  )
}

export default Checkout
