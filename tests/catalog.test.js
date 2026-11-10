import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { categoriesOf, normalizeCourses } from '../src/data/normalize.js'
import { PREREQUISITES, coreqsOf, prereqsOf, unlocksOf } from '../src/data/prerequisites.js'
import { PICK_ONE_GROUPS, buildRequirementSlots } from '../src/data/requirements.js'
import { PRICE_PER_CREDIT } from '../src/config.js'

const raw = JSON.parse(readFileSync(new URL('../src/data/courses.json', import.meta.url)))
const courses = normalizeCourses(raw)
const ids = new Set(courses.map((c) => c.id))

describe('normalized catalog', () => {
  it('keeps every course and unique ids', () => {
    assert.equal(courses.length, raw.length)
    assert.equal(ids.size, courses.length)
  })

  it('turns credits into numbers and R into 0', () => {
    for (const course of courses) assert.equal(typeof course.credits, 'number')
    const orientation = courses.find((c) => c.id === 'engr-1010')
    assert.equal(orientation.credits, 0)
    assert.equal(orientation.registrationOnly, true)
    assert.equal(orientation.creditsLabel, 'R')
  })

  it('makes registration-only courses free, even ENGR 1010 whose source row lists a price', () => {
    for (const course of courses.filter((c) => c.registrationOnly)) {
      assert.equal(course.price, 0, course.id)
    }
  })

  it('prices every credit course at the per-credit rate', () => {
    for (const course of courses.filter((c) => !c.registrationOnly)) {
      assert.equal(course.price, course.credits * PRICE_PER_CREDIT, course.id)
    }
  })

  it('derives department, number and level from the code', () => {
    const course = courses.find((c) => c.id === 'cpre-3080')
    assert.equal(course.department, 'CPRE')
    assert.equal(course.number, '3080')
    assert.equal(course.level, 3000)
    assert.equal(courses.find((c) => c.id === 'phys-2310l').level, 2000)
  })

  it('counts categories', () => {
    const categories = categoriesOf(courses)
    assert.equal(categories.length, 5)
    assert.equal(
      categories.reduce((sum, category) => sum + category.count, 0),
      courses.length,
    )
  })
})

describe('prerequisite map', () => {
  it('only mentions courses that exist', () => {
    for (const [id, entry] of Object.entries(PREREQUISITES)) {
      assert.ok(ids.has(id), `unknown course ${id}`)
      for (const other of [...(entry.prereqs ?? []), ...(entry.coreqs ?? [])]) {
        assert.ok(ids.has(other), `${id} references unknown ${other}`)
      }
    }
  })

  it('has no cycles through hard prerequisites', () => {
    const state = new Map()
    function visit(id) {
      if (state.get(id) === 'done') return
      assert.notEqual(state.get(id), 'visiting', `cycle at ${id}`)
      state.set(id, 'visiting')
      for (const pre of prereqsOf(id)) visit(pre)
      state.set(id, 'done')
    }
    for (const id of ids) visit(id)
  })

  it('answers prereq, coreq and unlock questions', () => {
    assert.deepEqual(prereqsOf('math-1660'), ['math-1650'])
    assert.deepEqual(coreqsOf('phys-2310l'), ['phys-2310'])
    assert.deepEqual(prereqsOf('engl-1500'), [])
    assert.ok(unlocksOf('coms-2280').includes('cpre-3080'))
  })
})

describe('requirement slots', () => {
  it('collapses pick-one groups into a single slot each', () => {
    const slots = buildRequirementSlots([...ids])
    assert.equal(slots.length, ids.size - PICK_ONE_GROUPS.length)
  })
})
