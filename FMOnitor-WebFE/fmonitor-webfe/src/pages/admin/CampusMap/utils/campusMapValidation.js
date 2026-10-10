export const NAME_MAX = 100
export const DESCRIPTION_MAX = 500
export const HEIGHT_MAX = 200

// Shared by Campus Area, Storage and Venue forms.
function checkNameAndDescription({ name, description }, errors) {
  const trimmed = name.trim()
  if (!trimmed) {
    errors.name = 'Name is required'
  } else if (trimmed.length > NAME_MAX) {
    errors.name = `Name must be ${NAME_MAX} characters or fewer`
  }

  if (description.trim().length > DESCRIPTION_MAX) {
    errors.description = `Description must be ${DESCRIPTION_MAX} characters or fewer`
  }
}

export function validateCampusArea({ name, description, height, branchId, isEdit }) {
  const errors = {}
  checkNameAndDescription({ name, description }, errors)

  if (height === '' || height === null) {
    errors.height = 'Height is required (use 0 for open areas)'
  } else if (!Number.isFinite(Number(height))) {
    errors.height = 'Height must be a number'
  } else if (Number(height) < 0) {
    errors.height = "Height can't be negative"
  } else if (Number(height) > HEIGHT_MAX) {
    errors.height = `Height can't be more than ${HEIGHT_MAX} meters`
  }

  if (!isEdit && !branchId) {
    errors.branchId = 'Select a campus'
  }

  return errors
}

// Storage and Venue forms share the same fields.
export function validatePlace({ name, description, campusAreaId }) {
  const errors = {}
  checkNameAndDescription({ name, description }, errors)

  if (!campusAreaId) {
    errors.campusAreaId = 'Select the facility this belongs to'
  }

  return errors
}