import { useState } from 'react'
import { TERMS } from '../config.js'
import { usePlanner } from '../state/PlannerContext.jsx'
import { makeSemesterId, semesterLabel } from '../utils/semester.js'
import { useToast } from '../hooks/useToast.js'

const thisYear = new Date().getFullYear()
const years = Array.from({ length: 8 }, (_, index) => thisYear + index)

function AddSemesterForm() {
  const { state, dispatch } = usePlanner()
  const { notify } = useToast()
  const [term, setTerm] = useState('fall')
  const [year, setYear] = useState(thisYear + 1)

  function handleSubmit(event) {
    event.preventDefault()
    const semesterId = makeSemesterId(term, year)
    if (state.semesters.includes(semesterId)) {
      notify(`${semesterLabel(semesterId)} is already in your planner`)
      return
    }
    dispatch({ type: 'semester/add', semesterId })
    notify(`${semesterLabel(semesterId)} added`)
  }

  return (
    <form className="inline-form" onSubmit={handleSubmit}>
      <label className="field">
        <span className="field__label">Term</span>
        <select className="select" value={term} onChange={(event) => setTerm(event.target.value)}>
          {TERMS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span className="field__label">Year</span>
        <select className="select" value={year} onChange={(event) => setYear(Number(event.target.value))}>
          {years.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" className="btn btn--ghost">
        Add semester
      </button>
    </form>
  )
}

export default AddSemesterForm
