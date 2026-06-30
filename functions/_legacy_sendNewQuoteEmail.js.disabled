const functions = require('firebase-functions')
const nodemailer = require('nodemailer')

// Configure email (use env variables in production)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_PASSWORD
  }
})

exports.sendNewQuoteEmail = functions.firestore
  .document('quotes/{quoteId}')
  .onCreate(async (snap, context) => {
    const quote = snap.data()
    
    // Email to admin (Ousmane)
    await transporter.sendMail({
      from: process.env.GMAIL_EMAIL,
      to: 'ousmane@unicplaquiste.com',
      subject: `Nouveau devis demandé: ${quote.quoteNumber}`,
      html: `
        <h2>Nouveau devis demandé!</h2>
        <p><strong>Numéro:</strong> ${quote.quoteNumber}</p>
        <p><strong>Client:</strong> ${quote.clientName}</p>
        <p><strong>Surface:</strong> ${quote.surface}m²</p>
        <p><strong>Type:</strong> ${quote.type}</p>
        <p><strong>Montant estimé:</strong> ${quote.totalTTC.toLocaleString('fr-FR')} FCFA</p>
      `
    })
    
    // Email to client
    await transporter.sendMail({
      from: process.env.GMAIL_EMAIL,
      to: quote.clientEmail,
      subject: 'Votre demande de devis reçue',
      html: `
        <h2>Merci pour votre demande!</h2>
        <p>Votre demande de devis <strong>${quote.quoteNumber}</strong> a été reçue.</p>
        <p>Ousmane vous répondra sous 24 heures.</p>
        <p>Montant estimé: <strong>${quote.totalTTC.toLocaleString('fr-FR')} FCFA</strong></p>
      `
    })
  })
