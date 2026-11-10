// Pure planner state: no React, no browser APIs, so it can be unit tested in Node.
//
// Shape:
//   cart       course ids saved for later, not yet in a semester
//   completed  course ids the student has already finished
//   semesters  semester ids the student is planning (sorted)
//   plan       semesterId -> course ids
//   paid       semesterId -> receipt (a paid semester is locked)
//   student    { name, email } remembered for checkout

import { parseSemesterId, semesterRange, sortSemesters, upcomingSemester } from '../utils/semester.js'

export const STATE_VERSION = 1

export function createInitialState(now = new Date()) {
  return {
    version: STATE_VERSION,
    cart: [],
    completed: [],
    semesters: semesterRange(upcomingSemester(now), 4, { includeSummer: false }),
    plan: {},
    paid: {},
    student: { name: '', email: '' },
  }
}

const unique = (ids) => [...new Set(ids)]
const without = (ids, id) => ids.filter((other) => other !== id)

/** Where a course currently lives: 'completed' | 'paid' | 'planned' | 'cart' | null. */
export function locateCourse(state, courseId) {
  if (state.completed.includes(courseId)) return 'completed'
  for (const [semesterId, ids] of Object.entries(state.plan)) {
    if (ids.includes(courseId)) return state.paid[semesterId] ? 'paid' : 'planned'
  }
  if (state.cart.includes(courseId)) return 'cart'
  return null
}

/** Which semester holds this course, if any. */
export function semesterOfCourse(state, courseId) {
  return Object.keys(state.plan).find((id) => state.plan[id].includes(courseId)) ?? null
}

/** Everything that counts as already taken: completed plus paid semesters. */
export function satisfiedCourseIds(state) {
  const paidCourses = Object.keys(state.paid).flatMap((id) => state.plan[id] ?? [])
  return unique([...state.completed, ...paidCourses])
}

/** Remove a course from the cart and from every unpaid semester. */
function detach(state, courseId) {
  const plan = {}
  for (const [semesterId, ids] of Object.entries(state.plan)) {
    plan[semesterId] = state.paid[semesterId] ? ids : without(ids, courseId)
  }
  return { ...state, cart: without(state.cart, courseId), plan }
}

function withSemester(state, semesterId) {
  if (state.semesters.includes(semesterId)) return state
  return { ...state, semesters: sortSemesters([...state.semesters, semesterId]) }
}

