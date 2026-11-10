import { suggestPlan } from './suggest.js'
import { sortSemesters, upcomingSemester } from './semester.js'

/**
 * Run the plan generator for the current planner state.
 * Starts at the first unpaid semester (skipping summer unless asked), pays attention to
 * what the student already finished or paid for, and leans toward courses already chosen.
 */
export function buildSuggestion({ courses, state, satisfied, includeSummer = false, now = new Date() }) {
  const unpaid = sortSemesters(state.semesters).filter((id) => !state.paid[id])
  const startSemester = unpaid.find((id) => includeSummer || !id.endsWith('summer')) ?? upcomingSemester(now)
  const preferred = [...state.cart, ...Object.values(state.plan).flat()]
  const result = suggestPlan({ courses, satisfied, preferred, startSemester, includeSummer })
  return { startSemester, result }
}
