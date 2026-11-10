import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { formatPrice } from '../utils/courseFormat.js'

const billingFields = [
  ['billingStreet', 'Street address'],
  ['billingCity', 'City'],
  ['billingState', 'State'],
  ['billingZip', 'ZIP code'],
]

const shippingFields = [
  ['shippingStreet', 'Street address'],
  ['shippingCity', 'City'],
  ['shippingState', 'State'],
  ['shippingZip', 'ZIP code'],
]

const inputClass = [
  'w-full border border-[var(--color-border)]',
  'bg-[var(--color-espresso)] px-3 py-2 text-[var(--color-text)]',
  'outline-none focus:border-[var(--color-gold)]',
].join(' ')
const errorClass = 'block text-sm text-[var(--color-error)]'

function Payment() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const course = state?.course
  const enrollment = state?.enrollment
  const [paid, setPaid] = useState(false)
  const [transactionId, setTransactionId] = useState('')
  const [errors, setErrors] = useState({})
  const [payment, setPayment] = useState({
    cardholder: '',
    cardNumber: '',
    expDate: '',
    cvv: '',
    billingStreet: '',
    billingCity: '',
    billingState: '',
    billingZip: '',
    sameAsBilling: true,
    shippingStreet: '',
    shippingCity: '',
    shippingState: '',
    shippingZip: '',
  })

  if (!course || !enrollment) {
    return <Navigate to="/" replace />
  }

  function handleChange(event) {
    const { name, value, checked, type } = event.target
    setPayment((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  function handlePaymentSubmit(event) {
    event.preventDefault()
    const nextErrors = {}
    const cardDigits = payment.cardNumber.replace(/\D/g, '')

    if (!payment.cardholder.trim()) {
      nextErrors.cardholder = 'Enter the cardholder name.'
    }
    if (!/^\d{13,19}$/.test(cardDigits)) {
      nextErrors.cardNumber = 'Enter a card number with 13 to 19 digits.'
    }
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(payment.expDate)) {
      nextErrors.expDate = 'Use MM/YY format.'
    }
    if (!/^\d{3,4}$/.test(payment.cvv)) {
      nextErrors.cvv = 'Enter a 3 or 4 digit CVV.'
    }

    for (const field of ['billingStreet', 'billingCity', 'billingState', 'billingZip']) {
      if (!payment[field].trim()) nextErrors[field] = 'This field is required.'
    }
    if (!payment.sameAsBilling) {
      for (const field of ['shippingStreet', 'shippingCity', 'shippingState', 'shippingZip']) {
        if (!payment[field].trim()) nextErrors[field] = 'This field is required.'
      }
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setTransactionId(`SF-${Math.floor(100000 + Math.random() * 900000)}`)
    setPaid(true)
  }

  if (paid) {
    return (
      <main className="mx-auto min-h-screen max-w-2xl px-5 py-16">
        <section className="border border-[var(--color-gold)] bg-[var(--color-wine)] p-8 text-center">
          <h1 className="mt-4 text-3xl font-black">Enrollment confirmed</h1>
          <p className="mt-4">
            {enrollment.fullName} is enrolled in {course.title}.
          </p>
          <p className="mt-2 text-[var(--color-muted)]">
            Transaction ID: {transactionId}
          </p>
          <button
            type="button"
            onClick={() => navigate('/', { replace: true })}
            className="mt-8 bg-[var(--color-gold)] px-6 py-3 font-bold text-[#1b120d] transition hover:bg-[var(--color-gold-bright)]"
          >
            Return to Home
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-5 py-12">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--color-gold)]">
        Final step
      </p>
      <h1 className="mt-3 text-4xl font-black">Payment &amp; Confirmation</h1>
      <section className="mt-8 border-y border-[var(--color-border)] py-5">
        <h2 className="text-xl font-bold">Order Summary</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[var(--color-muted)]">Course</dt>
            <dd className="mt-1 font-semibold">
              {course.code}: {course.title}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--color-muted)]">Instructor</dt>
            <dd className="mt-1 font-semibold">{course.instructor}</dd>
          </div>
          <div>
            <dt className="text-[var(--color-muted)]">Student</dt>
            <dd className="mt-1 font-semibold">{enrollment.fullName}</dd>
          </div>
          <div>
            <dt className="text-[var(--color-muted)]">Email</dt>
            <dd className="mt-1 font-semibold">{enrollment.email}</dd>
          </div>
          <div>
            <dt className="text-[var(--color-muted)]">Price</dt>
            <dd className="mt-1 font-semibold">
              {formatPrice(course)}
            </dd>
          </div>
        </dl>
      </section>

      <form onSubmit={handlePaymentSubmit} noValidate className="mt-8 space-y-8">
        <section className="space-y-5 border-b border-[var(--color-border)] py-5">
          <h2 className="text-xl font-bold">Payment Details</h2>
          {[
            ['cardholder', 'Cardholder name', 'text'],
            ['cardNumber', 'Card number', 'text'],
            ['expDate', 'Expiration date (MM/YY)', 'text'],
            ['cvv', 'CVV', 'password'],
          ].map(([name, label, type]) => (
            <label key={name} className="block space-y-2">
              <span className="text-sm font-semibold">{label}</span>
              <input
                name={name}
                type={type}
                value={payment[name]}
                onChange={handleChange}
                autoComplete={
                  name === 'cardholder'
                    ? 'cc-name'
                    : name === 'cardNumber'
                      ? 'cc-number'
                      : name === 'expDate'
                        ? 'cc-exp'
                        : 'cc-csc'
                }
                className={inputClass}
                aria-invalid={Boolean(errors[name])}
              />
              {errors[name] && (
                <span className={errorClass}>{errors[name]}</span>
              )}
            </label>
          ))}
        </section>

        <section className="space-y-5 border-b border-[var(--color-border)] py-5">
          <h2 className="text-xl font-bold">Billing and Shipping Address</h2>
          <h3 className="font-semibold text-[var(--color-gold-bright)]">Billing Address</h3>
          {billingFields.map(([name, label]) => (
            <label key={name} className="block space-y-2">
              <span className="text-sm font-semibold">{label}</span>
              <input
                name={name}
                value={payment[name]}
                onChange={handleChange}
                className={inputClass}
                aria-invalid={Boolean(errors[name])}
              />
              {errors[name] && (
                <span className={errorClass}>{errors[name]}</span>
              )}
            </label>
          ))}
          <label className="flex items-center gap-3 text-sm font-semibold">
            <input
              type="checkbox"
              name="sameAsBilling"
              checked={payment.sameAsBilling}
              onChange={handleChange}
              className="accent-[var(--color-gold)]"
            />
            Shipping address is the same as billing
          </label>
          {!payment.sameAsBilling && (
            <>
              <h3 className="pt-3 font-semibold text-[var(--color-gold-bright)]">Shipping Address</h3>
              {shippingFields.map(([name, label]) => (
                <label key={name} className="block space-y-2">
                  <span className="text-sm font-semibold">{label}</span>
                  <input
                    name={name}
                    value={payment[name]}
                    onChange={handleChange}
                    className={inputClass}
                    aria-invalid={Boolean(errors[name])}
                  />
                  {errors[name] && (
                    <span className={errorClass}>{errors[name]}</span>
                  )}
                </label>
              ))}
            </>
          )}
        </section>

        <button
          type="submit"
          className="bg-[var(--color-gold)] px-6 py-3 font-bold text-[#1b120d] transition hover:bg-[var(--color-gold-bright)] focus:outline-none focus:ring-2 focus:ring-[var(--color-gold-bright)]"
        >
          Confirm Payment
        </button>
      </form>
    </main>
  )
}

export default Payment
