import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  createInitialState,
  locateCourse,
  plannerReducer,
  sanitizeState,
  satisfiedCourseIds,
  semesterOfCourse,
} from '../src/state/plannerReducer.js'

const NOW = new Date(2026, 10, 10)
const fresh = () => createInitialState(NOW)
const run = (state, ...actions) => actions.reduce(plannerReducer, state)
const receipt = { transactionId: 'CF-123456', total: 1197 }

describe('initial state', () => {
  it('starts empty with four upcoming spring/fall semesters', () => {
    const state = fresh()
    assert.deepEqual(state.semesters, ['2027-spring', '2027-fall', '2028-spring', '2028-fall'])
    assert.deepEqual(state.cart, [])
  })
})

describe('cart', () => {
  it('adds a course once', () => {
    const state = run(fresh(), { type: 'cart/add', courseId: 'math-1650' }, { type: 'cart/add', courseId: 'math-1650' })
    assert.deepEqual(state.cart, ['math-1650'])
    assert.equal(locateCourse(state, 'math-1650'), 'cart')
  })

  it('removes and clears', () => {
    let state = run(fresh(), { type: 'cart/add', courseId: 'a' }, { type: 'cart/add', courseId: 'b' })
    state = run(state, { type: 'cart/remove', courseId: 'a' })
    assert.deepEqual(state.cart, ['b'])
    assert.deepEqual(run(state, { type: 'cart/clear' }).cart, [])
  })

  it('will not add a course that is already planned or completed', () => {
    let state = run(fresh(), { type: 'plan/assign', courseId: 'math-1650', semesterId: '2027-spring' })
    state = run(state, { type: 'cart/add', courseId: 'math-1650' })
    assert.deepEqual(state.cart, [])
    state = run(state, { type: 'course/complete', courseId: 'engl-1500' }, { type: 'cart/add', courseId: 'engl-1500' })
    assert.deepEqual(state.cart, [])
  })
})

describe('assigning to semesters', () => {
  it('moves a course from the cart into a semester', () => {
    const state = run(
      fresh(),
      { type: 'cart/add', courseId: 'math-1650' },
      { type: 'plan/assign', courseId: 'math-1650', semesterId: '2027-spring' },
    )
    assert.deepEqual(state.cart, [])
    assert.deepEqual(state.plan['2027-spring'], ['math-1650'])
    assert.equal(semesterOfCourse(state, 'math-1650'), '2027-spring')
  })

  it('moves a course between semesters without duplicating it', () => {
    const state = run(
      fresh(),
      { type: 'plan/assign', courseId: 'math-1650', semesterId: '2027-spring' },
      { type: 'plan/assign', courseId: 'math-1650', semesterId: '2027-fall' },
    )
    assert.deepEqual(state.plan['2027-spring'], [])
    assert.deepEqual(state.plan['2027-fall'], ['math-1650'])
  })

  it('creates a semester that does not exist yet, in order', () => {
    const state = run(fresh(), { type: 'plan/assign', courseId: 'x', semesterId: '2027-summer' })
    assert.deepEqual(state.semesters.slice(0, 3), ['2027-spring', '2027-summer', '2027-fall'])
  })

  it('ignores a malformed semester id', () => {
    const state = fresh()
    assert.equal(run(state, { type: 'plan/assign', courseId: 'x', semesterId: 'someday' }), state)
  })

  it('sends a course back to the cart on unassign', () => {
    const state = run(
      fresh(),
      { type: 'plan/assign', courseId: 'math-1650', semesterId: '2027-spring' },
      { type: 'plan/unassign', courseId: 'math-1650' },
    )
    assert.deepEqual(state.cart, ['math-1650'])
    assert.deepEqual(state.plan['2027-spring'], [])
  })
})

describe('removing semesters', () => {
  it('returns its courses to the cart', () => {
    const state = run(
      fresh(),
      { type: 'plan/assign', courseId: 'math-1650', semesterId: '2027-spring' },
      { type: 'semester/remove', semesterId: '2027-spring' },
    )
    assert.ok(!state.semesters.includes('2027-spring'))
    assert.deepEqual(state.cart, ['math-1650'])
    assert.equal(state.plan['2027-spring'], undefined)
  })
})

describe('completed courses', () => {
  it('removes the course from the cart and plan', () => {
    const state = run(
      fresh(),
      { type: 'plan/assign', courseId: 'math-1650', semesterId: '2027-spring' },
      { type: 'course/complete', courseId: 'math-1650' },
    )
    assert.deepEqual(state.plan['2027-spring'], [])
    assert.deepEqual(state.completed, ['math-1650'])
    assert.deepEqual(satisfiedCourseIds(state), ['math-1650'])
  })

  it('cannot be planned again until unmarked', () => {
    let state = run(fresh(), { type: 'course/complete', courseId: 'math-1650' })
    state = run(state, { type: 'plan/assign', courseId: 'math-1650', semesterId: '2027-spring' })
    assert.deepEqual(state.plan['2027-spring'] ?? [], [])
    state = run(state, { type: 'course/uncomplete', courseId: 'math-1650' })
    assert.deepEqual(state.completed, [])
  })
})

