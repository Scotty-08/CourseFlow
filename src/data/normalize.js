// Turns the raw rows in courses.json into the shape the app uses everywhere.
// Kept free of imports so Node can run it directly in tests.

function slug(text) {
  return String(text)
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * - credits becomes a number. "R" (registration only) is 0 credits.
 * - registration-only courses cost $0, even if the source row lists a price.
 * - department / number / level are derived from the course code.
 */
export function normalizeCourse(raw) {
  const registrationOnly = String(raw.credits).trim().toUpperCase() === 'R'
  const credits = registrationOnly ? 0 : Number(raw.credits) || 0
  const [department, ...rest] = String(raw.code).split(' ')
  const number = rest.join(' ')
  const levelDigit = Number.parseInt(number, 10)

  return {
    id: raw.id,
    code: raw.code,
    title: raw.title,
    department,
    number,
    level: Number.isFinite(levelDigit) ? Math.floor(levelDigit / 1000) * 1000 : 0,
    category: raw.category,
    categoryId: slug(raw.category),
    credits,
    creditsLabel: registrationOnly ? 'R' : String(credits),
    registrationOnly,
    price: registrationOnly ? 0 : Number(raw.price) || 0,
    description: raw.description,
    instructor: raw.instructor,
    duration: raw.duration,
    thumbnail: raw.thumbnail,
    trailer: raw.trailer,
  }
}

export function normalizeCourses(rows) {
  return rows.map(normalizeCourse)
}

/** Distinct categories in first-seen order, with how many courses each has. */
export function categoriesOf(courses) {
  const seen = new Map()
  for (const course of courses) {
    const entry = seen.get(course.categoryId) ?? {
      id: course.categoryId,
      label: course.category,
      count: 0,
    }
    entry.count += 1
    seen.set(course.categoryId, entry)
  }
  return [...seen.values()]
}
