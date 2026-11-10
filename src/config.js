// Central place for the numbers CourseFlow's rules depend on.
// Change them here and the pricing, planner and tests all follow.

export const APP_NAME = 'CourseFlow'

/** Tuition charged per credit hour (matches the prices in courses.json). */
export const PRICE_PER_CREDIT = 399

/** A semester above this many credits is treated as "over 12" for the cap. */
export const CAP_CREDIT_THRESHOLD = 12

/** The most a single semester can cost once it is over the threshold. */
export const TUITION_CAP = 8000

/**
 * How the cap is applied once a semester goes over CAP_CREDIT_THRESHOLD.
 *
 *  - 'ceiling': you pay the per-credit total, but never more than TUITION_CAP.
 *  - 'flat':    you pay exactly TUITION_CAP for every semester over the threshold.
 *
 * "Caps the price at $8,000" reads as a ceiling, so that is the default.
 */
export const CAP_MODE = 'ceiling'

/** The suggested-plan generator aims for this many credits per semester... */
export const TARGET_CREDITS = 15

/** ...and never goes past this many. */
export const MAX_CREDITS = 17

/** Schedulable terms, in calendar order within a year. */
export const TERMS = [
  { id: 'spring', label: 'Spring', order: 1 },
  { id: 'summer', label: 'Summer', order: 2 },
  { id: 'fall', label: 'Fall', order: 3 },
]

/** localStorage key. Bump the suffix if the saved shape ever changes. */
export const STORAGE_KEY = 'courseflow:v1'
