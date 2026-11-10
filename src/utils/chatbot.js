// CourseFlow's mini assistant. It is a rule-based helper (pattern matching), not an AI model:
// it answers from the catalog and your planner state and can run a few planner actions.
// Pure functions only, so it can be tested in Node.

import { CAP_CREDIT_THRESHOLD, CAP_MODE, MAX_CREDITS, TARGET_CREDITS, TUITION_CAP } from '../config.js'
import { coreqsOf, prereqsOf, unlocksOf } from '../data/prerequisites.js'
import { locateCourse } from '../state/plannerReducer.js'
import { creditsUntilCapBinds, formatMoney } from './pricing.js'
import { makeSemesterId, semesterLabel } from './semester.js'

export const SUGGESTED_PROMPTS = [
  'What do I need before CPRE 3080?',
  'How does the $8,000 cap work?',
  'Add MATH 1650 to my cart',
  'Check my plan for problems',
  'Suggest a full plan',
]

const HELP = [
  'I can help with:',
  '• prerequisites: "what do I need for COMS 3090?"',
  '• what a course unlocks: "what does COMS 2280 unlock?"',
  '• prices and the $8,000 cap',
  '• your plan: progress, totals, prerequisite problems',
  '• actions: "add MATH 1650 to my cart", "plan CPRE 2810 in fall 2027", "I took ENGL 1500", "suggest a plan"',
].join('\n')

const normalizeCode = (text) => text.toUpperCase().replace(/\s+/g, ' ').replace(/^([A-Z]+)(\d)/, '$1 $2')

/** Course ids mentioned in the message, by code ("cpre3080", "CPRE 3080") or full title. */
export function findCourseMentions(message, courses) {
  const found = []
  const add = (course) => {
    if (course && !found.includes(course.id)) found.push(course.id)
  }
  const byCode = new Map(courses.map((course) => [course.code.toUpperCase(), course]))
  for (const match of message.matchAll(/\b([a-z]{2,4})\s?-?(\d{4}l?)\b/gi)) {
    add(byCode.get(normalizeCode(`${match[1]} ${match[2]}`)))
  }
  const lower = message.toLowerCase()
  for (const course of courses) {
    if (course.title.length >= 10 && lower.includes(course.title.toLowerCase())) add(course)
  }
  return found
}

/** "fall 2027" -> "2027-fall", or null. */
export function findSemesterMention(message) {
  const match = /\b(spring|summer|fall)\s*(?:semester\s*)?(\d{4})\b/i.exec(message)
  return match ? makeSemesterId(match[1].toLowerCase(), Number(match[2])) : null
}

const listCodes = (ids, getCourse) => ids.map((id) => getCourse(id)?.code ?? id).join(', ')

function describeIssue(issue, getCourse) {
  const course = getCourse(issue.courseId)?.code ?? issue.courseId
  const needs = listCodes(issue.missing, getCourse)
  return issue.kind === 'prereq'
    ? `• ${course} (${semesterLabel(issue.semesterId)}) needs ${needs} in an earlier semester`
    : `• ${course} (${semesterLabel(issue.semesterId)}) should be with or after ${needs}`
}

function capExplanation() {
  const lines = [
    CAP_MODE === 'flat'
      ? `Over ${CAP_CREDIT_THRESHOLD} credits a semester costs a flat ${formatMoney(TUITION_CAP)}.`
      : `Tuition is $399 a credit. Over ${CAP_CREDIT_THRESHOLD} credits, a semester is capped at ${formatMoney(TUITION_CAP)}: you pay the per-credit total but never more than that.`,
    `At $399 a credit the cap starts lowering a bill at ${creditsUntilCapBinds()} credits.`,
  ]
  return lines.join('\n')
}

/**
 * @param {string} message
 * @param {{ courses: object[], getCourse: Function, state: object, semesters: object[], progress: object }} context
 * @returns {{ text: string, action?: { type: 'dispatch', action: object } | { type: 'suggest' } }}
 */
