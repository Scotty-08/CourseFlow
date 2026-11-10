// What counts toward the "degree progress" bar.
//
// Every course in the catalog is one requirement slot, except where the
// catalog lists two options for one slot. Those are "pick one" groups.
// Like the prerequisite map this is advisory: check your official curriculum.

export const PICK_ONE_GROUPS = [
  {
    id: 'chemistry',
    label: 'General chemistry (pick one)',
    options: ['chem-1670', 'chem-1770'],
  },
  {
    id: 'writing',
    label: 'Technical writing (pick one)',
    options: ['engl-3140', 'engl-3090'],
  },
]

/**
 * Turn a list of course ids into requirement slots:
 * { id, label, options: [courseIds] }. Single courses are a slot of one.
 */
export function buildRequirementSlots(courseIds) {
  const grouped = new Set(PICK_ONE_GROUPS.flatMap((group) => group.options))
  const slots = PICK_ONE_GROUPS.map((group) => ({ ...group }))
  for (const id of courseIds) {
    if (!grouped.has(id)) slots.push({ id, label: id, options: [id] })
  }
  return slots
}
