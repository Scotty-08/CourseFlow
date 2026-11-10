// Demo-only checkout helpers. Nothing here talks to a payment processor, and
// card details must never be saved: only the receipt (no card data) is kept.

export function digitsOnly(text) {
  return String(text ?? '').replace(/\D/g, '')
}

/** Luhn checksum, the check every real card number passes. */
export function passesLuhn(cardNumber) {
  const digits = digitsOnly(cardNumber)
  if (digits.length < 13 || digits.length > 19) return false
  let sum = 0
  let double = false
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let value = Number(digits[i])
    if (double) {
      value *= 2
      if (value > 9) value -= 9
    }
    sum += value
    double = !double
  }
  return sum % 10 === 0
}

/** Group a card number in fours as the user types: "4242424242424242" -> "4242 4242 4242 4242". */
export function formatCardNumber(text) {
  return digitsOnly(text).slice(0, 19).replace(/(.{4})/g, '$1 ').trim()
}

/** "1228" or "12/28" -> "12/28" while typing. */
export function formatExpiry(text) {
  const digits = digitsOnly(text).slice(0, 4)
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
}

/** True when MM/YY is a real month that has not already passed. */
export function isExpiryValid(text, now = new Date()) {
  const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(text)
  if (!match) return false
  const month = Number(match[1])
  const year = 2000 + Number(match[2])
  const thisYear = now.getFullYear()
  const thisMonth = now.getMonth() + 1
  return year > thisYear || (year === thisYear && month >= thisMonth)
}

export function isEmailValid(text) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(text ?? '').trim())
}

/**
 * Validate the checkout form. Returns an object of field -> message (empty when valid).
 */
export function validateCheckout(form, now = new Date()) {
  const errors = {}
  if (!form.name?.trim()) errors.name = 'Enter the student name.'
  if (!isEmailValid(form.email)) errors.email = 'Enter a valid email address.'
  if (!form.cardholder?.trim()) errors.cardholder = 'Enter the name on the card.'
  if (!passesLuhn(form.cardNumber)) errors.cardNumber = 'That card number is not valid.'
  if (!isExpiryValid(form.expiry, now)) errors.expiry = 'Use a future date as MM/YY.'
  if (!/^\d{3,4}$/.test(form.cvv ?? '')) errors.cvv = 'Enter the 3 or 4 digit security code.'
  if (!/^\d{5}(-\d{4})?$/.test((form.zip ?? '').trim())) errors.zip = 'Enter a 5 digit ZIP code.'
  return errors
}

/** A demo transaction id like CF-482913. `random` is injectable for tests. */
export function makeTransactionId(random = Math.random) {
  return `CF-${Math.floor(100000 + random() * 900000)}`
}

/** The record kept after a successful (simulated) payment. No card data. */
export function buildReceipt({ semesterId, courses, pricing, student, now = new Date(), random }) {
  return {
    transactionId: makeTransactionId(random),
    semesterId,
    paidAt: now.toISOString(),
    studentName: student.name.trim(),
    studentEmail: student.email.trim(),
    courseIds: courses.map((course) => course.id),
    credits: pricing.credits,
    subtotal: pricing.subtotal,
    total: pricing.total,
    capApplied: pricing.capApplied,
    demo: true,
  }
}
