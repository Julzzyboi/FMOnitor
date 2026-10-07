export const NAME_MAX = 100;

export function validateEquipment({ name, available, notWorking }) {
    const errors = {};

    const trimmed = name.trim()
    if (!trimmed) {
        errors.name = 'Item name is required'
    } else if (trimmed.length > NAME_MAX) {
        errors.name = `Item name must be ${NAME_MAX} characters or fewer`
    }

    const quantityError = (value, label) => {
        if (value === '' || value === null)  return `${label} quantity is required`
        if (!Number.isInteger(Number(value)))  return `${label} must be a whole number`
        if (Number(value) < 0)  return `${label} can't be negative`
            return null
         }

    const availableError = quantityError(available, 'Available');
    if (availableError) errors.available = availableError

    const notWorkingError = quantityError(notWorking, 'Not working');
    if (notWorkingError) errors.notWorking = notWorkingError

    return errors
}