export function reply(message, context) {
  const { courses, getCourse, state, semesters, progress } = context
  const text = String(message ?? '').trim()
  const lower = text.toLowerCase()
  if (!text) return { text: HELP }

  if (/^(hi|hello|hey|yo|sup)\b/.test(lower)) return { text: `Hey! ${HELP}` }
  if (/\b(help|what can you do|commands)\b/.test(lower)) return { text: HELP }

  const mentioned = findCourseMentions(text, courses)
  const [first] = mentioned
  const course = first ? getCourse(first) : null

  // Actions on a named course.
  if (course) {
    if (/\b(i (already )?(took|finished|completed|passed)|mark .*(done|complete))/.test(lower)) {
      const where = locateCourse(state, course.id)
      if (where === 'completed') return { text: `${course.code} is already marked completed.` }
      if (where === 'paid') return { text: `${course.code} is in a paid semester, so it already counts.` }
      return {
        text: `Marked ${course.code} as completed. It now counts toward prerequisites and progress.`,
        action: { type: 'dispatch', action: { type: 'course/complete', courseId: course.id } },
      }
    }

    if (/\b(add|put|throw)\b.*\bcart\b|\bcart\b.*\badd\b/.test(lower)) {
      const where = locateCourse(state, course.id)
      if (where === 'cart') return { text: `${course.code} is already in your cart.` }
      if (where) return { text: `${course.code} is already ${where === 'planned' ? 'in a semester' : where}.` }
      return {
        text: `Added ${course.code} (${course.title}) to your cart.`,
        action: { type: 'dispatch', action: { type: 'cart/add', courseId: course.id } },
      }
    }

    if (/\b(plan|schedule|put|move|take)\b/.test(lower) && !/\b(do i|did i)\b/.test(lower)) {
      const semesterId = findSemesterMention(text)
      if (semesterId) {
        const where = locateCourse(state, course.id)
        if (where === 'completed' || where === 'paid') {
          return { text: `${course.code} is already ${where}, so it can't be moved.` }
        }
        if (state.paid[semesterId]) return { text: `${semesterLabel(semesterId)} is paid and locked.` }
        return {
          text: `Planned ${course.code} for ${semesterLabel(semesterId)}.`,
          action: { type: 'dispatch', action: { type: 'plan/assign', courseId: course.id, semesterId } },
        }
      }
      if (/\b(plan|schedule)\b.*\b(in|for|on)\b/.test(lower) || /\b(move|put)\b/.test(lower)) {
        return { text: `Which semester? Try "plan ${course.code} in fall 2027".` }
      }
    }

    if (/\b(unlock|lead to|leads to|open up|opens up|after|next)\b/.test(lower)) {
      const next = unlocksOf(course.id)
      return {
        text: next.length
          ? `${course.code} leads to: ${listCodes(next, getCourse)}.`
          : `Nothing in this catalog depends on ${course.code}.`,
      }
    }

    if (/\b(prereq|prerequisite|need|require|before|depend|corequisite|coreq)/.test(lower)) {
      const pre = prereqsOf(course.id)
      const co = coreqsOf(course.id)
      if (pre.length === 0 && co.length === 0) return { text: `${course.code} has no prerequisites listed.` }
      const parts = []
      if (pre.length) parts.push(`Prerequisites (earlier semester): ${listCodes(pre, getCourse)}`)
      if (co.length) parts.push(`Corequisites (same semester is fine): ${listCodes(co, getCourse)}`)
      parts.push('This is advisory. Confirm with the ISU catalog or your advisor.')
      return { text: `${course.code}\n${parts.join('\n')}` }
    }

    if (/\b(cost|price|how much|tuition|pay)\b/.test(lower)) {
      return {
        text: course.registrationOnly
          ? `${course.code} is registration-only: 0 credits, free.`
          : `${course.code} is ${course.credits} credits at ${formatMoney(course.price)}.`,
      }
    }

    // Plain mention: describe it.
    const where = locateCourse(state, course.id)
    const status = where ? ` Status: ${where}.` : ''
    const credits = course.registrationOnly ? 'registration only' : `${course.credits} credits, ${formatMoney(course.price)}`
    return { text: `${course.code}: ${course.title}\n${credits}. Instructor: ${course.instructor}.${status}` }
  }

  // Questions about the rules and the plan.
  if (/\b(cap|8,?000|over 12|flat rate|ceiling|full[- ]time)\b/.test(lower)) return { text: capExplanation() }

  if (/\b(suggest|generate|auto|build|make)\b.*\b(plan|schedule)\b|\b(plan|schedule) (it )?for me\b/.test(lower)) {
    return {
      text: `Building a plan of about ${TARGET_CREDITS} credits a semester (max ${MAX_CREDITS}) for everything that's left. Paid semesters stay as they are.`,
      action: { type: 'suggest' },
    }
  }

  if (/\b(problem|issue|warning|error|conflict|check|valid|prereq)/.test(lower) && /\b(plan|schedule|semester|order|my)\b/.test(lower)) {
    const issues = semesters.flatMap((semester) => semester.issues)
    if (issues.length === 0) return { text: 'No prerequisite problems in your plan. Nice.' }
    return { text: `${issues.length} thing${issues.length === 1 ? '' : 's'} to look at:\n${issues.map((issue) => describeIssue(issue, getCourse)).join('\n')}` }
  }

  if (/\b(progress|how far|credits left|remaining|degree|done)\b/.test(lower)) {
    const remaining = progress.creditsTotal - progress.creditsDone - progress.creditsPlanned
    return {
      text: `Done: ${progress.creditsDone} credits. Planned: ${progress.creditsPlanned}. Still to plan: ${remaining}. That's ${progress.slotsDone + progress.slotsPlanned} of ${progress.slotsTotal} requirements covered.`,
    }
  }

  if (/\b(total|owe|how much|cost|price|bill|tuition)\b/.test(lower)) {
    const unpaid = semesters.filter((semester) => !semester.receipt && semester.courses.length > 0)
    if (unpaid.length === 0) return { text: 'Nothing is waiting to be paid. Add courses to a semester to see its price.' }
    const lines = unpaid.map(
      (semester) => `• ${semester.label}: ${semester.pricing.credits} credits, ${formatMoney(semester.pricing.total)}${semester.pricing.capApplied ? ' (capped)' : ''}`,
    )
    const sum = unpaid.reduce((total, semester) => total + semester.pricing.total, 0)
    return { text: `${lines.join('\n')}\nStill to pay: ${formatMoney(sum)}` }
  }

  if (/\b(cart)\b/.test(lower)) {
    return {
      text: state.cart.length
        ? `Your cart has ${state.cart.length} course${state.cart.length === 1 ? '' : 's'}: ${listCodes(state.cart, getCourse)}.`
        : 'Your cart is empty.',
    }
  }

  return { text: `I didn't catch that. ${HELP}` }
}
