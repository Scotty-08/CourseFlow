import {
  CAP_CREDIT_THRESHOLD,
  CAP_MODE,
  PRICE_PER_CREDIT,
  TUITION_CAP,
} from '../config.js'

const DEFAULT_RULES = {
  threshold: CAP_CREDIT_THRESHOLD,
  cap: TUITION_CAP,
  mode: CAP_MODE,
  perCredit: PRICE_PER_CREDIT,
}

/**
 * Price one semester of courses.
 *
 * Each course contributes `course.price`. If the semester is over the credit
 * threshold the cap applies:
 *   - ceiling: total = min(subtotal, cap)
 *   - flat:    total = cap
 * At or below the threshold you always pay the plain subtotal.
 *
 * Returns everything the UI needs to explain the number.
 */
export function priceSemester(courses, rules = {}) {
  const { threshold, cap, mode } = { ...DEFAULT_RULES, ...rules }

  const credits = courses.reduce((sum, course) => sum + (Number(course.credits) || 0), 0)
  const subtotal = courses.reduce((sum, course) => sum + (Number(course.price) || 0), 0)
  const overThreshold = credits > threshold

  let total = subtotal
  if (overThreshold) {
    total = mode === 'flat' ? cap : Math.min(subtotal, cap)
  }

  return {
    credits,
    subtotal,
    total,
    overThreshold,
    capApplied: overThreshold && total !== subtotal,
    // Positive when the cap saved money, negative when a flat rate costs extra.
    savings: subtotal - total,
    mode,
    threshold,
    cap,
  }
}

/** How many credits until the cap starts to matter, given the rules. */
export function creditsUntilCapBinds(rules = {}) {
  const { threshold, cap, mode, perCredit } = { ...DEFAULT_RULES, ...rules }
  if (mode === 'flat') return threshold + 1
  return Math.max(threshold + 1, Math.floor(cap / perCredit) + 1)
}

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const moneyExact = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

/** $8,000 for whole dollars, $8,000.50 when there are cents. */
export function formatMoney(amount) {
  const value = Number(amount) || 0
  return Number.isInteger(value) ? money.format(value) : moneyExact.format(value)
}
