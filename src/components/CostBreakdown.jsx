import { creditsUntilCapBinds, formatMoney } from '../utils/pricing.js'

/** Line-by-line explanation of what a semester costs and why. */
function CostBreakdown({ pricing }) {
  const { credits, subtotal, total, overThreshold, capApplied, savings, cap, threshold, mode } = pricing

  return (
    <div className="cost">
      <div className="cost__row">
        <span>
          {credits} credit{credits === 1 ? '' : 's'} at $399
        </span>
        <span>{formatMoney(subtotal)}</span>
      </div>
      {capApplied && (
        <div className="cost__row cost__row--cap">
          <span>
            {mode === 'flat' ? `Flat rate over ${threshold} credits` : `Capped at ${formatMoney(cap)}`}
          </span>
          <span>{savings >= 0 ? `-${formatMoney(savings)}` : `+${formatMoney(-savings)}`}</span>
        </div>
      )}
      <div className="cost__row cost__total">
        <span>Semester total</span>
        <span>{formatMoney(total)}</span>
      </div>
      {overThreshold && !capApplied && (
        <p className="cost__note">
          Over {threshold} credits: this semester is capped at {formatMoney(cap)}, which starts to matter at{' '}
          {creditsUntilCapBinds()} credits.
        </p>
      )}
      {capApplied && savings > 0 && (
        <p className="cost__note">
          The {formatMoney(cap)} cap saved you {formatMoney(savings)} this semester.
        </p>
      )}
    </div>
  )
}

export default CostBreakdown
