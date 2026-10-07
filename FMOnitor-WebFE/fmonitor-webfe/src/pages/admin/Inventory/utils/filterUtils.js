export function countBy(list, getValue, options) {
  const counts = Object.fromEntries(options.map((o) => [o, 0]))
  for (const entry of list) {
    const value = getValue(entry)
    counts[value] = (counts[value] ?? 0) + 1
  }
  return counts
}

export function toggleInSet(setState, value) {
  setState((prev) => {
    const next = new Set(prev)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    return next
  })
}
