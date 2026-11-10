import rawCourses from './courses.json'
import { categoriesOf, normalizeCourses } from './normalize.js'

export const courses = normalizeCourses(rawCourses)
export const categories = categoriesOf(courses)

const byId = new Map(courses.map((course) => [course.id, course]))

export function getCourse(id) {
  return byId.get(id) ?? null
}

export function hasCourse(id) {
  return byId.has(id)
}
