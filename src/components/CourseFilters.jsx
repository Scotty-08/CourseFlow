import { categories } from '../data/catalog.js'
import { SORT_OPTIONS } from '../utils/filterCourses.js'

function CourseFilters({ filters, levels, onChange, resultCount }) {
  const set = (patch) => onChange({ ...filters, ...patch })

  return (
    <section className="toolbar" aria-label="Find courses">
      <div className="toolbar__top">
        <label className="search">
          <span className="sr-only">Search courses</span>
          <input
            className="input"
            type="search"
            placeholder="Search by code, title or instructor, e.g. CPRE 3080"
            value={filters.query}
            onChange={(event) => set({ query: event.target.value })}
          />
        </label>
        <label className="field field--inline">
          <span className="field__label">Level</span>
          <select className="select select--sm" value={filters.level} onChange={(event) => set({ level: event.target.value })}>
            <option value="all">All</option>
            {levels.map((level) => (
              <option key={level} value={level}>
                {level}s
              </option>
            ))}
          </select>
        </label>
        <label className="field field--inline">
          <span className="field__label">Sort</span>
          <select className="select select--sm" value={filters.sort} onChange={(event) => set({ sort: event.target.value })}>
            {SORT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="toolbar__chips" role="group" aria-label="Category">
        <button type="button" className={`chip${filters.category === 'all' ? ' chip--active' : ''}`} onClick={() => set({ category: 'all' })}>
          All courses
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            className={`chip${filters.category === category.id ? ' chip--active' : ''}`}
            aria-pressed={filters.category === category.id}
            onClick={() => set({ category: category.id })}
          >
            {category.label} <span className="muted">{category.count}</span>
          </button>
        ))}
      </div>

      <p className="small muted" aria-live="polite">
        Showing {resultCount} course{resultCount === 1 ? '' : 's'}
      </p>
    </section>
  )
}

export default CourseFilters