describe('paying a semester', () => {
  const paidState = () =>
    run(
      fresh(),
      { type: 'plan/assign', courseId: 'math-1650', semesterId: '2027-spring' },
      { type: 'pay/semester', semesterId: '2027-spring', receipt },
    )

  it('locks the semester', () => {
    const state = paidState()
    assert.equal(state.paid['2027-spring'], receipt)
    assert.equal(locateCourse(state, 'math-1650'), 'paid')
    assert.deepEqual(satisfiedCourseIds(state), ['math-1650'])
  })

  it('refuses to add, remove, move or delete in a paid semester', () => {
    const state = paidState()
    assert.equal(run(state, { type: 'plan/assign', courseId: 'engl-1500', semesterId: '2027-spring' }), state)
    assert.equal(run(state, { type: 'plan/unassign', courseId: 'math-1650' }), state)
    assert.equal(run(state, { type: 'semester/remove', semesterId: '2027-spring' }), state)
    assert.equal(run(state, { type: 'plan/assign', courseId: 'math-1650', semesterId: '2027-fall' }), state)
    assert.equal(run(state, { type: 'course/complete', courseId: 'math-1650' }), state)
  })

  it('will not pay twice or pay for an empty semester', () => {
    const state = paidState()
    assert.equal(run(state, { type: 'pay/semester', semesterId: '2027-spring', receipt: {} }), state)
    const empty = fresh()
    assert.equal(run(empty, { type: 'pay/semester', semesterId: '2027-fall', receipt }), empty)
  })
})

describe('applying a suggested plan', () => {
  it('replaces unpaid semesters and keeps paid ones', () => {
    let state = run(
      fresh(),
      { type: 'plan/assign', courseId: 'math-1650', semesterId: '2027-spring' },
      { type: 'pay/semester', semesterId: '2027-spring', receipt },
      { type: 'plan/assign', courseId: 'engl-1500', semesterId: '2027-fall' },
      { type: 'cart/add', courseId: 'chem-1670' },
    )
    state = run(state, {
      type: 'plan/applySuggestion',
      plan: {
        '2027-spring': ['cpre-1850'],
        '2027-fall': ['math-1660', 'math-1650'],
        '2028-spring': ['engl-1500'],
      },
    })
    assert.deepEqual(state.plan['2027-spring'], ['math-1650'], 'paid semester untouched')
    assert.deepEqual(state.plan['2027-fall'], ['math-1660'], 'paid course filtered out')
    assert.deepEqual(state.plan['2028-spring'], ['engl-1500'])
    assert.deepEqual(state.cart, ['chem-1670'], 'unrelated cart items stay')
  })

  it('returns displaced courses to the cart', () => {
    let state = run(fresh(), { type: 'plan/assign', courseId: 'chem-1670', semesterId: '2027-fall' })
    state = run(state, { type: 'plan/applySuggestion', plan: { '2027-spring': ['math-1650'] } })
    assert.deepEqual(state.cart, ['chem-1670'])
  })
})

describe('student details', () => {
  it('are stored for checkout', () => {
    const state = run(fresh(), { type: 'student/set', name: 'Scott', email: 'a@b.edu' })
    assert.deepEqual(state.student, { name: 'Scott', email: 'a@b.edu' })
  })
})

describe('sanitizeState', () => {
  const valid = ['math-1650', 'math-1660', 'engl-1500', 'chem-1670']

  it('falls back to a fresh state for junk', () => {
    for (const junk of [null, 'nope', 42, { version: 99 }]) {
      assert.deepEqual(sanitizeState(junk, valid, NOW), fresh())
    }
  })

  it('drops unknown ids and duplicates', () => {
    const state = sanitizeState(
      {
        version: 1,
        cart: ['math-1650', 'ghost', 'math-1650'],
        completed: ['engl-1500', 5],
        semesters: ['2027-spring', 'bad'],
        plan: { '2027-spring': ['math-1660', 'math-1650'] },
        paid: {},
        student: { name: 'S', email: 7 },
      },
      valid,
      NOW,
    )
    assert.deepEqual(state.completed, ['engl-1500'])
    assert.deepEqual(state.plan['2027-spring'], ['math-1660', 'math-1650'])
    assert.deepEqual(state.cart, [], 'a course lives in exactly one place')
    assert.ok(!state.semesters.includes('bad'))
    assert.deepEqual(state.student, { name: 'S', email: '' })
  })

  it('keeps a paid semester and forgets one whose courses vanished', () => {
    const state = sanitizeState(
      {
        version: 1,
        plan: { '2027-spring': ['math-1650'], '2027-fall': ['ghost'] },
        paid: { '2027-spring': receipt, '2027-fall': receipt },
      },
      valid,
      NOW,
    )
    assert.deepEqual(Object.keys(state.paid), ['2027-spring'])
  })

  it('round-trips a real state', () => {
    const state = run(
      fresh(),
      { type: 'plan/assign', courseId: 'math-1650', semesterId: '2027-spring' },
      { type: 'cart/add', courseId: 'engl-1500' },
      { type: 'course/complete', courseId: 'chem-1670' },
    )
    const again = sanitizeState(JSON.parse(JSON.stringify(state)), valid, NOW)
    assert.deepEqual(again, state)
  })
})
