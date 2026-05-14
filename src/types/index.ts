export interface AdresseDTO {
  id?: number;
  rue?: string;
  codePostal?: string;
  ville?: string;
}

export type Civilite = 'MR' | 'MME' | 'AUTRE';

export interface ClientDTO {
  id?: number;
  civilite?: Civilite;
  nom?: string;
  prenom?: string;
  emailContact?: string;
  telContact?: string;
  adresseFacturation?: AdresseDTO;
  utilisateurId?: number;
}

export interface BureauEtudesDTO {
  id?: number;
  raisonSociale?: string;
  emailContact?: string;
  telContact?: string;
  adresse?: AdresseDTO;
  utilisateurId?: number;
}

export type TypeDemandeDevis = 'G1' | 'G2_AVP' | 'G2_PRO';

export interface DemandeDevisDTO {
  id?: number;
  delaiMax?: string;
  adresseProjet?: AdresseDTO;
  clientId?: number;
  type?: TypeDemandeDevis;
  nombreLot?: number;
  referenceCadastrale?: string;
  superficie?: number;
  description?: string;
  docsDevisId?: number;
}

export type StatutProposition = 'EN_ATTENTE' | 'ACCEPTEE' | 'REFUSEE';

export interface PropositionDevisDTO {
  id?: number;
  bureauEtudeId?: number;
  demandeDevisId?: number;
  delaiMaxIntervention?: number;
  delaiMaxRendu?: number;
  prix?: number;
  documentId?: number;
  statut?: StatutProposition;

  // Relations embarquées (usage front uniquement)
  bureauEtude?: BureauEtudesDTO;
  demandeDevis?: DemandeDevisDTO;
}

export type EtatEtude =
  | 'DEVIS_VALIDE'
  | 'DATE_INTERVENTION_PROPOSEE'
  | 'DATE_INTERVENTION_FIXEE'
  | 'INTERVENTION_EFFECTUEE'
  | 'RAPPORT_TERMINE'
  | 'PAIEMENT_EFFECTUE';

export interface EtudeDTO {
  id?: number;
  propositionDevisId?: number;
  etat?: EtatEtude;
  devisSigneId?: number;
  rapportId?: number;
  chargeAffaire?: string;
  dateIntervention?: string;
  dateRendu?: string;
}

export type StatutDocument = 'ORPHELIN' | 'ATTACHE';

export interface DocumentDTO {
  id?: number;
  nomFichierOriginal?: string;
  /** Nom lisible à afficher à l'utilisateur et à utiliser pour le téléchargement. */
  nomTelechargement?: string;
  typeContenu?: string;
  tailleFichier?: number;
  bucketName?: string;
  statut?: StatutDocument;
  expireAt?: string;
}

export interface AuthResponseDTO {
  token: string;
  userId: number;
  login: string;
  role: 'CLIENT' | 'BUREAU_ETUDE' | 'ADMIN';
}

export type Role = AuthResponseDTO['role'];

// ─── Types enrichis (endpoint /etude/{id}/detail) ────────────────────────────

export interface ClientDetail {
  id?: number;
  civilite?: Civilite;
  nom?: string;
  prenom?: string;
  tel?: string;
  adresseFacturation?: AdresseDTO;
}

export interface BureauEtudesDetail {
  id?: number;
  raisonSociale?: string;
  emailContact?: string;
  telContact?: string;
  adresse?: AdresseDTO;
}

export interface DemandeDevisDetail {
  id?: number;
  delaiMax?: string;
  type?: TypeDemandeDevis;
  nombreLot?: number;
  referenceCadastrale?: string;
  superficie?: number;
  description?: string;
  docsDevisId?: number;
  adresseProjet?: AdresseDTO;
  client?: ClientDetail;
}

export interface PropositionDevisDetail {
  id?: number;
  statut?: StatutProposition;
  prix?: number;
  delaiMaxIntervention?: number;
  delaiMaxRendu?: number;
  devisPdfId?: number;
  bureauEtude?: BureauEtudesDetail;
  demandeDevis?: DemandeDevisDetail;
}

/** Représente un document nommé lié à une étude, prêt à être affiché. */
export interface DocumentRef {
  id: number;
  label: string;
}

export interface EtudeDetailDTO {
  id?: number;
  etat?: EtatEtude;
  chargeAffaire?: string;
  dateIntervention?: string;
  dateRendu?: string;
  devisSigneId?: number;
  rapportId?: number;
  propositionDevis?: PropositionDevisDetail;
}
