import { useId, useMemo, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass, faXmark, faCheck } from '@fortawesome/free-solid-svg-icons'
import useClickOutside from '../../../../hooks/useClickOutside'

// Type-to-search picker for a Campus Map storage. `groups` is
// [[facilityName, [{ id, name }, ...]], ...]; matches on the storage name or
// the facility it's in. The list opens inline (not floating) so the modal's
// scroll area never clips it.
function StorageSearchSelect({ groups, value, onChange, hasError }) {
  const listId = useId()
  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const allStorages = useMemo(
    () => groups.flatMap(([facilityName, storages]) => storages.map((s) => ({ ...s, facilityName }))),
    [groups],
  )
  const selected = allStorages.find((s) => String(s.id) === String(value)) ?? null

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return groups
    return groups
      .map(([facilityName, storages]) => [
        facilityName,
        facilityName.toLowerCase().includes(q) ? storages : storages.filter((s) => s.name.toLowerCase().includes(q)),
      ])
      .filter(([, storages]) => storages.length > 0)
  }, [groups, query])
  const flatOptions = useMemo(() => filteredGroups.flatMap(([, storages]) => storages), [filteredGroups])

  const close = () => {
    setOpen(false)
    setQuery('')
  }
  useClickOutside(containerRef, () => {
    if (open) close()
  })

  const openList = () => {
    setOpen(true)
    setActiveIndex(Math.max(0, flatOptions.findIndex((s) => s.id === selected?.id)))
  }

  const choose = (storage) => {
    onChange(storage.id)
    close()
    inputRef.current?.blur()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!open) openList()
      else setActiveIndex((i) => Math.min(i + 1, flatOptions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      // Never submit the form from here.
      e.preventDefault()
      if (open && flatOptions[activeIndex]) choose(flatOptions[activeIndex])
    } else if (e.key === 'Escape' && open) {
      e.stopPropagation()
      close()
    }
  }

  const activeId = open && flatOptions[activeIndex] ? `${listId}-${flatOptions[activeIndex].id}` : undefined
  let optionIndex = -1

  return (
    <div ref={containerRef} className="flex flex-col gap-1.5">
      <div
        className={`flex items-center gap-2 rounded-lg border bg-white px-3 py-2 focus-within:ring-2 ${
          hasError
            ? 'border-red-400 focus-within:border-red-400 focus-within:ring-red-200'
            : 'border-gray-200 focus-within:border-[#fccb35] focus-within:ring-[#fccb35]/30'
        }`}
      >
        <FontAwesomeIcon icon={faMagnifyingGlass} className="h-3.5 w-3.5 shrink-0 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={activeId}
          aria-autocomplete="list"
          value={open ? query : (selected?.name ?? '')}
          onFocus={openList}
          onClick={() => !open && openList()}
          onChange={(e) => {
            setQuery(e.target.value)
            setActiveIndex(0)
            if (!open) setOpen(true)
          }}
          onKeyDown={handleKeyDown}
          placeholder={selected && open ? selected.name : 'Search storages…'}
          className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
        />
        {selected && (
          <button
            type="button"
            onClick={() => {
              onChange('')
              setQuery('')
              inputRef.current?.focus()
            }}
            aria-label="Clear storage"
            className="shrink-0 cursor-pointer rounded p-0.5 text-gray-400 transition-colors duration-150 hover:text-gray-600"
          >
            <FontAwesomeIcon icon={faXmark} className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {selected && !open && (
        <p className="text-xs text-gray-500">
          Inside <span className="font-semibold text-gray-700">{selected.facilityName}</span>
        </p>
      )}

      {open && (
        <div
          id={listId}
          role="listbox"
          className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-sm"
        >
          {flatOptions.length === 0 ? (
            <p className="px-3 py-3 text-center text-xs text-gray-400">No storage matches "{query.trim()}"</p>
          ) : (
            filteredGroups.map(([facilityName, storages]) => (
              <div key={facilityName} role="group" aria-label={facilityName}>
                <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                  {facilityName}
                </p>
                {storages.map((s) => {
                  optionIndex += 1
                  const index = optionIndex
                  const isActive = index === activeIndex
                  const isSelected = s.id === selected?.id
                  return (
                    <button
                      key={s.id}
                      id={`${listId}-${s.id}`}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      tabIndex={-1}
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => choose(s)}
                      className={`flex w-full cursor-pointer items-start gap-2 px-3 py-2 text-left text-sm leading-snug ${
                        isActive ? 'bg-[#fccb35]/20 text-gray-900' : 'text-gray-700'
                      }`}
                    >
                      <span className="min-w-0 flex-1 break-words">{s.name}</span>
                      {isSelected && <FontAwesomeIcon icon={faCheck} className="mt-1 h-3 w-3 shrink-0 text-[#a3790f]" />}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default StorageSearchSelect
