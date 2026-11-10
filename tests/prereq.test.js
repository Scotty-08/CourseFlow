import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { analyzePlan, dependentsOutOfOrder, warningsIfAdded } from '../src/utils/prereq.js'

describe('analyzePlan', () => {
  it('accepts a correctly ordered plan', () => {
    const plan = {
      '2027-spring': ['math-1650', 'cpre-1850'],
      '2027-fall': ['math-1660', 'coms-2270'],
    }
    assert.deepEqual(analyzePlan(plan).issues, [])
  })

  it('flags a prerequisite that is scheduled later', () => {
    const plan = { '2027-spring': ['math-1660'], '2027-fall': ['math-1650'] }
    const { issues } = analyzePlan(plan)
    assert.equal(issues.length, 1)
    assert.deepEqual(issues[0], {
      courseId: 'math-1660',
      semesterId: '2027-spring',
      kind: 'prereq',
      missing: ['math-1650'],
    })
  })

  it('flags a prerequisite taken in the same semester', () => {
    const plan = { '2027-spring': ['math-1650', 'math-1660'] }
    const { byCourse } = analyzePlan(plan)
    assert.equal(byCourse['math-1660'][0].kind, 'prereq')
  })

  it('allows a corequisite in the same semester but not later', () => {
    const together = analyzePlan({ '2027-spring': ['phys-2310', 'phys-2310l', 'math-1650'] })
    assert.deepEqual(together.issues, [])

    const later = analyzePlan({
      '2027-spring': ['phys-2310l', 'math-1650'],
      '2027-fall': ['phys-2310'],
    })
    const coreq = later.issues.find((i) => i.courseId === 'phys-2310l')
    assert.equal(coreq.kind, 'coreq')
    assert.deepEqual(coreq.missing, ['phys-2310'])
  })

  it('counts completed courses as satisfied', () => {
    const plan = { '2027-spring': ['math-1660'] }
    assert.equal(analyzePlan(plan).issues.length, 1)
    assert.equal(analyzePlan(plan, ['math-1650']).issues.length, 0)
  })

  it('sorts semesters chronologically no matter the key order', () => {
    const plan = { '2027-fall': ['math-1660'], '2027-spring': ['math-1650'] }
    assert.deepEqual(analyzePlan(plan).issues, [])
  })

  it('groups issues by semester and course', () => {
    const plan = { '2027-spring': ['coms-2280'] }
    const { bySemester, byCourse } = analyzePlan(plan)
    assert.equal(bySemester['2027-spring'].length, 1)
    assert.equal(byCourse['coms-2280'][0].missing[0], 'coms-2270')
  })
})

describe('warningsIfAdded', () => {
  it('previews warnings without touching the plan', () => {
    const plan = { '2027-spring': ['math-1650'] }
    const warnings = warningsIfAdded('math-1660', '2027-spring', plan)
    assert.equal(warnings.length, 1)
    assert.deepEqual(plan, { '2027-spring': ['math-1650'] })
  })
})

describe('dependentsOutOfOrder', () => {
  it('finds courses that now sit before their prerequisite', () => {
    const plan = { '2027-spring': ['math-1660'], '2027-fall': ['math-1650'] }
    assert.deepEqual(dependentsOutOfOrder('math-1650', plan), ['math-1660'])
  })

  it('returns nothing for a course that is not planned', () => {
    assert.deepEqual(dependentsOutOfOrder('math-1650', {}), [])
  })
})
