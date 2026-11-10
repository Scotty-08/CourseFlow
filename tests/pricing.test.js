import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { creditsUntilCapBinds, formatMoney, priceSemester } from '../src/utils/pricing.js'

const course = (credits, price = credits * 399) => ({ credits, price })

describe('priceSemester', () => {
  it('charges per credit at or below 12 credits', () => {
    const result = priceSemester([course(4), course(4), course(4)])
    assert.equal(result.credits, 12)
    assert.equal(result.total, 4788)
    assert.equal(result.overThreshold, false)
    assert.equal(result.capApplied, false)
  })

  it('does not cap a 13 credit semester that costs less than the cap', () => {
    const result = priceSemester([course(4), course(4), course(4), course(1)])
    assert.equal(result.credits, 13)
    assert.equal(result.overThreshold, true)
    assert.equal(result.total, 5187)
    assert.equal(result.capApplied, false)
  })

  it('caps at $8,000 once the subtotal exceeds it', () => {
    // 22 credits * $399 = $8,778
    const courses = Array.from({ length: 11 }, () => course(2))
    const result = priceSemester(courses)
    assert.equal(result.credits, 22)
    assert.equal(result.subtotal, 8778)
    assert.equal(result.total, 8000)
    assert.equal(result.capApplied, true)
    assert.equal(result.savings, 778)
  })

  it('never caps a semester that is not over 12 credits, whatever it costs', () => {
    const result = priceSemester([course(12, 9000)])
    assert.equal(result.total, 9000)
    assert.equal(result.capApplied, false)
  })

  it('flat mode charges the cap for any semester over 12 credits', () => {
    const result = priceSemester([course(13)], { mode: 'flat' })
    assert.equal(result.total, 8000)
    assert.equal(result.capApplied, true)
    assert.ok(result.savings < 0)
  })

  it('treats registration-only (0 credit, $0) courses as free', () => {
    const result = priceSemester([course(0, 0), course(3)])
    assert.equal(result.credits, 3)
    assert.equal(result.total, 1197)
  })

  it('handles an empty semester', () => {
    const result = priceSemester([])
    assert.equal(result.credits, 0)
    assert.equal(result.total, 0)
  })
})

describe('creditsUntilCapBinds', () => {
  it('is 21 credits at $399 per credit with a ceiling', () => {
    assert.equal(creditsUntilCapBinds(), 21)
  })

  it('is 13 credits for a flat rate', () => {
    assert.equal(creditsUntilCapBinds({ mode: 'flat' }), 13)
  })
})

describe('formatMoney', () => {
  it('formats whole dollars without cents', () => {
    assert.equal(formatMoney(8000), '$8,000')
  })

  it('keeps cents when present', () => {
    assert.equal(formatMoney(12.5), '$12.50')
  })

  it('treats junk as zero', () => {
    assert.equal(formatMoney(undefined), '$0')
  })
})
