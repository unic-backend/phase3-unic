import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import { BLEU, OR, NOIR, GRIS_TEXTE, INFOS_ENTREPRISE } from './brand'
import logo from '../assets/logo-pdf.png'

const s = StyleSheet.create({
  page: { padding: 36, fontSize: 9, fontFamily: 'Helvetica', color: NOIR },

  // ---- En-tête ----
  enteteRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  enteteGauche: { flexDirection: 'row', gap: 10 },
  logo: { width: 64, height: 64 },
  titre: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: BLEU },
  sousTitre: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: OR, marginBottom: 4 },
  infoLigne: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: GRIS_TEXTE, marginBottom: 1 },
  docTypeTitre: { fontSize: 24, fontFamily: 'Helvetica-Bold', color: BLEU, textAlign: 'right' },
  docNumero: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: BLEU, textAlign: 'right', marginTop: 2 },
  separateurOr: { height: 3, backgroundColor: OR, marginTop: 10, marginBottom: 12 },

  // ---- Client / Meta ----
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  metaLabel: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: BLEU, marginBottom: 2 },
  metaTexte: { fontSize: 9, fontFamily: 'Helvetica-Bold', marginBottom: 1 },
  metaTexteDroite: { fontSize: 9, fontFamily: 'Helvetica-Bold', marginBottom: 1, textAlign: 'right' },

  // ---- Bandeaux de section ----
  bandeauBleu: { backgroundColor: BLEU, paddingVertical: 5, paddingHorizontal: 8, marginBottom: 6 },
  bandeauTexte: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },

  corpsTexte: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: GRIS_TEXTE, marginBottom: 8, lineHeight: 1.4 },
  sousSection: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: BLEU, marginBottom: 3, marginTop: 6 },
  puce: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: GRIS_TEXTE, marginBottom: 2, paddingLeft: 10, lineHeight: 1.3 },

  // ---- Tableaux ----
  tableEnteteRow: { flexDirection: 'row', backgroundColor: BLEU },
  tableEnteteCell: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#FFFFFF', paddingVertical: 5, paddingHorizontal: 6 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#DDDDDD' },
  tableCell: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: NOIR, paddingVertical: 4, paddingHorizontal: 6 },
  tableTotalRow: { flexDirection: 'row', backgroundColor: BLEU },
  tableTotalCell: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#FFFFFF', paddingVertical: 5, paddingHorizontal: 6 },

  // ---- Totaux ----
  totauxLigne: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  totauxLabel: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: BLEU },
  totauxValeur: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: BLEU },
  bandeauTotal: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: OR, paddingVertical: 8, paddingHorizontal: 10, marginTop: 8, marginBottom: 14 },
  bandeauTotalLabel: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: BLEU },
  bandeauTotalValeur: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: BLEU },

  noteItalique: { fontSize: 8, fontFamily: 'Helvetica-BoldOblique', color: GRIS_TEXTE, marginTop: 6, marginBottom: 10, lineHeight: 1.3 },

  // ---- Signatures ----
  signatureRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  signatureCol: { width: '45%' },
  signatureNom: { fontSize: 9, fontFamily: 'Helvetica-Bold', marginBottom: 6 },
  signatureImage: { width: 110, height: 45, marginBottom: 4 },
  signatureLigne: { fontSize: 9, fontFamily: 'Helvetica-Bold', marginBottom: 8 },
})

function Entete({ typeDoc, numero }) {
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
          <Text style={s.docTypeTitre}>{typeDoc}</Text>
          <Text style={s.docNumero}>N° {numero}</Text>
        </View>
      </View>
      <View style={s.separateurOr} />
    </>
  )
}

function Bandeau({ texte }) {
  return <View style={s.bandeauBleu}><Text style={s.bandeauTexte}>{texte}</Text></View>
}

