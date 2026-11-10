import { coreqsOf, prereqsOf } from '../data/prerequisites.js'
import { compareSemesters, sortSemesters } from './semester.js'

/**
 * Check a semester plan against the (advisory) prerequisite map.
 *
 * @param {Record<string, string[]>} plan       semesterId -> course ids
 * @param {Iterable<string>} completed          course ids already finished
 * @returns {{ issues: Issue[], bySemester: Record<string, Issue[]>, byCourse: Record<string, Issue[]> }}
 *
 * An Issue is { courseId, semesterId, kind: 'prereq' | 'coreq', missing: string[] }.
 *   - prereq: needed in an EARLIER semester (or already completed)
 *   - coreq:  needed earlier OR in the same semester
 */
export function analyzePlan(plan, completed = []) {
  const done = new Set(completed)
  const issues = []
  const earlier = new Set(done)

  for (const semesterId of sortSemesters(Object.keys(plan))) {
    const here = plan[semesterId] ?? []
    const sameSemester = new Set(here)

    for (const courseId of here) {
      const missingPrereqs = prereqsOf(courseId).filter((id) => !earlier.has(id))
      if (missingPrereqs.length > 0) {
        issues.push({ courseId, semesterId, kind: 'prereq', missing: missingPrereqs })
      }
      const missingCoreqs = coreqsOf(courseId).filter(
        (id) => !earlier.has(id) && !sameSemester.has(id),
      )
      if (missingCoreqs.length > 0) {
        issues.push({ courseId, semesterId, kind: 'coreq', missing: missingCoreqs })
      }
    }

    for (const courseId of here) earlier.add(courseId)
  }

  const bySemester = {}
  const byCourse = {}
  for (const issue of issues) {
    ;(bySemester[issue.semesterId] ??= []).push(issue)
    ;(byCourse[issue.courseId] ??= []).push(issue)
  }
  return { issues, bySemester, byCourse }
}

/**
 * Could this course be added to `semesterId` without a warning?
 * Looks only at the semesters already in the plan plus completed courses.
 */
export function warningsIfAdded(courseId, semesterId, plan, completed = []) {
  const candidate = { ...plan, [semesterId]: [...(plan[semesterId] ?? []), courseId] }
  return analyzePlan(candidate, completed).issues.filter((issue) => issue.courseId === courseId)
}

/**
 * Later courses in the plan that depend on `courseId` but sit in the same or an
 * earlier semester than it. Used to warn when someone moves a prerequisite later.
 */
export function dependentsOutOfOrder(courseId, plan) {
  const home = Object.keys(plan).find((id) => (plan[id] ?? []).includes(courseId))
  if (!home) return []
  const result = []
  for (const [semesterId, ids] of Object.entries(plan)) {
    for (const other of ids) {
      if (other === courseId) continue
      const needsPrereq = prereqsOf(other).includes(courseId)
      const needsCoreq = coreqsOf(other).includes(courseId)
      if (needsPrereq && compareSemesters(semesterId, home) <= 0) result.push(other)
      if (needsCoreq && compareSemesters(semesterId, home) < 0) result.push(other)
    }
  }
  return result
}
