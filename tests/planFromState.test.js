import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { normalizeCourses } from '../src/data/normalize.js'
import { createInitialState, plannerReducer, satisfiedCourseIds } from '../src/state/plannerReducer.js'
import { buildSuggestion } from '../src/utils/planFromState.js'

const courses = normalizeCourses(JSON.parse(readFileSync(new URL('../src/data/courses.json', import.meta.url))))
const NOW = new Date(2026, 10, 10)
const run = (state, ...actions) => actions.reduce(plannerReducer, state)

describe('buildSuggestion', () => {
  it('starts at the first unpaid spring or fall semester', () => {
    const state = createInitialState(NOW)
    const { startSemester, result } = buildSuggestion({ courses, state, satisfied: [], now: NOW })
    assert.equal(startSemester, '2027-spring')
    assert.equal(result.semesters[0], '2027-spring')
  })

  it('starts after a paid semester and leaves paid courses out', () => {
    const state = run(
      createInitialState(NOW),
      { type: 'plan/assign', courseId: 'math-1650', semesterId: '2027-spring' },
      { type: 'pay/semester', semesterId: '2027-spring', receipt: {} },
    )
    const { startSemester, result } = buildSuggestion({ courses, state, satisfied: satisfiedCourseIds(state), now: NOW })
    assert.equal(startSemester, '2027-fall')
    assert.ok(!Object.values(result.plan).flat().includes('math-1650'))
  })
})
