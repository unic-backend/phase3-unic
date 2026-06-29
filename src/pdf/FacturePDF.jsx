import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import { BLEU, OR, NOIR, GRIS_TEXTE, INFOS_ENTREPRISE } from './brand'
import logo from '../assets/logo-pdf.png'

const s = StyleSheet.create({
  page: { padding: 36, fontSize: 9, fontFamily: 'Helvetica', color: NOIR },
  enteteRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  enteteGauche: { flexDirection: 'row', gap: 10 },
  logo: { width: 64, height: 64 },
  titre: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: BLEU },
  sousTitre: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: OR, marginBottom: 4 },
  infoLigne: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: GRIS_TEXTE, marginBottom: 1 },
  docTypeTitre: { fontSize: 24, fontFamily: 'Helvetica-Bold', color: BLEU, textAlign: 'right' },
  docNumero: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: BLEU, textAlign: 'right', marginTop: 2 },
  separateurOr: { height: 3, backgroundColor: OR, marginTop: 10, marginBottom: 12 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  metaLabel: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: BLEU, marginBottom: 2 },
  metaTexte: { fontSize: 9, fontFamily: 'Helvetica-Bold', marginBottom: 1 },
  metaTexteDroite: { fontSize: 9, fontFamily: 'Helvetica-Bold', marginBottom: 1, textAlign: 'right' },
  bandeauBleu: { backgroundColor: BLEU, paddingVertical: 5, paddingHorizontal: 8, marginBottom: 6 },
  bandeauTexte: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },
  corpsTexte: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: GRIS_TEXTE, marginBottom: 8, lineHeight: 1.4 },
  sousSection: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: BLEU, marginBottom: 3, marginTop: 6 },
  puce: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: GRIS_TEXTE, marginBottom: 2, paddingLeft: 10, lineHeight: 1.3 },
  tableEnteteRow: { flexDirection: 'row', backgroundColor: BLEU },
  tableEnteteCell: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#FFFFFF', paddingVertical: 5, paddingHorizontal: 6 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#DDDDDD' },
  tableCell: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: NOIR, paddingVertical: 4, paddingHorizontal: 6 },
  bandeauTotal: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: OR, paddingVertical: 8, paddingHorizontal: 10, marginTop: 8, marginBottom: 14 },
  bandeauTotalLabel: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: BLEU },
  bandeauTotalValeur: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: BLEU },
  texteFinal: { fontSize: 9, fontFamily: 'Helvetica-BoldOblique', color: BLEU, marginTop: 16 },
  signatureRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  signatureCol: { width: '45%' },
  signatureNom: { fontSize: 9, fontFamily: 'Helvetica-Bold', marginBottom: 6 },
  signatureImage: { width: 110, height: 45, marginBottom: 4 },
  signatureLigne: { fontSize: 9, fontFamily: 'Helvetica-Bold', marginBottom: 8 },
})

function Entete({ numero }) {
  return (
    <>
      <View style={s.enteteRow}>
        <View style={s.enteteGauche}>
          <Image src={logo} style={s.logo} />
          <View>
            <Text style={s.titre}>UniC Plaquiste</Text>
            <Text style={s.sousTitre}>Renovation & Decoration</Text>
            {INFOS_ENTREPRISE.map((ligne, i) => <Text key={i} style={s.infoLigne}>{ligne}</Text>)}
          </View>
        </View>
        <View>
          <Text style={s.docTypeTitre}>FACTURE</Text>
          <Text style={s.docNumero}>N° {numero}</Text>
        </View>
      </View>
      <View style={s.separateurOr} />
    </>
  )
}

