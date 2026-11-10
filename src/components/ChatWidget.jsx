import { useEffect, useRef, useState } from 'react'
import { courses, getCourse } from '../data/catalog.js'
import { usePlanner } from '../state/PlannerContext.jsx'
import { reply, SUGGESTED_PROMPTS } from '../utils/chatbot.js'
import { buildSuggestion } from '../utils/planFromState.js'
import { semesterLabel } from '../utils/semester.js'

const GREETING = {
  from: 'bot',
  text: 'hi, i\'m the CourseFlow helper. ask about prerequisites, prices or your plan, or tell me to add a course.',
}

/** Floating terminal-style assistant. Rule-based and local: nothing you type leaves the browser. */
function ChatWidget() {
  const planner = usePlanner()
  const { state, dispatch, semesters, progress, satisfied } = planner
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([GREETING])
  const logRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    const log = logRef.current
    if (log) log.scrollTop = log.scrollHeight
  }, [messages, open])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => event.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  function runSuggestion() {
    const { result } = buildSuggestion({ courses, state, satisfied })
    if (result.semesters.length === 0) return 'Nothing left to plan. Every requirement is done or paid.'
    dispatch({ type: 'plan/applySuggestion', plan: result.plan })
    return `Done: ${result.semesters.length} semesters planned, finishing ${semesterLabel(result.semesters.at(-1))}. Open the planner to review.`
  }

  function send(text) {
    const trimmed = text.trim()
    if (!trimmed) return
    const answer = reply(trimmed, { courses, getCourse, state, semesters, progress })
    let followUp = null

    if (answer.action?.type === 'dispatch') dispatch(answer.action.action)
    if (answer.action?.type === 'suggest') followUp = runSuggestion()

    setMessages((current) => [
      ...current,
      { from: 'you', text: trimmed },
      { from: 'bot', text: followUp ? `${answer.text}\n${followUp}` : answer.text },
    ])
    setInput('')
  }

  function handleSubmit(event) {
    event.preventDefault()
    send(input)
  }

  return (
    <div className="chat">
      {open && (
        <section className="chat__panel" role="dialog" aria-label="CourseFlow assistant">
          <header className="chat__head">
            <div>
              <p className="chat__title">&gt;_ helper</p>
              <p className="chat__sub">rule-based · runs in your browser · not an AI model</p>
            </div>
            <button type="button" className="chat__close" onClick={() => setOpen(false)} aria-label="Close assistant">
              ×
            </button>
          </header>

          <div className="chat__log" ref={logRef} role="log" aria-live="polite">
            {messages.map((message, index) => (
              <p key={index} className={`chat__msg chat__msg--${message.from}`}>
                <span className="chat__who" aria-hidden="true">
                  {message.from === 'bot' ? '>' : '$'}
                </span>
                <span className="chat__text">{message.text}</span>
              </p>
            ))}
          </div>

          {messages.length <= 1 && (
            <div className="chat__chips">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button key={prompt} type="button" className="chip" onClick={() => send(prompt)}>
                  {prompt}
                </button>
              ))}
            </div>
          )}

          <form className="chat__form" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="chat-input">
              Message the assistant
            </label>
            <input
              id="chat-input"
              ref={inputRef}
              className="input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="ask or type a command…"
              autoComplete="off"
            />
            <button type="submit" className="btn btn--primary btn--sm">
              Send
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        className="chat__launch glitch-hover"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? 'Close assistant' : 'Open assistant'}
      >
        {open ? '×' : '>_'}
      </button>
    </div>
  )
}

export default ChatWidget
