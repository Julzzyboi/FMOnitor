export const ROLES = ['Superadmin', 'Admin', 'Hauler', 'Requestor']
// All possible status values a user can have.
export const STATUSES = ['Active', 'Inactive', 'Unregistered', 'Disabled', 'Deleted']
// Disabled/Deleted aren't shown in the Status filter dropdown — they're reached
// through their own dedicated toggle buttons instead, since those users are
// hidden from the table by default.
export const FILTERABLE_STATUSES = ['Active', 'Inactive', 'Unregistered']

const FIRST_NAMES = [
  'James', 'Maria', 'John', 'Anna', 'Carlos', 'Grace', 'Miguel', 'Sofia',
  'Daniel', 'Isabel', 'Marco', 'Elena', 'Rafael', 'Lucia', 'Antonio', 'Clara',
  'Diego', 'Camille', 'Victor', 'Nadia', 'Samuel', 'Rosa', 'Adrian', 'Teresa',
  'Julian', 'Bianca', 'Emmanuel', 'Patricia', 'Xavier', 'Monique', 'Gabriel', 'Dolores',
  'Nathaniel', 'Ruby', 'Oscar', 'Vivian', 'Leon', 'Ines', 'Felix', 'Corazon',
]

const LAST_NAMES = [
  'Santos', 'Reyes', 'Cruz', 'Bautista', 'Ocampo', 'Garcia', 'Torres', 'Flores',
  'Mendoza', 'Castillo', 'Villanueva', 'Aquino', 'Del Rosario', 'Navarro', 'Domingo', 'Salazar',
  'Aguilar', 'Ramos', 'Pascual', 'Gutierrez',
]

// Deterministic pseudo-random generator so the mock dataset stays stable across renders.
function seededRandom(seed) {
  let value = seed
  return () => {
    value = (value * 9301 + 49297) % 233280
    return value / 233280
  }
}

const random = seededRandom(42)

function pickWeighted(random, weightedOptions) {
  const total = weightedOptions.reduce((sum, [, weight]) => sum + weight, 0)
  let roll = random() * total
  for (const [option, weight] of weightedOptions) {
    if (roll < weight) return option
    roll -= weight
  }
  return weightedOptions[0][0]
}

function randomDate(random, startYear = 2023) {
  const start = new Date(startYear, 0, 1).getTime()
  const end = new Date().getTime()
  const date = new Date(start + random() * (end - start))
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const USER_COUNT = 12

export const MOCK_USERS = Array.from({ length: USER_COUNT }, (_, i) => {
  const firstName = FIRST_NAMES[i % FIRST_NAMES.length]
  const lastName = LAST_NAMES[Math.floor(random() * LAST_NAMES.length)]
  const name = `${firstName} ${lastName}`
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/\s+/g, '')}.cics@ust.edu.ph`

  // Guarantee at least one of each role/status near the top of the list so filters
  // are demonstrable without having to page through the whole mock dataset.
  const role =
    i === 0
      ? 'Superadmin'
      : i === 1
        ? 'Admin'
        : pickWeighted(random, [
            ['Superadmin', 2],
            ['Admin', 8],
            ['Hauler', 45],
            ['Requestor', 45],
          ])

  const status =
    i === 2
      ? 'Unregistered'
      : i === 3
        ? 'Inactive'
        : i === 4
          ? 'Disabled'
          : pickWeighted(random, [
              ['Active', 55],
              ['Inactive', 20],
              ['Unregistered', 15],
              ['Disabled', 10],
            ])

  return {
    id: i + 1,
    name,
    email,
    role,
    status,
    dateCreated: randomDate(random),
    avatarUrl: null,
  }
})