function formaterNombre(n) {
  return Math.round(Number(n) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

function fmtFCFA(n) {
  return `${formaterNombre(n)} FCFA`
}

export default function FacturePDF({ facture }) {
  const lignes = facture.lignesMateriaux && facture.lignesMateriaux.length > 0
    ? facture.lignesMateriaux
    : [{ designation: facture.designation || 'Prestation UniC Plaquiste', prixUnitaire: facture.amount || 0, quantite: 1, prixTotal: facture.amount || 0 }]
  const total = lignes.reduce((sum, l) => sum + (Number(l.prixTotal) || 0), 0)

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Entete numero={facture.invoiceNumber} />

        <View style={s.metaRow}>
          <View>
            <Text style={s.metaLabel}>CLIENT</Text>
            <Text style={s.metaTexte}>{facture.clientNom || facture.clientEmail || 'Client'}</Text>
            {facture.localisation && <Text style={s.metaTexte}>Lieu du chantier : {facture.localisation}</Text>}
          </View>
          <View>
            <Text style={s.metaTexteDroite}>Date : {facture.dateAffichee}</Text>
            <Text style={s.metaTexteDroite}>N° Facture : {facture.invoiceNumber}</Text>
          </View>
        </View>

        <View style={s.bandeauBleu}><Text style={s.bandeauTexte}>Objet de la facture</Text></View>
        <Text style={s.corpsTexte}>{facture.designation || 'Prestation UniC Plaquiste.'}</Text>

        <Text style={s.sousSection}>Notre engagement qualite :</Text>
        <Text style={s.corpsTexte}>
          UniC Plaquiste s'engage a realiser un travail propre, precis et soigne du debut a la fin du chantier. Chaque etape est executee par une equipe experimentee, dans le respect des regles de l'art, pour garantir une finition premium, des lignes nettes et un rendu impeccable a la hauteur de vos attentes.
        </Text>
        <Text style={s.puce}>• Travail propre et chantier maintenu en ordre du debut a la fin.</Text>
        <Text style={s.puce}>• Finition premium : surfaces lisses et pose soignee.</Text>
        <Text style={s.puce}>• Materiaux de qualite et savoir-faire professionnel.</Text>
        <Text style={s.puce}>• Respect des delais et satisfaction garantie.</Text>

        <View style={s.bandeauBleu}><Text style={s.bandeauTexte}>Detail de la prestation</Text></View>
        <View style={s.tableEnteteRow}>
          <Text style={[s.tableEnteteCell, { width: '46%' }]}>Designation</Text>
          <Text style={[s.tableEnteteCell, { width: '18%', textAlign: 'right' }]}>Prix Unitaire</Text>
          <Text style={[s.tableEnteteCell, { width: '14%', textAlign: 'right' }]}>Quantite</Text>
          <Text style={[s.tableEnteteCell, { width: '22%', textAlign: 'right' }]}>Prix Total</Text>
        </View>
        {lignes.map((l, i) => (
          <View key={i} style={s.tableRow}>
            <Text style={[s.tableCell, { width: '46%' }]}>{l.designation}</Text>
            <Text style={[s.tableCell, { width: '18%', textAlign: 'right' }]}>{formaterNombre(l.prixUnitaire)}</Text>
            <Text style={[s.tableCell, { width: '14%', textAlign: 'right' }]}>{l.quantite}</Text>
            <Text style={[s.tableCell, { width: '22%', textAlign: 'right' }]}>{fmtFCFA(l.prixTotal)}</Text>
          </View>
        ))}

        <View style={s.bandeauTotal}>
          <Text style={s.bandeauTotalLabel}>MONTANT TOTAL TTC</Text>
          <Text style={s.bandeauTotalValeur}>{fmtFCFA(total)}</Text>
        </View>

        <Text style={s.sousSection}>Modalites de paiement :</Text>
        {facture.modalitesPaiement
          ? facture.modalitesPaiement.split('\n').filter(Boolean).map((ligne, i) => <Text key={i} style={s.puce}>• {ligne}</Text>)
          : <Text style={s.puce}>• A definir avec le client.</Text>}

        <Text style={[s.corpsTexte, { marginTop: 8 }]}>
          Coordonnees de paiement : +221 77 708 50 92 (au nom de UniC Plaquiste).
        </Text>

        <View style={s.signatureRow}>
          <View style={s.signatureCol}>
            <Text style={s.signatureNom}>UniC Plaquiste</Text>
            {facture.signatureAdmin && <Image src={facture.signatureAdmin} style={s.signatureImage} />}
            <Text style={s.signatureLigne}>Signature : {facture.signatureAdmin ? '' : '___________________'}</Text>
            <Text style={s.signatureLigne}>Date : {facture.dateAffichee}</Text>
          </View>
          <View style={s.signatureCol}>
            <Text style={s.signatureNom}>Client ({facture.clientNom || facture.clientEmail || ''})</Text>
            <Text style={s.signatureLigne}>Signature : ___________________</Text>
            <Text style={s.signatureLigne}>Date : ___________________</Text>
          </View>
        </View>

        <Text style={s.texteFinal}>UniC Plaquiste vous remercie de votre confiance.</Text>
      </Page>
    </Document>
  )
}
