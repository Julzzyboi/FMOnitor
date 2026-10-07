export const NAME_MAX = 100

export function validateEquipment({ name, storageId, available }) {
  const errors = {}

  const trimmed = name.trim()
  if (!trimmed) {
    errors.name = 'Item name is required'
  } else if (trimmed.length > NAME_MAX) {
    errors.name = `Item name must be ${NAME_MAX} characters or fewer`
  }

  if (!storageId) errors.storageId = 'Pick the storage this item is kept in'

  if (available === '' || available === null) errors.available = 'Quantity available is required'
  else if (!Number.isInteger(Number(available))) errors.available = 'Quantity must be a whole number'
  else if (Number(available) < 0) errors.available = "Quantity can't be negative"

  return errors
}
