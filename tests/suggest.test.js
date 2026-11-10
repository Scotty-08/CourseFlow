import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { MAX_CREDITS } from '../src/config.js'
import { normalizeCourses } from '../src/data/normalize.js'
import { analyzePlan } from '../src/utils/prereq.js'
import { remainingCourseIds, suggestPlan } from '../src/utils/suggest.js'
import { compareSemesters } from '../src/utils/semester.js'

const courses = normalizeCourses(
  JSON.parse(readFileSync(new URL('../src/data/courses.json', import.meta.url))),
)
const credits = (ids) =>
  ids.reduce((sum, id) => sum + courses.find((course) => course.id === id).credits, 0)

describe('remainingCourseIds', () => {
  it('needs one course per pick-one group', () => {
    const remaining = remainingCourseIds(courses, [])
    assert.equal(remaining.length, courses.length - 2)
    assert.ok(remaining.includes('chem-1670'))
    assert.ok(!remaining.includes('chem-1770'))
  })

  it('treats an already-taken option as satisfying its group', () => {
    const remaining = remainingCourseIds(courses, ['chem-1770', 'engl-3090'])
    for (const id of ['chem-1670', 'chem-1770', 'engl-3140', 'engl-3090']) {
      assert.ok(!remaining.includes(id), id)
    }
  })

  it('honours the option the student already leans toward', () => {
    const remaining = remainingCourseIds(courses, [], ['chem-1770'])
    assert.ok(remaining.includes('chem-1770'))
    assert.ok(!remaining.includes('chem-1670'))
  })
})

describe('suggestPlan from scratch', () => {
  const result = suggestPlan({ courses, startSemester: '2027-spring' })

  it('places every required course', () => {
    assert.deepEqual(result.unplaced, [])
    const placed = Object.values(result.plan).flat()
    assert.equal(new Set(placed).size, placed.length, 'no course is scheduled twice')
    assert.equal(placed.length, courses.length - 2)
  })

  it('produces a plan with no prerequisite or corequisite warnings', () => {
    assert.deepEqual(analyzePlan(result.plan).issues, [])
  })

  it('keeps every semester at or under the max', () => {
    for (const semester of result.semesters) {
      assert.ok(credits(result.plan[semester]) <= MAX_CREDITS, semester)
    }
  })

  it('only uses spring and fall by default, in order', () => {
    for (const semester of result.semesters) assert.ok(!semester.endsWith('summer'))
    const sorted = [...result.semesters].sort(compareSemesters)
    assert.deepEqual(result.semesters, sorted)
  })

  it('starts with the orientation courses and ends with the portfolio assessment', () => {
    assert.ok(result.plan[result.semesters[0]].includes('cpre-1660'))
    assert.ok(result.plan[result.semesters[0]].includes('engr-1010'))
    assert.ok(result.plan[result.semesters.at(-1)].includes('cpre-4940'))
  })
})

describe('suggestPlan with progress', () => {
  it('skips courses that are already satisfied', () => {
    const satisfied = ['engl-1500', 'math-1650', 'cpre-1850']
    const result = suggestPlan({ courses, satisfied, startSemester: '2027-fall' })
    const placed = Object.values(result.plan).flat()
    for (const id of satisfied) assert.ok(!placed.includes(id))
    assert.deepEqual(analyzePlan(result.plan, satisfied).issues, [])
  })

  it('returns an empty plan when everything is done', () => {
    const satisfied = courses.map((course) => course.id)
    const result = suggestPlan({ courses, satisfied, startSemester: '2027-fall' })
    assert.deepEqual(result.plan, {})
    assert.deepEqual(result.semesters, [])
  })

  it('can include summers', () => {
    const result = suggestPlan({ courses, startSemester: '2027-spring', includeSummer: true })
    assert.ok(result.semesters.includes('2027-summer'))
    assert.deepEqual(analyzePlan(result.plan).issues, [])
  })

  it('reports courses it could not place instead of looping forever', () => {
    const result = suggestPlan({ courses, startSemester: '2027-spring', maxSemesters: 2 })
    assert.ok(result.unplaced.length > 0)
    assert.equal(result.semesters.length, 2)
  })
})
