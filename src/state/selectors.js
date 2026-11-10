// Derived data for the UI. Pure functions over (state, catalog) so they are testable.

import { buildRequirementSlots } from '../data/requirements.js'
import { analyzePlan } from '../utils/prereq.js'
import { priceSemester } from '../utils/pricing.js'
import { semesterLabel, sortSemesters } from '../utils/semester.js'
import { satisfiedCourseIds } from './plannerReducer.js'

/** One entry per planned semester, in date order, with its price and warnings. */
export function deriveSemesters(state, getCourse) {
  const { bySemester } = analyzePlan(state.plan, state.completed)
  return sortSemesters(state.semesters).map((id) => {
    const courseIds = state.plan[id] ?? []
    const courses = courseIds.map(getCourse).filter(Boolean)
    return {
      id,
      label: semesterLabel(id),
      courseIds,
      courses,
      pricing: priceSemester(courses),
      receipt: state.paid[id] ?? null,
      issues: bySemester[id] ?? [],
    }
  })
}

/**
 * Degree progress across the requirement slots.
 * done = completed or paid, planned = in an unpaid semester, remaining = neither.
 */
export function deriveProgress(state, courses) {
  const byId = new Map(courses.map((course) => [course.id, course]))
  const slots = buildRequirementSlots(courses.map((course) => course.id))
  const done = new Set(satisfiedCourseIds(state))
  const planned = new Set(
    Object.entries(state.plan)
      .filter(([semesterId]) => !state.paid[semesterId])
      .flatMap(([, ids]) => ids),
  )

  const result = {
    slotsTotal: slots.length,
    slotsDone: 0,
    slotsPlanned: 0,
    creditsTotal: 0,
    creditsDone: 0,
    creditsPlanned: 0,
  }

  for (const slot of slots) {
    const doneOption = slot.options.find((id) => done.has(id))
    const plannedOption = slot.options.find((id) => planned.has(id))
    const representative = byId.get(doneOption ?? plannedOption ?? slot.options[0])
    const credits = representative?.credits ?? 0
    result.creditsTotal += credits
    if (doneOption) {
      result.slotsDone += 1
      result.creditsDone += credits
    } else if (plannedOption) {
      result.slotsPlanned += 1
      result.creditsPlanned += credits
    }
  }
  return result
}

/** Count of every course the student has chosen but not finished (cart + unpaid semesters). */
export function countSelected(state) {
  const planned = Object.entries(state.plan)
    .filter(([semesterId]) => !state.paid[semesterId])
    .reduce((sum, [, ids]) => sum + ids.length, 0)
  return state.cart.length + planned
}
