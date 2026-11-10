import { TERMS } from '../config.js'

const TERM_BY_ID = Object.fromEntries(TERMS.map((term) => [term.id, term]))

/** Build the id used everywhere for a semester, e.g. "2027-fall". */
export function makeSemesterId(term, year) {
  if (!TERM_BY_ID[term]) throw new Error(`Unknown term: ${term}`)
  return `${year}-${term}`
}

/** Split "2027-fall" back into { year: 2027, term: 'fall' }, or null if malformed. */
export function parseSemesterId(id) {
  const match = /^(\d{4})-(spring|summer|fall)$/.exec(String(id))
  if (!match) return null
  return { year: Number(match[1]), term: match[2] }
}

/** A number that sorts semesters chronologically. */
export function semesterOrder(id) {
  const parsed = parseSemesterId(id)
  if (!parsed) return Number.NaN
  return parsed.year * 3 + TERM_BY_ID[parsed.term].order
}

export function compareSemesters(a, b) {
  return semesterOrder(a) - semesterOrder(b)
}

export function sortSemesters(ids) {
  return [...ids].sort(compareSemesters)
}

/** "2027-fall" -> "Fall 2027" */
export function semesterLabel(id) {
  const parsed = parseSemesterId(id)
  if (!parsed) return String(id)
  return `${TERM_BY_ID[parsed.term].label} ${parsed.year}`
}

/** The semester after `id`. Pass includeSummer=false to hop straight over summers. */
export function nextSemester(id, { includeSummer = true } = {}) {
  const parsed = parseSemesterId(id)
  if (!parsed) throw new Error(`Bad semester id: ${id}`)
  const order = TERMS.filter((term) => includeSummer || term.id !== 'summer')
  const index = order.findIndex((term) => term.id === parsed.term)
  if (index === -1) {
    // Starting from a summer while summers are excluded: go to fall of the same year.
    return makeSemesterId('fall', parsed.year)
  }
  if (index === order.length - 1) return makeSemesterId(order[0].id, parsed.year + 1)
  return makeSemesterId(order[index + 1].id, parsed.year)
}

/** The first Spring or Fall semester that has not started yet. */
export function upcomingSemester(now = new Date()) {
  const year = now.getFullYear()
  const month = now.getMonth() // 0 = January
  // Jan-Aug: spring is underway or over, so the next semester to plan is fall.
  if (month <= 7) return makeSemesterId('fall', year)
  // Sep-Dec: next up is spring of next year.
  return makeSemesterId('spring', year + 1)
}

/** `count` consecutive semesters starting at `startId` (inclusive). */
export function semesterRange(startId, count, options) {
  const result = []
  let current = startId
  for (let i = 0; i < count; i += 1) {
    result.push(current)
    current = nextSemester(current, options)
  }
  return result
}
