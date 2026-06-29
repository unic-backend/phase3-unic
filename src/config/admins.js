// Liste centrale des emails administrateurs.
// Pour ajouter un admin: ajoute son email ici (en minuscules).
export const ADMIN_EMAILS = [
  'admin@unicplaquiste.com',
  'unicplaquiste@gmail.com',
  'odiop2020@gmail.com',
]

export function isAdminEmail(email) {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.trim().toLowerCase())
}
