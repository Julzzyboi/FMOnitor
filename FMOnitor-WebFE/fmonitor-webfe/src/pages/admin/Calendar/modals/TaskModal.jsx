import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { DURATIONS, HAULERS, TASK_LOCATIONS, TASK_TYPES } from '../data/taskData'
import { fromInputValues, toDateInputValue, toTimeInputValue } from '../utils/dateUtils'

const INPUT_CLASS =
  'w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm text-gray-900 focus:border-[#fccb35] focus:outline-none focus:ring-2 focus:ring-[#fccb35]/30'

function Field({ label, children }) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</span>
      {children}
    </label>
  )
}

function durationLabel(mins) {
  return mins < 60 ? `${mins} min` : `${mins / 60} hr${mins === 60 ? '' : 's'}`
}

function TaskModal({ task, defaultStart, onCancel, onSubmit }) {
  const isEdit = !!task
  const start = task?.scheduledAt ?? defaultStart
  const [title, setTitle] = useState(task?.title ?? '')
  const [type, setType] = useState(task?.type ?? TASK_TYPES[0])
  const [items, setItems] = useState(task?.items ?? '')
  const [origin, setOrigin] = useState(task?.origin ?? 'Qpav Mezzanine')
  const [destination, setDestination] = useState(task?.destination ?? 'Plaza Mayor')
  const [date, setDate] = useState(toDateInputValue(start))
  const [time, setTime] = useState(toTimeInputValue(start))
  const [durationMins, setDurationMins] = useState(task?.durationMins ?? 60)
  const [hauler, setHauler] = useState(task?.hauler ?? HAULERS[0])
  const [notes, setNotes] = useState(task?.notes ?? '')

  const sameRoute = origin === destination

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim() || !date || !time || sameRoute) return
    onSubmit({
      title: title.trim(),
      type,
      items: items.trim(),
      origin,
      destination,
      scheduledAt: fromInputValues(date, time),
      durationMins: Number(durationMins),
      hauler,
      notes: notes.trim(),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-16 lg:py-20">
      <div onClick={onCancel} aria-hidden="true" className="absolute inset-0 bg-black/50" />

      <form
        onSubmit={handleSubmit}
        className="relative flex max-h-full w-full max-w-md animate-[fade-in-up_0.25s_ease-out_forwards] flex-col overflow-hidden rounded-2xl bg-white opacity-0 shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="text-base font-bold text-gray-900">{isEdit ? 'Edit Task' : 'New Task'}</h3>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="cursor-pointer rounded-md p-1.5 text-gray-400 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-600"
          >
            <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          <div className="flex flex-col gap-3">
            <Field label="Task Name">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                required
                className={INPUT_CLASS}
                placeholder="e.g. Org Fair Delivery"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Type">
                <select value={type} onChange={(e) => setType(e.target.value)} className={INPUT_CLASS}>
                  {TASK_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>
              <Field label="Hauler">
                <select value={hauler} onChange={(e) => setHauler(e.target.value)} className={INPUT_CLASS}>
                  {HAULERS.map((h) => (
                    <option key={h}>{h}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Items">
              <input
                value={items}
                onChange={(e) => setItems(e.target.value)}
                className={INPUT_CLASS}
                placeholder="e.g. Lifetime Chairs ×100"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="From">
                <select value={origin} onChange={(e) => setOrigin(e.target.value)} className={INPUT_CLASS}>
                  {TASK_LOCATIONS.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </Field>
              <Field label="To (Venue)">
                <select value={destination} onChange={(e) => setDestination(e.target.value)} className={INPUT_CLASS}>
                  {TASK_LOCATIONS.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </Field>
            </div>
            {sameRoute && <p className="-mt-1 text-[11px] font-medium text-red-600">Origin and destination must differ.</p>}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Field label="Date">
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className={INPUT_CLASS} />
              </Field>
              <Field label="Start Time">
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required className={INPUT_CLASS} />
              </Field>
              <div className="col-span-2 sm:col-span-1">
                <Field label="Duration">
                  <select value={durationMins} onChange={(e) => setDurationMins(e.target.value)} className={INPUT_CLASS}>
                    {DURATIONS.map((d) => (
                      <option key={d} value={d}>
                        {durationLabel(d)}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>

            <Field label="Notes">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className={`${INPUT_CLASS} resize-none`}
                placeholder="Optional instructions for the hauler"
              />
            </Field>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2.5 border-t border-gray-100 px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex h-10 flex-1 cursor-pointer items-center justify-center rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 transition-colors duration-150 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={sameRoute}
            className="flex h-10 flex-1 cursor-pointer items-center justify-center rounded-xl bg-[#fccb35] text-sm font-semibold text-gray-900 shadow-sm transition-colors duration-150 hover:bg-[#e6b82f] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isEdit ? 'Save Changes' : 'Schedule Task'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default TaskModal
