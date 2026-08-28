import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { ROLES } from './mockUsers'
import AvatarPicker from './AvatarPicker'

function EditUserModal({ user, onCancel, onSave }) {
  const [name, setName] = useState(user.name)
  const [role, setRole] = useState(user.role)
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? null)

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({ ...user, name: name.trim() || user.name, role, avatarUrl })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onCancel} aria-hidden="true" className="absolute inset-0 bg-black/50" />

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md animate-[fade-in-up_0.25s_ease-out_forwards] rounded-2xl bg-white p-6 shadow-2xl opacity-0 sm:p-8"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Edit User</h3>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="cursor-pointer rounded-md p-1.5 text-gray-400 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-600"
          >
            <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6">
          <AvatarPicker avatarUrl={avatarUrl} name={name} onChange={setAvatarUrl} />
        </div>

        <div className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-[#fccb35] focus:outline-none focus:ring-2 focus:ring-[#fccb35]/30"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Role</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-[#fccb35] focus:outline-none focus:ring-2 focus:ring-[#fccb35]/30"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition-colors duration-150 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="cursor-pointer rounded-lg bg-[#fccb35] px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  )
}

export default EditUserModal
