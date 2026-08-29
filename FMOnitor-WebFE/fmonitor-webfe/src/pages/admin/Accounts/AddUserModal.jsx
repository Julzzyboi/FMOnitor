import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faPaperPlane } from '@fortawesome/free-solid-svg-icons'
import { ROLES } from './mockUsers'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function parseEmails(raw) {
  return raw
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)
}

function AddUserModal({ onCancel, onInvite }) {
  const [emailsInput, setEmailsInput] = useState('')
  const [role, setRole] = useState(ROLES[ROLES.length - 1])
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()

    const emails = parseEmails(emailsInput)
    if (emails.length === 0) {
      setError('Enter at least one email')
      return
    }
    const invalid = emails.find((email) => !EMAIL_PATTERN.test(email))
    if (invalid) {
      setError(`"${invalid}" doesn't look like a valid email`)
      return
    }

    setError('')
    onInvite({ emails, role })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onCancel} aria-hidden="true" className="absolute inset-0 bg-black/50" />

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-lg animate-[fade-in-up_0.25s_ease-out_forwards] rounded-2xl bg-white p-6 shadow-2xl opacity-0 sm:p-8"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Invite people</h3>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="cursor-pointer rounded-md p-1.5 text-gray-400 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-600"
          >
            <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-1.5 sm:flex-row sm:items-stretch sm:gap-0">
          <div className="flex flex-1 items-center rounded-lg border border-gray-200 focus-within:border-[#fccb35] focus-within:ring-2 focus-within:ring-[#fccb35]/30 sm:rounded-r-none sm:border-r-0">
            <input
              type="text"
              value={emailsInput}
              onChange={(e) => setEmailsInput(e.target.value)}
              placeholder="Email or group, separated by commas"
              autoFocus
              className="w-full bg-transparent px-3.5 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400"
            />
          </div>

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none sm:border-x-0"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#fccb35] px-5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 sm:rounded-l-none"
          >
            <FontAwesomeIcon icon={faPaperPlane} className="h-3.5 w-3.5" />
            Invite
          </button>
        </div>

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <p className="mt-3 text-xs text-gray-400">
          Everyone invited gets the <span className="font-semibold text-gray-500">{role}</span> role. They'll receive
          an email with a link to sign in and activate their account.
        </p>
      </form>
    </div>
  )
}

export default AddUserModal
