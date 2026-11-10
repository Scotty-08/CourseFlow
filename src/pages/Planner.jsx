import { Link } from 'react-router-dom'
import { getCourse } from '../data/catalog.js'
import { useToast } from '../hooks/useToast.js'
import { planToText } from '../utils/exportPlan.js'
import AddSemesterForm from '../components/AddSemesterForm.jsx'
import CompletedCourses from '../components/CompletedCourses.jsx'
import ProgressSummary from '../components/ProgressSummary.jsx'
import SemesterCard from '../components/SemesterCard.jsx'
import SuggestPlanPanel from '../components/SuggestPlanPanel.jsx'
import { usePlanner } from '../state/PlannerContext.jsx'
import { formatMoney } from '../utils/pricing.js'

function Planner() {
  const { state, semesters, cartCourses } = usePlanner()
  const { notify } = useToast()

  async function copyPlan() {
    try {
      await navigator.clipboard.writeText(planToText(state, getCourse))
      notify('Plan copied. Paste it into an email or notes.')
    } catch {
      notify('Could not copy. Use Print instead.')
    }
  }

  const moveTargets = semesters.filter((semester) => !semester.receipt).map(({ id, label }) => ({ id, label }))
  const unpaid = semesters.filter((semester) => !semester.receipt)
  const unpaidTotal = unpaid.reduce((sum, semester) => sum + semester.pricing.total, 0)
  const paidTotal = semesters.filter((s) => s.receipt).reduce((sum, s) => sum + s.receipt.total, 0)

  return (
    <main id="main" className="container page">
      <div className="page-head">
        <p className="eyebrow">Semester planner</p>
        <h1>Plan it. Price it. Pay it.</h1>
        <p className="lead">
          Each card is one semester. Move courses around and the credits, warnings and cost update right
          away. Pay a semester when you are ready and it locks.
        </p>
        <div className="row no-print">
          <button type="button" className="btn btn--ghost btn--sm" onClick={copyPlan}>
            Copy plan as text
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => window.print()}>
            Print plan
          </button>
        </div>
      </div>

      <div className="planner-layout">
        <div className="stack">
          {cartCourses.length > 0 && (
            <div className="notice">
              <span>
                <strong>{cartCourses.length} course{cartCourses.length === 1 ? '' : 's'}</strong> waiting in your cart.
              </span>
              <Link to="/cart" className="link">
                Assign them
              </Link>
            </div>
          )}

          <div className="semester-grid">
            {semesters.map((semester) => (
              <SemesterCard key={semester.id} semester={semester} moveTargets={moveTargets} />
            ))}
          </div>

          {semesters.length === 0 && <p className="muted">No semesters yet. Add one to get started.</p>}
        </div>

        <aside className="stack planner-side">
          <section className="card">
            <div className="card__body stack">
              <h2 className="h3">Totals</h2>
              <dl className="summary__rows">
                <div>
                  <dt>Still to pay</dt>
                  <dd>{formatMoney(unpaidTotal)}</dd>
                </div>
                <div>
                  <dt>Already paid</dt>
                  <dd>{formatMoney(paidTotal)}</dd>
                </div>
                <div>
                  <dt>Semesters</dt>
                  <dd>{state.semesters.length}</dd>
                </div>
              </dl>
            </div>
          </section>
          <ProgressSummary />
          <SuggestPlanPanel />
          <section className="card">
            <div className="card__body stack">
              <h2 className="h3">Add a semester</h2>
              <AddSemesterForm />
            </div>
          </section>
          <CompletedCourses />
        </aside>
      </div>
    </main>
  )
}

export default Planner
