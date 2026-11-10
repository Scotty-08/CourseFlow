import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  compareSemesters,
  makeSemesterId,
  nextSemester,
  parseSemesterId,
  semesterLabel,
  semesterRange,
  sortSemesters,
  upcomingSemester,
} from '../src/utils/semester.js'

describe('semester ids', () => {
  it('round-trips through make and parse', () => {
    assert.deepEqual(parseSemesterId(makeSemesterId('fall', 2027)), { year: 2027, term: 'fall' })
  })

  it('rejects malformed ids', () => {
    assert.equal(parseSemesterId('2027-winter'), null)
    assert.equal(parseSemesterId('fall 2027'), null)
    assert.throws(() => makeSemesterId('winter', 2027))
  })

  it('labels semesters for people', () => {
    assert.equal(semesterLabel('2027-spring'), 'Spring 2027')
  })
})

describe('semester ordering', () => {
  it('sorts by year, then spring < summer < fall', () => {
    const sorted = sortSemesters(['2028-spring', '2027-fall', '2027-spring', '2027-summer'])
    assert.deepEqual(sorted, ['2027-spring', '2027-summer', '2027-fall', '2028-spring'])
  })

  it('compares in both directions', () => {
    assert.ok(compareSemesters('2027-spring', '2027-fall') < 0)
    assert.ok(compareSemesters('2028-spring', '2027-fall') > 0)
    assert.equal(compareSemesters('2027-fall', '2027-fall'), 0)
  })
})

describe('moving between semesters', () => {
  it('walks spring -> summer -> fall -> next spring', () => {
    assert.equal(nextSemester('2027-spring'), '2027-summer')
    assert.equal(nextSemester('2027-summer'), '2027-fall')
    assert.equal(nextSemester('2027-fall'), '2028-spring')
  })

  it('can skip summers', () => {
    assert.equal(nextSemester('2027-spring', { includeSummer: false }), '2027-fall')
    assert.equal(nextSemester('2027-fall', { includeSummer: false }), '2028-spring')
  })

  it('builds a range', () => {
    assert.deepEqual(semesterRange('2027-spring', 4, { includeSummer: false }), [
      '2027-spring',
      '2027-fall',
      '2028-spring',
      '2028-fall',
    ])
  })
})

describe('upcomingSemester', () => {
  it('points at spring once fall has started', () => {
    assert.equal(upcomingSemester(new Date(2026, 10, 10)), '2027-spring')
  })

  it('points at fall during the spring and summer', () => {
    assert.equal(upcomingSemester(new Date(2027, 1, 1)), '2027-fall')
    assert.equal(upcomingSemester(new Date(2027, 6, 1)), '2027-fall')
  })
})
