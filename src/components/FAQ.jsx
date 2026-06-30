import { useState } from 'react'

export default function FAQ() {
  const [openId, setOpenId] = useState(null)

  const faqs = [
    {
      id: 1,
      q: "Quel est votre délai standard?",
      a: "Notre délai standard est de 2 jours pour un projet de 20m². Le délai varie selon la surface et la complexité du projet."
    },
    {
      id: 2,
      q: "Proposez-vous une garantie?",
      a: "Oui! Nous offrons une garantie de 1 an sur tous nos travaux contre les défauts d'exécution."
    },
    {
      id: 3,
      q: "Travaillez-vous en dehors de Dakar?",
      a: "Oui, nous travaillons partout au Sénégal et même à l'international. Un surcharge s'applique pour les déplacements."
    },
    {
      id: 4,
      q: "Quels matériaux utilisez-vous?",
      a: "Nous utilisons uniquement des matériaux de qualité supérieure (BA13, peinture haut de gamme, etc.) pour assurer la durabilité."
    },
    {
      id: 5,
      q: "Comment obtenir un devis?",
      a: "Vous pouvez utiliser notre calculatrice en ligne ou nous contacter directement pour un devis personnalisé gratuit."
    },
    {
      id: 6,
      q: "Quels modes de paiement acceptez-vous?",
      a: "Nous acceptons les virement bancaires, Wave, Orange Money et les paiements en espèces."
    }
  ]

  return (
    <section id="faq" className="py-20 px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-5xl font-bold text-center mb-4 text-[#1A3FA0]">
          Questions Fréquentes
        </h2>
        <p className="text-center text-gray-600 mb-16 text-lg">
          Trouvez les réponses à vos questions
        </p>

        <div className="space-y-4">
          {faqs.map((faq) => (
            <div key={faq.id} className="border-2 border-gray-200 rounded-lg overflow-hidden hover:border-[#1A3FA0] transition animate-fade-in">
              <button
                onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                className="w-full p-6 text-left bg-gray-50 hover:bg-gray-100 transition flex items-center justify-between font-bold text-[#1A3FA0]"
              >
                <span>{faq.q}</span>
                <span className="text-2xl">{openId === faq.id ? '−' : '+'}</span>
              </button>
              
              {openId === faq.id && (
                <div className="p-6 bg-white border-t-2 border-[#1A3FA0] text-gray-700 animate-fade-in">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
