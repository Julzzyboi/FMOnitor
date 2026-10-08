import { CRITICAL_MAX_QTY } from '../data/inventoryData'

export const NAME_MAX = 100

export function validateEquipment({ name, storageId, available, critical }) {
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
  else if (critical && Number(available) > CRITICAL_MAX_QTY) {
    errors.available = 'A critical item is a single unit, so its quantity can only be 0 or 1. Add each unit as its own critical item.'
  }

  return errors
}
