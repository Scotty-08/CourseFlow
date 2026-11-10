import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { normalizeCourses } from '../src/data/normalize.js'
import { createInitialState, plannerReducer } from '../src/state/plannerReducer.js'
import { deriveProgress, deriveSemesters } from '../src/state/selectors.js'
import { findCourseMentions, findSemesterMention, reply } from '../src/utils/chatbot.js'

const courses = normalizeCourses(JSON.parse(readFileSync(new URL('../src/data/courses.json', import.meta.url))))
const byId = new Map(courses.map((course) => [course.id, course]))
const getCourse = (id) => byId.get(id)
const run = (state, ...actions) => actions.reduce(plannerReducer, state)

function ask(message, state = createInitialState(new Date(2026, 10, 10))) {
  return reply(message, {
    courses,
    getCourse,
    state,
    semesters: deriveSemesters(state, getCourse),
    progress: deriveProgress(state, courses),
  })
}

describe('finding things in a message', () => {
  it('matches course codes however they are typed', () => {
    for (const text of ['CPRE 3080', 'cpre3080', 'what about cpre-3080?']) {
      assert.deepEqual(findCourseMentions(text, courses), ['cpre-3080'], text)
    }
    assert.deepEqual(findCourseMentions('phys 2310l lab', courses), ['phys-2310l'])
  })

  it('matches a full course title and ignores unknown codes', () => {
    assert.deepEqual(findCourseMentions('tell me about Software Development Practices', courses), ['coms-3090'])
    assert.deepEqual(findCourseMentions('ABCD 9999', courses), [])
  })

  it('reads semesters', () => {
    assert.equal(findSemesterMention('plan it in Fall 2027'), '2027-fall')
    assert.equal(findSemesterMention('spring2028 please'), '2028-spring')
    assert.equal(findSemesterMention('next semester'), null)
  })
})

describe('answers', () => {
  it('lists prerequisites and corequisites', () => {
    const text = ask('What do I need before CPRE 3080?').text
    assert.match(text, /COMS 2280/)
    assert.match(text, /CPRE 3810/)
    assert.match(ask('prereqs for phys 2310l').text, /Corequisites.*PHYS 2310/)
    assert.match(ask('what does engl 1500 need').text, /no prerequisites/)
  })

  it('says what a course unlocks', () => {
    assert.match(ask('what does COMS 2280 unlock?').text, /CPRE 3080/)
  })

  it('answers price questions', () => {
    assert.match(ask('how much is MATH 1650').text, /4 credits at \$1,596/)
    assert.match(ask('cost of ENGR 1010').text, /free/)
  })

  it('explains the cap', () => {
    const text = ask('how does the $8,000 cap work?').text
    assert.match(text, /\$8,000/)
    assert.match(text, /21 credits/)
  })

  it('describes a course it was only asked about', () => {
    assert.match(ask('CPRE 3080').text, /Operating Systems/)
  })

  it('reports plan problems and a clean plan', () => {
    assert.match(ask('check my plan for problems').text, /No prerequisite problems/)
    const bad = run(createInitialState(new Date(2026, 10, 10)), { type: 'plan/assign', courseId: 'math-1660', semesterId: '2027-spring' })
    assert.match(ask('check my plan for problems', bad).text, /MATH 1660.*needs MATH 1650/)
  })

  it('reports progress, totals and the cart', () => {
    const state = run(
      createInitialState(new Date(2026, 10, 10)),
      { type: 'plan/assign', courseId: 'math-1650', semesterId: '2027-spring' },
      { type: 'cart/add', courseId: 'engl-1500' },
    )
    assert.match(ask('how far along am I?', state).text, /Planned: 4/)
    assert.match(ask('how much do I owe', state).text, /Spring 2027: 4 credits, \$1,596/)
    assert.match(ask('what is in my cart', state).text, /ENGL 1500/)
    assert.match(ask('how much do I owe').text, /Nothing is waiting/)
  })

  it('has help and a fallback', () => {
    assert.match(ask('hello').text, /I can help with/)
    assert.match(ask('asdf qwer').text, /didn't catch that/)
    assert.match(ask('').text, /I can help with/)
  })
})

describe('actions', () => {
  it('adds to the cart once', () => {
    const result = ask('add MATH 1650 to my cart')
    assert.deepEqual(result.action, { type: 'dispatch', action: { type: 'cart/add', courseId: 'math-1650' } })
    const inCart = run(createInitialState(new Date(2026, 10, 10)), { type: 'cart/add', courseId: 'math-1650' })
    assert.equal(ask('add MATH 1650 to my cart', inCart).action, undefined)
    assert.match(ask('add MATH 1650 to my cart', inCart).text, /already in your cart/)
  })

  it('plans a course in a named semester', () => {
    const result = ask('plan CPRE 2810 in fall 2027')
    assert.deepEqual(result.action, {
      type: 'dispatch',
      action: { type: 'plan/assign', courseId: 'cpre-2810', semesterId: '2027-fall' },
    })
  })

  it('asks which semester when none is given', () => {
    const result = ask('plan CPRE 2810 for a semester')
    assert.equal(result.action, undefined)
    assert.match(result.text, /Which semester/)
  })

  it('refuses to touch a paid semester', () => {
    const state = run(
      createInitialState(new Date(2026, 10, 10)),
      { type: 'plan/assign', courseId: 'math-1650', semesterId: '2027-spring' },
      { type: 'pay/semester', semesterId: '2027-spring', receipt: {} },
    )
    const result = ask('plan CPRE 2810 in spring 2027', state)
    assert.equal(result.action, undefined)
    assert.match(result.text, /paid and locked/)
  })

  it('marks a course completed', () => {
    const result = ask('I took ENGL 1500')
    assert.deepEqual(result.action, { type: 'dispatch', action: { type: 'course/complete', courseId: 'engl-1500' } })
  })

  it('asks for a plan suggestion', () => {
    assert.deepEqual(ask('suggest a full plan').action, { type: 'suggest' })
    assert.deepEqual(ask('plan for me').action, { type: 'suggest' })
  })
})
