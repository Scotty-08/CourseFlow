import { semesterLabel, sortSemesters } from './semester.js'

/**
 * A plain-text copy of the plan, handy for pasting into an email to an advisor.
 * `getCourse` maps an id to a normalized course.
 */
export function planToText(state, getCourse) {
  const lines = ['CourseFlow plan', '']
  const ids = sortSemesters(Object.keys(state.plan)).filter((id) => state.plan[id].length > 0)
  if (ids.length === 0) lines.push('(no courses planned yet)')

  for (const semesterId of ids) {
    const courses = state.plan[semesterId].map(getCourse).filter(Boolean)
    const credits = courses.reduce((sum, course) => sum + course.credits, 0)
    const paid = state.paid[semesterId] ? ' [paid]' : ''
    lines.push(`${semesterLabel(semesterId)} - ${credits} credits${paid}`)
    for (const course of courses) lines.push(`  ${course.code}  ${course.title}`)
    lines.push('')
  }

  if (state.completed.length > 0) {
    lines.push('Already completed')
    for (const course of state.completed.map(getCourse).filter(Boolean)) {
      lines.push(`  ${course.code}  ${course.title}`)
    }
    lines.push('')
  }
  return lines.join('\n').trimEnd() + '\n'
}
