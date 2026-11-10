import { useMemo } from 'react'
import { usePlanner } from '../state/PlannerContext.jsx'
import { getCourse } from '../data/catalog.js'
import { semesterLabel } from '../utils/semester.js'
import { useToast } from './useToast.js'

/** Planner actions wrapped with toasts (and undo where it makes sense). */
export function useCourseActions() {
  const { dispatch } = usePlanner()
  const { notify } = useToast()

  return useMemo(() => {
    const name = (id) => getCourse(id)?.code ?? id

    return {
      addToCart(courseId) {
        dispatch({ type: 'cart/add', courseId })
        notify(`${name(courseId)} added to your cart`, {
          actionLabel: 'Undo',
          onAction: () => dispatch({ type: 'cart/remove', courseId }),
        })
      },
      removeFromCart(courseId) {
        dispatch({ type: 'cart/remove', courseId })
        notify(`${name(courseId)} removed from your cart`, {
          actionLabel: 'Undo',
          onAction: () => dispatch({ type: 'cart/add', courseId }),
        })
      },
      assign(courseId, semesterId) {
        dispatch({ type: 'plan/assign', courseId, semesterId })
        notify(`${name(courseId)} moved to ${semesterLabel(semesterId)}`)
      },
      unassign(courseId) {
        dispatch({ type: 'plan/unassign', courseId })
        notify(`${name(courseId)} moved back to your cart`)
      },
      complete(courseId) {
        dispatch({ type: 'course/complete', courseId })
        notify(`${name(courseId)} marked as completed`, {
          actionLabel: 'Undo',
          onAction: () => dispatch({ type: 'course/uncomplete', courseId }),
        })
      },
      uncomplete(courseId) {
        dispatch({ type: 'course/uncomplete', courseId })
        notify(`${name(courseId)} is no longer marked completed`)
      },
    }
  }, [dispatch, notify])
}
