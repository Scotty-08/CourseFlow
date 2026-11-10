import { usePlanner } from '../state/PlannerContext.jsx'

/** Degree progress: finished, planned and remaining credits across the CPRE list. */
function ProgressSummary() {
  const { progress } = usePlanner()
  const total = Math.max(progress.creditsTotal, 1)
  const donePct = (progress.creditsDone / total) * 100
  const plannedPct = (progress.creditsPlanned / total) * 100
  const remaining = progress.creditsTotal - progress.creditsDone - progress.creditsPlanned

  return (
    <section className="card progress" aria-labelledby="progress-title">
      <div className="card__body stack">
        <h2 id="progress-title" className="progress__title">
          Degree progress
        </h2>
        <div
          className="progress__bar"
          role="img"
          aria-label={`${progress.creditsDone} credits done, ${progress.creditsPlanned} planned, ${remaining} to plan`}
        >
          <span className="progress__done" style={{ width: `${donePct}%` }} />
          <span className="progress__planned" style={{ width: `${plannedPct}%` }} />
        </div>
        <dl className="progress__stats">
          <div>
            <dt>Done</dt>
            <dd>{progress.creditsDone} cr</dd>
          </div>
          <div>
            <dt>Planned</dt>
            <dd>{progress.creditsPlanned} cr</dd>
          </div>
          <div>
            <dt>To plan</dt>
            <dd>{remaining} cr</dd>
          </div>
        </dl>
        <p className="small muted">
          {progress.slotsDone + progress.slotsPlanned} of {progress.slotsTotal} requirements covered.
          Done means completed or paid.
        </p>
      </div>
    </section>
  )
}

export default ProgressSummary
