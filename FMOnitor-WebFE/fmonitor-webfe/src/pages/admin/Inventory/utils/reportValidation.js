export const DESCRIPTION_MAX = 1000

export function validateReport({ itemId, quantity, description }) {
  const errors = {}

  if (!itemId) errors.itemId = 'Pick the item this report is about'

  if (quantity === '' || quantity === null) errors.quantity = 'Quantity is required'
  else if (!Number.isInteger(Number(quantity))) errors.quantity = 'Quantity must be a whole number'
  else if (Number(quantity) < 1) errors.quantity = 'Quantity must be at least 1'

  if (description.trim().length > DESCRIPTION_MAX) {
    errors.description = `Description must be ${DESCRIPTION_MAX} characters or fewer`
  }

  return errors
}