export function plannerReducer(state, action) {
  switch (action.type) {
    case 'cart/add': {
      if (locateCourse(state, action.courseId)) return state
      return { ...state, cart: [...state.cart, action.courseId] }
    }

    case 'cart/remove':
      return { ...state, cart: without(state.cart, action.courseId) }

    case 'cart/clear':
      return { ...state, cart: [] }

    case 'plan/assign': {
      const { courseId, semesterId } = action
      if (!parseSemesterId(semesterId)) return state
      if (state.paid[semesterId]) return state
      const where = locateCourse(state, courseId)
      if (where === 'completed' || where === 'paid') return state
      const next = withSemester(detach(state, courseId), semesterId)
      return {
        ...next,
        plan: { ...next.plan, [semesterId]: [...(next.plan[semesterId] ?? []), courseId] },
      }
    }

    case 'plan/unassign': {
      if (locateCourse(state, action.courseId) !== 'planned') return state
      const next = detach(state, action.courseId)
      return { ...next, cart: [...next.cart, action.courseId] }
    }

    case 'semester/add': {
      if (!parseSemesterId(action.semesterId)) return state
      return withSemester(state, action.semesterId)
    }

    case 'semester/remove': {
      const { semesterId } = action
      if (state.paid[semesterId]) return state
      const returning = state.plan[semesterId] ?? []
      const plan = Object.fromEntries(Object.entries(state.plan).filter(([id]) => id !== semesterId))
      return {
        ...state,
        semesters: without(state.semesters, semesterId),
        plan,
        cart: unique([...state.cart, ...returning]),
      }
    }

    case 'course/complete': {
      const where = locateCourse(state, action.courseId)
      if (where === 'completed' || where === 'paid') return state
      const next = detach(state, action.courseId)
      return { ...next, completed: [...next.completed, action.courseId] }
    }

    case 'course/uncomplete':
      return { ...state, completed: without(state.completed, action.courseId) }

    case 'plan/applySuggestion': {
      // Replace every unpaid semester with the suggested plan.
      const taken = new Set(satisfiedCourseIds(state))
      const plan = {}
      const displaced = []
      for (const [semesterId, ids] of Object.entries(state.plan)) {
        if (state.paid[semesterId]) plan[semesterId] = ids
        else displaced.push(...ids)
      }
      let next = { ...state, plan }
      const placed = new Set()
      for (const [semesterId, ids] of Object.entries(action.plan)) {
        if (state.paid[semesterId] || !parseSemesterId(semesterId)) continue
        const fresh = ids.filter((id) => !taken.has(id) && !placed.has(id))
        if (fresh.length === 0) continue
        next = withSemester(next, semesterId)
        next.plan = { ...next.plan, [semesterId]: fresh }
        for (const id of fresh) placed.add(id)
      }
      const stillWanted = [...state.cart, ...displaced].filter(
        (id) => !placed.has(id) && !taken.has(id),
      )
      return { ...next, cart: unique(stillWanted) }
    }

    case 'pay/semester': {
      const { semesterId, receipt } = action
      if (state.paid[semesterId]) return state
      if ((state.plan[semesterId] ?? []).length === 0) return state
      return { ...state, paid: { ...state.paid, [semesterId]: receipt } }
    }

    case 'student/set':
      return {
        ...state,
        student: { name: action.name ?? '', email: action.email ?? '' },
      }

    case 'state/reset':
      return createInitialState(action.now)

    case 'state/hydrate':
      return action.state

    default:
      return state
  }
}

/**
 * Turn whatever was in localStorage into a safe state, or fall back to a fresh one.
 * Unknown course ids are dropped, duplicates are removed and paid semesters that
 * lost their courses are forgotten.
 */
export function sanitizeState(raw, validIds, now = new Date()) {
  const fresh = createInitialState(now)
  if (!raw || typeof raw !== 'object' || raw.version !== STATE_VERSION) return fresh

  const valid = new Set(validIds)
  const seen = new Set()
  const take = (ids) => {
    const out = []
    for (const id of Array.isArray(ids) ? ids : []) {
      if (typeof id === 'string' && valid.has(id) && !seen.has(id)) {
        seen.add(id)
        out.push(id)
      }
    }
    return out
  }

  const completed = take(raw.completed)

  const semesters = []
  const plan = {}
  const paid = {}
  const rawPlan = raw.plan && typeof raw.plan === 'object' ? raw.plan : {}
  const rawPaid = raw.paid && typeof raw.paid === 'object' ? raw.paid : {}

  // Paid semesters first so their courses win any duplicate.
  for (const semesterId of sortSemesters(Object.keys(rawPlan).filter(parseSemesterId))) {
    if (!rawPaid[semesterId] || typeof rawPaid[semesterId] !== 'object') continue
    const ids = take(rawPlan[semesterId])
    if (ids.length === 0) continue
    plan[semesterId] = ids
    paid[semesterId] = rawPaid[semesterId]
    semesters.push(semesterId)
  }
  for (const semesterId of sortSemesters(Object.keys(rawPlan).filter(parseSemesterId))) {
    if (paid[semesterId]) continue
    plan[semesterId] = take(rawPlan[semesterId])
    semesters.push(semesterId)
  }
  for (const semesterId of Array.isArray(raw.semesters) ? raw.semesters : []) {
    if (parseSemesterId(semesterId)) semesters.push(semesterId)
  }

  const cart = take(raw.cart)
  const student = {
    name: typeof raw.student?.name === 'string' ? raw.student.name : '',
    email: typeof raw.student?.email === 'string' ? raw.student.email : '',
  }

  return {
    version: STATE_VERSION,
    cart,
    completed,
    semesters: sortSemesters(unique(semesters)),
    plan,
    paid,
    student,
  }
}
