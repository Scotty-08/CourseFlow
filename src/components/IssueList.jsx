import { getCourse } from '../data/catalog.js'

const codes = (ids) => ids.map((id) => getCourse(id)?.code ?? id).join(' and ')

function describe(issue) {
  const course = getCourse(issue.courseId)?.code ?? issue.courseId
  return issue.kind === 'prereq'
    ? `${course} usually needs ${codes(issue.missing)} in an earlier semester.`
    : `${course} should be taken with or after ${codes(issue.missing)}.`
}

/** Advisory prerequisite warnings for one semester. Renders nothing when there are none. */
function IssueList({ issues }) {
  if (!issues || issues.length === 0) return null
  return (
    <div className="notice notice--warn" role="alert">
      <div>
        <strong>Check the order</strong>
        <ul>
          {issues.map((issue) => (
            <li key={`${issue.courseId}-${issue.kind}`}>{describe(issue)}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default IssueList
