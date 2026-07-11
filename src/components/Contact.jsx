import { useState, useCallback } from 'react'
import { Phone, Mail, MapPin, MessageCircle } from 'lucide-react'

export default function Contact() {
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    telephone: '',
    sujet: '',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Gestion du changement de champ avec validation en temps réel
  const handleChange = useCallback((e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    validateField(name, value)
  }, [])

  // Fonction de validation simple et fiable
  const validateField = useCallback((name, value) => {
    // Supprimer les espaces en début/fin pour éviter les erreurs dues aux espaces accidentels
    const trimmed = value.trim()

    // Règles de validation pour chaque champ
    let errorMessage = ""

   if (name === "nom") {
  // Nom : juste requis (pas vide après trim) - ACCEPTE TOUS LES NOMS FRANÇAIS
  if (!trimmed) errorMessage = "Ce champ est requis"
  // ACCEPTE TOUT LE RESTE : Jean-Pierre, O'Neil, Marie Louise, René, Zoé, etc.
} else if (name === "email") {

      if (!trimmed) errorMessage = "Ce champ est requis"
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) errorMessage = "Email invalide"
    }
    else if (name === "telephone") {
      // Téléphone optionnel, mais si rempli doit être valide
      if (trimmed && !/^[\d\s\+\-\(\)]+$/.test(trimmed)) {
        errorMessage = "Numéro invalide (chiffres, espaces, +, -, (, ) seulement)"
      }
    }
    else if (name === "sujet") {
      if (!trimmed) errorMessage = "Ce champ est requis"
      else if (trimmed.length < 5) errorMessage = "Sujet trop court (minimum 5 caractères)"
    }
    else if (name === "message") {
      if (!trimmed) errorMessage = "Ce champ est requis"
      else if (trimmed.length < 10) errorMessage = "Message trop court (minimum 10 caractères)"
    }

    // Mettre à jour l'état des erreurs
    setErrors(prev => ({ ...prev, [name]: errorMessage }))
    return errorMessage === "" // Retourner true si pas d'erreur
  }, [])

  // Gestion de la soumission du formulaire
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Valider TOUS les champs avant soumission
    const isFormValid = Object.keys(formData).every(key =>
      validateField(key, formData[key])
    )

    if (isFormValid) {
      try {
        // Simulation d'envoi (à remplacer par votre véritable appel API/Firebase)
        await new Promise(resolve => setTimeout(resolve, 1500))

        // Réinitialiser le formulaire après succès
        setSubmitted(true)
        setFormData({
          nom: '',
          email: '',
          telephone: '',
          sujet: '',
          message: ''
        })
        setErrors({}) // Effacer les erreurs
      } catch (error) {
        console.error("Erreur d'envoi:", error)
        alert("Une erreur est survenue. Veuillez réessayer.")
      }
    }

    setIsSubmitting(false)
  }, [formData, validateField])

  return (
    <section id="contact" className="py-20 px-6 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-5xl font-bold text-center mb-16 text-[#1A3FA0]">
          Parlons de Votre Projet
        </h2>

        {/* Sections infos (inchangées) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-xl shadow-lg text-center hover:shadow-xl transition animate-fade-in">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
                <Phone size={26} strokeWidth={2} className="text-[#1A3FA0]" />
              </div>
            </div>
            <h3 className="font-bold text-[#1A3FA0] mb-2 text-lg">Téléphone</h3>
            <a href="tel:+221777085092" className="text-gray-600 hover:text-[#F2C200] font-bold">
              +221 77 708 50 92
            </a>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg text-center hover:shadow-xl transition animate-fade-in">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
                <Mail size={26} strokeWidth={2} className="text-[#1A3FA0]" />
              </div>
            </div>
            <h3 className="font-bold text-[#1A3FA0] mb-2 text-lg">Email</h3>
            <a href="mailto:Unicplaquiste@gmail.com" className="text-gray-600 hover:text-[#F2C200] font-bold">
              Unicplaquiste@gmail.com
            </a>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg text-center hover:shadow-xl transition animate-fade-in">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
                <MapPin size={26} strokeWidth={2} className="text-[#1A3FA0]" />
              </div>
            </div>
            <h3 className="font-bold text-[#1A3FA0] mb-2 text-lg">Localisation</h3>
            <p className="text-gray-600 font-bold">Guelle Tapée, Dakar</p>
          </div>
        </div>

        {/* Formulaire de contact amélioré */}
        <div className="bg-gradient-to-br from-[#1A3FA0] to-[#0D1B4B] rounded-2xl p-10 text-white">
          <h3 className="text-2xl font-bold mb-8 text-center">Envoyez-nous un message</h3>

          {submitted && (
            <div className="mb-6 p-4 bg-green-500 text-white rounded-lg text-center font-bold animate-fade-in">
              Merci! Nous vous répondrons très bientôt.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Champs du formulaire */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input
                type="text"
                name="nom"
                placeholder="Votre nom"
                value={formData.nom}
                onChange={handleChange}
                className="bg-white bg-opacity-10 border border-white border-opacity-30 rounded-lg px-6 py-4 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F2C200] transition"
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Votre email"
                value={formData.email}
                onChange={handleChange}
                className="bg-white bg-opacity-10 border border-white border-opacity-30 rounded-lg px-6 py-4 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F2C200] transition"
                required
              />
            </div>

            <input
              type="tel"
              name="telephone"
              placeholder="Téléphone (optionnel)"
              value={formData.telephone}
              onChange={handleChange}
              className="w-full bg-white bg-opacity-10 border border-white border-opacity-30 rounded-lg px-6 py-4 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F2C200] transition"
            />

            <input
              type="text"
              name="sujet"
              placeholder="Sujet du projet"
              value={formData.sujet}
              onChange={handleChange}
              className="w-full bg-white bg-opacity-10 border border-white border-opacity-30 rounded-lg px-6 py-4 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F2C200] transition"
              required
            />

            <textarea
              name="message"
              placeholder="Décrivez votre projet en détail..."
              value={formData.message}
              onChange={handleChange}
              rows="6"
              className="w-full bg-white bg-opacity-10 border border-white border-opacity-30 rounded-lg px-6 py-4 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F2C200] transition"
              required
            />

            {/* Affichage des erreurs sous chaque champ */}
            {errors.nom && <p className="text-red-500 text-sm mt-1">{errors.nom}</p>}
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            {errors.telephone && <p className="text-red-500 text-sm mt-1">{errors.telephone}</p>}
            {errors.sujet && <p className="text-red-500 text-sm mt-1">{errors.sujet}</p>}
            {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message}</p>}

            {/* Boutons d'action */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting || Object.values(errors).some(error => error !== "")}
                className={`flex-1 bg-[#F2C200] text-[#1A3FA0] py-4 rounded-lg font-bold text-lg
                  hover:bg-yellow-400 transition transform hover:scale-105
                  ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}
                  ${Object.values(errors).some(error => error !== "") ? 'opacity-50' : ''}`}
              >
                {isSubmitting ? 'Envoi en cours...' : 'Envoyer ma demande'}
              </button>
              <a
                href="https://wa.me/221777085092"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-green-500 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-600 transition flex items-center justify-center gap-2"
              >
                <MessageCircle size={20} /> WhatsApp
              </a>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}