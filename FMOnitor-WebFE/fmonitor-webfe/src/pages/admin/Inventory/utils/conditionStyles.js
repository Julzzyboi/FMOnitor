// Good = green, Defect = yellow, Damaged = red, Missing = grey.
export const CONDITION_STYLES = {
  Good: { tag: 'bg-emerald-100 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
  Defect: { tag: 'bg-amber-100 text-amber-800 ring-amber-200', dot: 'bg-amber-400' },
  Damaged: { tag: 'bg-red-100 text-red-700 ring-red-200', dot: 'bg-red-500' },
  Missing: { tag: 'bg-slate-200 text-slate-700 ring-slate-300', dot: 'bg-slate-500' },
}

export const FALLBACK_CONDITION_STYLE = { tag: 'bg-gray-100 text-gray-600 ring-gray-200', dot: 'bg-gray-400' }

export function conditionDotClass(condition) {
  return (CONDITION_STYLES[condition] ?? FALLBACK_CONDITION_STYLE).dot
}
