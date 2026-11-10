import { CAP_CREDIT_THRESHOLD } from '../config.js'

const SCALE_MAX = 21

/**
 * A bar showing how full a semester is. The tick marks the 12 credit line where
 * the tuition cap rule begins.
 */
function CreditMeter({ credits, threshold = CAP_CREDIT_THRESHOLD, max = SCALE_MAX }) {
  const percent = Math.min(100, (credits / max) * 100)
  const markAt = (threshold / max) * 100
  const tone = credits > threshold ? 'meter__fill--full' : credits < 12 && credits > 0 ? 'meter__fill--light' : ''

  return (
    <div className="meter">
      <div
        className="meter__track"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={credits}
        aria-label={`${credits} credits`}
      >
        <div className={`meter__fill ${tone}`} style={{ width: `${percent}%` }} />
        <div className="meter__mark" style={{ left: `${markAt}%` }} title={`${threshold} credit line`} />
      </div>
      <div className="meter__labels">
        <span>{credits} credits</span>
        <span>{credits > threshold ? 'Over 12 · cap rule applies' : credits === threshold ? 'Full-time (12)' : credits > 0 ? `${threshold - credits} to full-time` : 'Empty'}</span>
      </div>
    </div>
  )
}

export default CreditMeter
