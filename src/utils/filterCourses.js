export const SORT_OPTIONS = [
  { id: 'code', label: 'Course code' },
  { id: 'credits-desc', label: 'Most credits' },
  { id: 'credits-asc', label: 'Fewest credits' },
  { id: 'price-asc', label: 'Price: low to high' },
  { id: 'price-desc', label: 'Price: high to low' },
]

export const DEFAULT_FILTERS = {
  query: '',
  category: 'all',
  level: 'all',
  sort: 'code',
}

function matchesQuery(course, query) {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  // "cpre3080" should find "CPRE 3080", so compare with spaces removed too.
  const compact = needle.replace(/\s+/g, '')
  const haystack = `${course.code} ${course.title} ${course.instructor} ${course.description}`.toLowerCase()
  return haystack.includes(needle) || haystack.replace(/\s+/g, '').includes(compact)
}

const sorters = {
  code: (a, b) => a.code.localeCompare(b.code, 'en', { numeric: true }),
  'credits-desc': (a, b) => b.credits - a.credits || a.code.localeCompare(b.code),
  'credits-asc': (a, b) => a.credits - b.credits || a.code.localeCompare(b.code),
  'price-asc': (a, b) => a.price - b.price || a.code.localeCompare(b.code),
  'price-desc': (a, b) => b.price - a.price || a.code.localeCompare(b.code),
}

/** Apply search, category, level and sort. Returns a new array. */
export function filterCourses(courses, filters = DEFAULT_FILTERS) {
  const { query, category, level, sort } = { ...DEFAULT_FILTERS, ...filters }
  return courses
    .filter((course) => matchesQuery(course, query))
    .filter((course) => category === 'all' || course.categoryId === category)
    .filter((course) => level === 'all' || String(course.level) === String(level))
    .sort(sorters[sort] ?? sorters.code)
}

/** Distinct course levels (1000, 2000, ...) present in the list, ascending. */
export function levelsOf(courses) {
  return [...new Set(courses.map((course) => course.level))].sort((a, b) => a - b)
}
