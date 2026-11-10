import { useState } from 'react'
import { courses } from '../data/catalog.js'
import { MAX_CREDITS, TARGET_CREDITS } from '../config.js'
import { useToast } from '../hooks/useToast.js'
import { usePlanner } from '../state/PlannerContext.jsx'
import { semesterLabel, sortSemesters, upcomingSemester } from '../utils/semester.js'
import { suggestPlan } from '../utils/suggest.js'

/** Builds a prerequisite-safe plan for everything that is left, then lets the student apply it. */
function SuggestPlanPanel() {
  const { state, dispatch, satisfied } = usePlanner()
  const { notify } = useToast()
  const [includeSummer, setIncludeSummer] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const hasUnpaidCourses = Object.entries(state.plan).some(
    ([semesterId, ids]) => !state.paid[semesterId] && ids.length > 0,
  )

  function build() {
    const unpaid = sortSemesters(state.semesters).filter((id) => !state.paid[id])
    const startSemester = unpaid.find((id) => includeSummer || !id.endsWith('summer')) ?? upcomingSemester()
    const preferred = [...state.cart, ...Object.values(state.plan).flat()]
    const result = suggestPlan({ courses, satisfied, preferred, startSemester, includeSummer })

    if (result.semesters.length === 0) {
      notify('Nothing left to plan. Every requirement is done or paid.')
      return
    }
    dispatch({ type: 'plan/applySuggestion', plan: result.plan })
    setConfirming(false)
    const last = semesterLabel(result.semesters.at(-1))
    notify(`Planned ${result.semesters.length} semesters, finishing ${last}`)
  }

  return (
    <section className="card" aria-labelledby="suggest-title">
      <div className="card__body stack">
        <h2 id="suggest-title" className="h3">
          Suggest a full plan
        </h2>
        <p className="small muted">
          Fills your unpaid semesters with every remaining required course, in prerequisite order, aiming
          for about {TARGET_CREDITS} credits (never more than {MAX_CREDITS}).
        </p>
        <label className="check">
          <input type="checkbox" checked={includeSummer} onChange={(event) => setIncludeSummer(event.target.checked)} />
          <span>Use summer semesters too</span>
        </label>
        {hasUnpaidCourses && !confirming ? (
          <button type="button" className="btn btn--gold btn--block" onClick={() => setConfirming(true)}>
            Suggest a plan
          </button>
        ) : confirming ? (
          <div className="stack">
            <p className="notice notice--warn">
              This replaces what is in your unpaid semesters. Paid semesters are never touched.
            </p>
            <div className="row">
              <button type="button" className="btn btn--primary btn--sm" onClick={build}>
                Replace my plan
              </button>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setConfirming(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="btn btn--gold btn--block" onClick={build}>
            Suggest a plan
          </button>
        )}
      </div>
    </section>
  )
}

export default SuggestPlanPanel
