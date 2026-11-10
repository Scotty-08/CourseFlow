import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { normalizeCourses } from '../src/data/normalize.js'
import { createInitialState, plannerReducer } from '../src/state/plannerReducer.js'
import { countSelected, deriveProgress, deriveSemesters } from '../src/state/selectors.js'

const courses = normalizeCourses(
  JSON.parse(readFileSync(new URL('../src/data/courses.json', import.meta.url))),
)
const byId = new Map(courses.map((course) => [course.id, course]))
const getCourse = (id) => byId.get(id)
const run = (state, ...actions) => actions.reduce(plannerReducer, state)
const start = () => createInitialState(new Date(2026, 10, 10))

describe('deriveSemesters', () => {
  it('prices each semester and labels it', () => {
    const state = run(
      start(),
      { type: 'plan/assign', courseId: 'math-1650', semesterId: '2027-spring' },
      { type: 'plan/assign', courseId: 'cpre-1850', semesterId: '2027-spring' },
    )
    const [first] = deriveSemesters(state, getCourse)
    assert.equal(first.label, 'Spring 2027')
    assert.equal(first.pricing.credits, 7)
    assert.equal(first.pricing.total, 2793)
    assert.equal(first.receipt, null)
  })

  it('attaches prerequisite warnings to the right semester', () => {
    const state = run(start(), { type: 'plan/assign', courseId: 'math-1660', semesterId: '2027-spring' })
    const semesters = deriveSemesters(state, getCourse)
    assert.equal(semesters[0].issues.length, 1)
    assert.equal(semesters[1].issues.length, 0)
  })

  it('does not warn when the prerequisite is already completed', () => {
    const state = run(
      start(),
      { type: 'course/complete', courseId: 'math-1650' },
      { type: 'plan/assign', courseId: 'math-1660', semesterId: '2027-spring' },
    )
    assert.equal(deriveSemesters(state, getCourse)[0].issues.length, 0)
  })

  it('applies the cap when a semester is stacked past the threshold', () => {
    let state = start()
    // 24 credits of upper-level courses in one semester.
    for (const id of ['cpre-2810', 'cpre-2880', 'cpre-3080', 'cpre-3250', 'cpre-3810', 'ee-2010']) {
      state = run(state, { type: 'plan/assign', courseId: id, semesterId: '2027-fall' })
    }
    const fall = deriveSemesters(state, getCourse).find((s) => s.id === '2027-fall')
    assert.equal(fall.pricing.credits, 24)
    assert.equal(fall.pricing.subtotal, 9576)
    assert.equal(fall.pricing.total, 8000)
    assert.equal(fall.pricing.capApplied, true)
  })
})

describe('deriveProgress', () => {
  it('starts at zero with 31 slots', () => {
    const progress = deriveProgress(start(), courses)
    assert.equal(progress.slotsTotal, 31)
    assert.equal(progress.slotsDone, 0)
    assert.equal(progress.creditsDone, 0)
  })

  it('counts completed, paid and planned separately', () => {
    const state = run(
      start(),
      { type: 'course/complete', courseId: 'engl-1500' },
      { type: 'plan/assign', courseId: 'math-1650', semesterId: '2027-spring' },
      { type: 'pay/semester', semesterId: '2027-spring', receipt: { transactionId: 'CF-1' } },
      { type: 'plan/assign', courseId: 'math-1660', semesterId: '2027-fall' },
    )
    const progress = deriveProgress(state, courses)
    assert.equal(progress.slotsDone, 2)
    assert.equal(progress.creditsDone, 7)
    assert.equal(progress.slotsPlanned, 1)
    assert.equal(progress.creditsPlanned, 4)
  })

  it('counts a pick-one group once, whichever option is chosen', () => {
    const state = run(start(), { type: 'course/complete', courseId: 'chem-1770' })
    const progress = deriveProgress(state, courses)
    assert.equal(progress.slotsDone, 1)
    assert.equal(progress.slotsTotal, 31)
  })
})

describe('countSelected', () => {
  it('adds the cart and unpaid semesters but not paid ones', () => {
    const state = run(
      start(),
      { type: 'cart/add', courseId: 'engl-1500' },
      { type: 'plan/assign', courseId: 'math-1650', semesterId: '2027-spring' },
      { type: 'pay/semester', semesterId: '2027-spring', receipt: {} },
      { type: 'plan/assign', courseId: 'math-1660', semesterId: '2027-fall' },
    )
    assert.equal(countSelected(state), 2)
  })
})
