import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase/init'

// Send email notification for new quote
export const sendNewQuoteEmail = httpsCallable(functions, 'sendNewQuoteEmail')

// Send email notification for quote approval
export const sendQuoteApprovedEmail = httpsCallable(functions, 'sendQuoteApprovedEmail')

// Send invoice email
export const sendInvoiceEmail = httpsCallable(functions, 'sendInvoiceEmail')

// Send payment reminder email
export const sendPaymentReminderEmail = httpsCallable(functions, 'sendPaymentReminderEmail')

// Send project update email
export const sendProjectUpdateEmail = httpsCallable(functions, 'sendProjectUpdateEmail')

// Usage example in components:
// try {
//   await sendNewQuoteEmail({ clientEmail, quoteNumber, amount })
// } catch (error) {
//   console.error('Error sending email:', error)
// }
