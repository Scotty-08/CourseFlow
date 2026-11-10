import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildReceipt,
  formatCardNumber,
  formatExpiry,
  isEmailValid,
  isExpiryValid,
  makeTransactionId,
  passesLuhn,
  validateCheckout,
} from '../src/utils/payment.js'

const NOW = new Date(2026, 10, 10)
const good = {
  name: 'Scott Gray',
  email: 'sgray08@iastate.edu',
  cardholder: 'Scott Gray',
  cardNumber: '4242 4242 4242 4242',
  expiry: '12/29',
  cvv: '123',
  zip: '50011',
}

describe('Luhn check', () => {
  it('accepts well-known test card numbers', () => {
    assert.ok(passesLuhn('4242424242424242'))
    assert.ok(passesLuhn('4111 1111 1111 1111'))
    assert.ok(passesLuhn('5555555555554444'))
  })

  it('rejects a changed digit, wrong length and junk', () => {
    assert.ok(!passesLuhn('4242424242424241'))
    assert.ok(!passesLuhn('4242'))
    assert.ok(!passesLuhn('abcd'))
    assert.ok(!passesLuhn(''))
  })
})

describe('input formatting', () => {
  it('groups card digits in fours', () => {
    assert.equal(formatCardNumber('4242424242424242'), '4242 4242 4242 4242')
    assert.equal(formatCardNumber('42a4 24'), '4242 4')
  })

  it('inserts the slash in the expiry', () => {
    assert.equal(formatExpiry('1'), '1')
    assert.equal(formatExpiry('122'), '12/2')
    assert.equal(formatExpiry('1229'), '12/29')
    assert.equal(formatExpiry('12/29'), '12/29')
  })
})

describe('expiry and email', () => {
  it('accepts this month and later, rejects the past and nonsense', () => {
    assert.ok(isExpiryValid('11/26', NOW))
    assert.ok(isExpiryValid('01/27', NOW))
    assert.ok(!isExpiryValid('10/26', NOW))
    assert.ok(!isExpiryValid('13/30', NOW))
    assert.ok(!isExpiryValid('1/30', NOW))
  })

  it('does a basic email check', () => {
    assert.ok(isEmailValid(' sgray08@iastate.edu '))
    assert.ok(!isEmailValid('sgray08@'))
    assert.ok(!isEmailValid('no spaces@x.com'))
  })
})

describe('validateCheckout', () => {
  it('passes a good form', () => {
    assert.deepEqual(validateCheckout(good, NOW), {})
  })

  it('reports every bad field', () => {
    const errors = validateCheckout({ name: ' ', email: 'x', cardholder: '', cardNumber: '1', expiry: '01/20', cvv: '1', zip: 'abc' }, NOW)
    assert.deepEqual(Object.keys(errors).sort(), ['cardNumber', 'cardholder', 'cvv', 'email', 'expiry', 'name', 'zip'])
  })

  it('accepts ZIP+4', () => {
    assert.deepEqual(validateCheckout({ ...good, zip: '50011-1234' }, NOW), {})
  })
})

describe('receipts', () => {
  it('makes CF- ids with six digits', () => {
    assert.match(makeTransactionId(), /^CF-\d{6}$/)
    assert.equal(makeTransactionId(() => 0), 'CF-100000')
    assert.equal(makeTransactionId(() => 0.999999), 'CF-999999')
  })

  it('records the order but never card data', () => {
    const receipt = buildReceipt({
      semesterId: '2027-spring',
      courses: [{ id: 'math-1650' }],
      pricing: { credits: 4, subtotal: 1596, total: 1596, capApplied: false },
      student: { name: ' Scott ', email: ' s@iastate.edu ' },
      now: NOW,
      random: () => 0.5,
    })
    assert.equal(receipt.studentName, 'Scott')
    assert.deepEqual(receipt.courseIds, ['math-1650'])
    assert.equal(receipt.demo, true)
    const text = JSON.stringify(receipt).toLowerCase()
    for (const word of ['card', 'cvv', 'expiry']) assert.ok(!text.includes(word), word)
  })
})
