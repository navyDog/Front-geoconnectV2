export interface AdresseDTO {
  id?: number;
  rue?: string;
  codePostal?: string;
  ville?: string;
}

export interface ClientDTO {
  id?: number;
  nom?: string;
  prenom?: string;
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

export interface DemandeDevisDTO {
  id?: number;
  delaiMax?: string;
  adresseProjet?: AdresseDTO;
  clientId?: number;
  // Based on specification:
  typeProjet?: string;
  description?: string;
  dateCreation?: string;
}

export interface PropositionDevisDTO {
  id?: number;
  bureauEtudeId?: number;
  demandeDevisId?: number;
  dateRendu?: string;
  prix?: number;
  cheminDevisPdf?: string;
  refusee?: boolean;
  dateIntervention?: string; // Added from spec
  dateCreation?: string; // Added from spec
  
  // Custom frontend properties to embed relations temporarily
  bureauEtude?: BureauEtudesDTO;
  demandeDevis?: DemandeDevisDTO;
}

export interface EtudeDTO {
  id?: number;
  propositionDevisId?: number;
  etat?: 'DEVIS_VALIDE' | 'DATE_INTERVENTION_PROPOSEE' | 'DATE_INTERVENTION_FIXEE' | 'INTERVENTION_EFFECTUEE' | 'RAPPORT_TERMINE' | 'PAIEMENT_EFFECTUE';
}

export interface AuthResponseDTO {
  token: string;
  userId: number;
  email: string;
  role: 'CLIENT' | 'BUREAU_ETUDE' | 'ADMIN';
}

export type Role = AuthResponseDTO['role'];
