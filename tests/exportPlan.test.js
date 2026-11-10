import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createInitialState, plannerReducer } from '../src/state/plannerReducer.js'
import { planToText } from '../src/utils/exportPlan.js'

const catalog = {
  'math-1650': { code: 'MATH 1650', title: 'Calculus I', credits: 4 },
  'cpre-1850': { code: 'CPRE 1850', title: 'Intro', credits: 3 },
  'engl-1500': { code: 'ENGL 1500', title: 'Critical Thinking', credits: 3 },
}
const getCourse = (id) => catalog[id]
const run = (state, ...actions) => actions.reduce(plannerReducer, state)

describe('planToText', () => {
  it('says so when nothing is planned', () => {
    assert.match(planToText(createInitialState(new Date(2026, 10, 10)), getCourse), /no courses planned yet/)
  })

  it('lists semesters in order with credits, paid marks and completed courses', () => {
    const state = run(
      createInitialState(new Date(2026, 10, 10)),
      { type: 'plan/assign', courseId: 'cpre-1850', semesterId: '2027-fall' },
      { type: 'plan/assign', courseId: 'math-1650', semesterId: '2027-spring' },
      { type: 'pay/semester', semesterId: '2027-spring', receipt: {} },
      { type: 'course/complete', courseId: 'engl-1500' },
    )
    const text = planToText(state, getCourse)
    assert.ok(text.indexOf('Spring 2027') < text.indexOf('Fall 2027'))
    assert.match(text, /Spring 2027 - 4 credits \[paid\]/)
    assert.match(text, /Fall 2027 - 3 credits\n/)
    assert.match(text, /Already completed\n {2}ENGL 1500/)
  })
})
