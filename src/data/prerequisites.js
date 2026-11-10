// Advisory prerequisite and corequisite map for the CPRE course list.
//
// This is a planning aid, NOT the official ISU catalog. It captures the usual
// ordering so CourseFlow can warn about obviously out-of-order plans. Always
// confirm with the university catalog and your academic advisor.
//
//   prereqs: must be finished in an EARLIER semester (or already completed)
//   coreqs:  must be finished earlier OR taken in the SAME semester

export const PREREQUISITES = {
  'engl-2500': { prereqs: ['engl-1500'] },
  'engl-3140': { prereqs: ['engl-2500'] },
  'engl-3090': { prereqs: ['engl-2500'] },

  'math-1660': { prereqs: ['math-1650'] },
  'math-2070': { prereqs: ['math-1650'] },
  'math-2670': { prereqs: ['math-1660'] },
  'stat-3030': { prereqs: ['math-1660'] },

  'phys-2310': { coreqs: ['math-1650'] },
  'phys-2310l': { coreqs: ['phys-2310'] },

  'coms-2270': { coreqs: ['cpre-1850'] },
  'coms-2280': { prereqs: ['coms-2270'] },

  'cpre-2810': { coreqs: ['cpre-1850'] },
  'cpre-2880': { prereqs: ['cpre-2810'], coreqs: ['coms-2270'] },
  'cpre-3810': { prereqs: ['cpre-2810', 'coms-2270'] },
  'cpre-3080': { prereqs: ['coms-2280', 'cpre-3810'] },
  'cpre-3100': { prereqs: ['cpre-2810', 'math-1660'] },
  'cpre-3250': { prereqs: ['math-2070', 'stat-3030'] },

  'coms-3090': { prereqs: ['coms-2280'] },
  'coms-3110': { prereqs: ['coms-2280'] },

  'ee-2010': { prereqs: ['math-1650'], coreqs: ['math-1660', 'phys-2310'] },
  'ee-2300': { prereqs: ['ee-2010'] },

  'cpre-4910': { prereqs: ['coms-3090'] },
  'cpre-4920': { prereqs: ['cpre-4910'] },
  'cpre-4940': { prereqs: ['cpre-4910'] },
}

export function prereqsOf(id) {
  return PREREQUISITES[id]?.prereqs ?? []
}

export function coreqsOf(id) {
  return PREREQUISITES[id]?.coreqs ?? []
}

/** Course ids that list `id` as a prerequisite or corequisite. */
export function unlocksOf(id) {
  return Object.keys(PREREQUISITES).filter(
    (other) => prereqsOf(other).includes(id) || coreqsOf(other).includes(id),
  )
}
