import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { normalizeCourses } from '../src/data/normalize.js'
import { filterCourses, levelsOf } from '../src/utils/filterCourses.js'

const courses = normalizeCourses(
  JSON.parse(readFileSync(new URL('../src/data/courses.json', import.meta.url))),
)
const codes = (list) => list.map((course) => course.code)

describe('filterCourses', () => {
  it('returns everything by default, sorted by code', () => {
    const result = filterCourses(courses)
    assert.equal(result.length, courses.length)
    assert.deepEqual(codes(result), [...codes(result)].sort((a, b) => a.localeCompare(b, 'en', { numeric: true })))
  })

  it('does not change the array it was given', () => {
    const before = codes(courses)
    filterCourses(courses, { sort: 'price-desc' })
    assert.deepEqual(codes(courses), before)
  })

  it('searches titles, codes and instructors, ignoring case and spaces', () => {
    assert.ok(codes(filterCourses(courses, { query: 'operating systems' })).includes('CPRE 3080'))
    assert.ok(codes(filterCourses(courses, { query: 'cpre3080' })).includes('CPRE 3080'))
    assert.ok(codes(filterCourses(courses, { query: 'CALCULUS' })).includes('MATH 1650'))
    assert.deepEqual(filterCourses(courses, { query: 'zzzz-not-a-course' }), [])
  })

  it('filters by category and level', () => {
    const senior = filterCourses(courses, { category: 'senior-design-and-professional-development' })
    assert.deepEqual(codes(senior).sort(), ['CPRE 1660', 'CPRE 4910', 'CPRE 4920', 'CPRE 4940'])
    const fourThousand = filterCourses(courses, { level: 4000 })
    assert.ok(fourThousand.every((course) => course.level === 4000))
    assert.ok(fourThousand.length >= 3)
  })

  it('combines filters', () => {
    const result = filterCourses(courses, { query: 'design', level: '4000' })
    assert.ok(result.every((course) => course.level === 4000))
  })

  it('sorts by credits and price', () => {
    const credits = filterCourses(courses, { sort: 'credits-desc' }).map((c) => c.credits)
    assert.deepEqual(credits, [...credits].sort((a, b) => b - a))
    const price = filterCourses(courses, { sort: 'price-asc' }).map((c) => c.price)
    assert.deepEqual(price, [...price].sort((a, b) => a - b))
  })

  it('lists the levels present', () => {
    assert.deepEqual(levelsOf(courses), [1000, 2000, 3000, 4000])
  })
})
