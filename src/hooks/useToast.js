import { useContext } from 'react'
import { ToastContext } from '../components/toastContext.js'

/** notify(message, { actionLabel, onAction }) shows a short message at the bottom right. */
export function useToast() {
  const value = useContext(ToastContext)
  if (!value) throw new Error('useToast must be used inside <ToastProvider>')
  return value
}