function formaterNombre(n) {
  return Math.round(Number(n) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

function fmtFCFA(n) {
  return `${formaterNombre(n)} FCFA`
}

export default function DevisPDF({ devis }) {
  const lignes = devis.lignesMateriaux && devis.lignesMateriaux.length > 0
    ? devis.lignesMateriaux
    : [{ designation: devis.type || 'Prestation', prixUnitaire: devis.pricePerM2 || 0, quantite: devis.surface || 1, prixTotal: devis.totalTTC || 0 }]
  const totalMateriaux = lignes.reduce((sum, l) => sum + (Number(l.prixTotal) || 0), 0)

  // Compatibilité : anciens devis enregistrés avec un seul forfait (forfaitMainOeuvre)
  // au lieu du tableau lignesMainOeuvre.
  const lignesMainOeuvre = devis.lignesMainOeuvre && devis.lignesMainOeuvre.length > 0
    ? devis.lignesMainOeuvre
    : (devis.forfaitMainOeuvre?.montant ? [devis.forfaitMainOeuvre] : [])
  const totalMainOeuvre = lignesMainOeuvre.reduce((sum, l) => sum + (Number(l.montant) || 0), 0)
  const totalGeneral = totalMateriaux + totalMainOeuvre

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Entete typeDoc="DEVIS" numero={devis.quoteNumber} />

        <View style={s.metaRow}>
          <View>
            <Text style={s.metaLabel}>CLIENT</Text>
            <Text style={s.metaTexte}>{devis.clientNom || devis.clientEmail || 'Client'}</Text>
            <Text style={s.metaTexte}>Lieu du chantier : {devis.localisation || 'Dakar'}</Text>
          </View>
          <View>
            <Text style={s.metaTexteDroite}>Date : {devis.dateAffichee}</Text>
            <Text style={s.metaTexteDroite}>N° Devis : {devis.quoteNumber}</Text>
            <Text style={s.metaTexteDroite}>Validite : 15 jours</Text>
          </View>
        </View>

        <Bandeau texte="Objet du devis" />
        <Text style={s.corpsTexte}>{devis.description || devis.title || 'Prestation UniC Plaquiste.'}</Text>

        <Bandeau texte="Tableau 1 - Materiaux (a la charge du client)" />
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
        <View style={s.tableTotalRow}>
          <Text style={[s.tableTotalCell, { width: '78%' }]}>Total Materiaux</Text>
          <Text style={[s.tableTotalCell, { width: '22%', textAlign: 'right' }]}>{fmtFCFA(totalMateriaux)}</Text>
        </View>

        {lignesMainOeuvre.length > 0 && (
          <>
            <View style={{ marginTop: 12 }} />
            <Bandeau texte="Tableau 2 - Main-d'oeuvre (forfait UniC Plaquiste)" />
            <View style={s.tableEnteteRow}>
              <Text style={[s.tableEnteteCell, { width: '78%' }]}>Designation</Text>
              <Text style={[s.tableEnteteCell, { width: '22%', textAlign: 'right' }]}>Montant</Text>
            </View>
            {lignesMainOeuvre.map((l, i) => (
              <View key={i} style={s.tableRow}>
                <Text style={[s.tableCell, { width: '78%' }]}>{l.designation}</Text>
                <Text style={[s.tableCell, { width: '22%', textAlign: 'right' }]}>{fmtFCFA(l.montant)}</Text>
              </View>
            ))}
            <View style={s.tableTotalRow}>
              <Text style={[s.tableTotalCell, { width: '78%' }]}>Total Main-d'oeuvre</Text>
              <Text style={[s.tableTotalCell, { width: '22%', textAlign: 'right' }]}>{fmtFCFA(totalMainOeuvre)}</Text>
            </View>
          </>
        )}

        <View style={s.totauxLigne}>
          <Text style={s.totauxLabel}>Estimation Materiaux (a la charge du client)</Text>
          <Text style={s.totauxValeur}>{fmtFCFA(totalMateriaux)}</Text>
        </View>
        {lignesMainOeuvre.length > 0 && (
          <View style={s.totauxLigne}>
            <Text style={s.totauxLabel}>Forfait Main-d'oeuvre</Text>
            <Text style={s.totauxValeur}>{fmtFCFA(totalMainOeuvre)}</Text>
          </View>
        )}
        <View style={s.bandeauTotal}>
          <Text style={s.bandeauTotalLabel}>MONTANT TOTAL TTC</Text>
          <Text style={s.bandeauTotalValeur}>{fmtFCFA(totalGeneral)}</Text>
        </View>

        <Text style={s.sousSection}>Conditions et modalites</Text>
        <Text style={[s.sousSection, { marginTop: 4 }]}>Conditions importantes :</Text>
        <Text style={s.puce}>• Les materiaux sont a la charge du client. UniC Plaquiste se charge de la commande et de la verification qualitative.</Text>
        <Text style={s.puce}>• Delai d'execution : {devis.urgence || 'a definir avec le client'} (sous reserve de disponibilite du site).</Text>

        {devis.exclusions && (
          <>
            <Text style={s.sousSection}>Ne sont pas inclus :</Text>
            {devis.exclusions.split('\n').filter(Boolean).map((ligne, i) => <Text key={i} style={s.puce}>• {ligne}</Text>)}
          </>
        )}

        <Text style={s.sousSection}>Modalites de paiement :</Text>
        {devis.modalitesPaiement
          ? devis.modalitesPaiement.split('\n').filter(Boolean).map((ligne, i) => <Text key={i} style={s.puce}>• {ligne}</Text>)
          : <Text style={s.puce}>• A definir avec le client avant signature.</Text>}

        <Text style={s.noteItalique}>
          Note : Ce devis est une estimation etablie sur la base des informations communiquees a ce jour. Apres reception des plans detailles, les quantites et le montant definitif pourront etre ajustes si necessaire.
        </Text>

        <View style={s.signatureRow}>
          <View style={s.signatureCol}>
            <Text style={s.signatureNom}>UniC Plaquiste</Text>
            {devis.signatureAdmin && <Image src={devis.signatureAdmin} style={s.signatureImage} />}
            <Text style={s.signatureLigne}>Signature : {devis.signatureAdmin ? '' : '___________________'}</Text>
            <Text style={s.signatureLigne}>Date : {devis.dateAffichee}</Text>
          </View>
          <View style={s.signatureCol}>
            <Text style={s.signatureNom}>Client ({devis.clientNom || devis.clientEmail || ''})</Text>
            <Text style={s.signatureLigne}>Signature : ___________________</Text>
            <Text style={s.signatureLigne}>Date : ___________________</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
