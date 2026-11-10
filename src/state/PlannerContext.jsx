import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { courses, getCourse } from '../data/catalog.js'
import { STORAGE_KEY } from '../config.js'
import {
  createInitialState,
  plannerReducer,
  sanitizeState,
  satisfiedCourseIds,
} from './plannerReducer.js'
import { countSelected, deriveProgress, deriveSemesters } from './selectors.js'

const PlannerContext = createContext(null)

const validIds = courses.map((course) => course.id)

function loadState() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved) return sanitizeState(JSON.parse(saved), validIds)
  } catch {
    // Private browsing, blocked storage or corrupt JSON: start fresh.
  }
  return createInitialState()
}

export function PlannerProvider({ children }) {
  const [state, dispatch] = useReducer(plannerReducer, undefined, loadState)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Storage full or unavailable: the planner still works, it just will not persist.
    }
  }, [state])

  const value = useMemo(
    () => ({
      state,
      dispatch,
      semesters: deriveSemesters(state, getCourse),
      progress: deriveProgress(state, courses),
      selectedCount: countSelected(state),
      satisfied: satisfiedCourseIds(state),
      cartCourses: state.cart.map(getCourse).filter(Boolean),
      completedCourses: state.completed.map(getCourse).filter(Boolean),
    }),
    [state],
  )

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePlanner() {
  const value = useContext(PlannerContext)
  if (!value) throw new Error('usePlanner must be used inside <PlannerProvider>')
  return value
}
