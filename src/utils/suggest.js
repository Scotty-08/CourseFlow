import { MAX_CREDITS, TARGET_CREDITS } from '../config.js'
import { coreqsOf, prereqsOf } from '../data/prerequisites.js'
import { buildRequirementSlots } from '../data/requirements.js'
import { nextSemester } from './semester.js'

// Registration-only orientation courses belong in the very first semester.
const TAKE_FIRST = new Set(['engr-1010', 'cpre-1660'])
// The portfolio assessment is the last thing on the list.
const TAKE_LAST = new Set(['cpre-4940'])

/** Longest chain of courses that depend on each course; used to start long chains early. */
function computeHeights(courses) {
  const children = new Map(courses.map((course) => [course.id, []]))
  for (const course of courses) {
    for (const parent of [...prereqsOf(course.id), ...coreqsOf(course.id)]) {
      children.get(parent)?.push(course.id)
    }
  }
  const heights = new Map()
  function height(id) {
    if (heights.has(id)) return heights.get(id)
    heights.set(id, 0) // guards against a cycle in bad data
    const below = children.get(id) ?? []
    const value = below.length === 0 ? 0 : 1 + Math.max(...below.map(height))
    heights.set(id, value)
    return value
  }
  for (const course of courses) height(course.id)
  return heights
}

/**
 * Work out which courses are still needed.
 * A pick-one slot is satisfied by any of its options; otherwise the option the
 * student already leans toward (`preferred`) is chosen, falling back to the first.
 */
export function remainingCourseIds(courses, satisfied, preferred = []) {
  const ids = courses.map((course) => course.id)
  const have = new Set(satisfied)
  const lean = new Set(preferred)
  const needed = []
  for (const slot of buildRequirementSlots(ids)) {
    if (slot.options.some((id) => have.has(id))) continue
    needed.push(slot.options.find((id) => lean.has(id)) ?? slot.options[0])
  }
  return needed
}

/**
 * Build a suggested semester-by-semester plan.
 *
 * @param {object} input
 * @param {object[]} input.courses       normalized catalog
 * @param {string[]} [input.satisfied]   completed + already-paid course ids
 * @param {string[]} [input.preferred]   ids the student already chose (breaks pick-one ties)
 * @param {string}   input.startSemester e.g. "2027-spring"
 * @param {boolean}  [input.includeSummer=false]
 * @param {number}   [input.target]      aim for this many credits a semester
 * @param {number}   [input.max]         never exceed this many
 * @param {number}   [input.maxSemesters=14]
 * @returns {{ plan: Record<string,string[]>, semesters: string[], unplaced: string[] }}
 */
export function suggestPlan({
  courses,
  satisfied = [],
  preferred = [],
  startSemester,
  includeSummer = false,
  target = TARGET_CREDITS,
  max = MAX_CREDITS,
  maxSemesters = 14,
}) {
  const byId = new Map(courses.map((course) => [course.id, course]))
  const heights = computeHeights(courses)
  const remaining = new Set(remainingCourseIds(courses, satisfied, preferred))
  const finished = new Set(satisfied)

  const deferred = [...remaining].filter((id) => TAKE_LAST.has(id))
  for (const id of deferred) remaining.delete(id)

  const priority = (a, b) => {
    const firstA = TAKE_FIRST.has(a) ? 1 : 0
    const firstB = TAKE_FIRST.has(b) ? 1 : 0
    if (firstA !== firstB) return firstB - firstA
    if (heights.get(a) !== heights.get(b)) return heights.get(b) - heights.get(a)
    const levelDiff = byId.get(a).level - byId.get(b).level
    if (levelDiff !== 0) return levelDiff
    return byId.get(a).code.localeCompare(byId.get(b).code)
  }

  const plan = {}
  const semesters = []
  let semester = startSemester

  for (let count = 0; count < maxSemesters && remaining.size > 0; count += 1) {
    const chosen = []
    let credits = 0

    // The courses (plus any corequisites they drag along) that could join this semester.
    const bundleFor = (id) => {
      const bundle = []
      const stack = [id]
      while (stack.length > 0) {
        const current = stack.pop()
        if (bundle.includes(current) || chosen.includes(current)) continue
        if (!remaining.has(current)) return null
        if (prereqsOf(current).some((pre) => !finished.has(pre))) return null
        bundle.push(current)
        for (const co of coreqsOf(current)) {
          if (!finished.has(co) && !chosen.includes(co)) stack.push(co)
        }
      }
      return bundle
    }

    for (const id of [...remaining].sort(priority)) {
      if (chosen.includes(id)) continue
      const bundle = bundleFor(id)
      if (!bundle) continue
      const extra = bundle.reduce((sum, member) => sum + byId.get(member).credits, 0)
      const fits = credits + extra <= max
      const wantsMore = credits < target || extra === 0
      if (fits && wantsMore) {
        chosen.push(...bundle)
        credits += extra
      }
    }

    // Nothing is eligible and nothing changes by waiting a term: a real dead end.
    if (chosen.length === 0) break

    plan[semester] = chosen
    semesters.push(semester)
    for (const id of chosen) {
      remaining.delete(id)
      finished.add(id)
    }
    semester = nextSemester(semester, { includeSummer })
  }

  // Place the deferred finale in the last semester, or a new one if it cannot go there.
  for (const id of deferred) {
    const last = semesters[semesters.length - 1]
    const ready = prereqsOf(id).every(
      (pre) => finished.has(pre) && !(plan[last] ?? []).includes(pre),
    )
    if (last && ready) {
      plan[last].push(id)
    } else if (prereqsOf(id).every((pre) => finished.has(pre))) {
      plan[semester] = [id]
      semesters.push(semester)
      semester = nextSemester(semester, { includeSummer })
    } else {
      remaining.add(id)
    }
  }

  return { plan, semesters, unplaced: [...remaining] }
}
