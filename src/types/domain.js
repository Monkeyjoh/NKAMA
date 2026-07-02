/**
 * NKAMA — Types métier (JSDoc).
 *
 * Ces typedefs reflètent le schéma SQL (supabase/schema.sql) et servent de
 * contrat partagé entre services, hooks et composants. Importables via :
 *   `@typedef {import("@/types/domain").Property} Property`
 *
 * Aucune dépendance runtime : ce fichier n'exporte que des types.
 */

/** @typedef {"admin" | "owner" | "agent"} UserRole */
/** @typedef {"studio" | "appartement" | "villa" | "local_commercial"} PropertyType */
/** @typedef {"nouveau" | "visite_prevue" | "dossier_recu" | "refuse" | "signe"} LeadStatut */
/** @typedef {"recommandation" | "annonce" | "agent" | "autre"} LeadSource */
/** @typedef {"electricien" | "plombier" | "macon" | "agent_immobilier" | "gardien" | "autre"} ContractorCategorie */
/** @typedef {"paye" | "en_retard" | "attendu"} PaymentStatut */
/** @typedef {"signale" | "affecte" | "en_cours" | "validation" | "cloture" | "litige"} TicketStatut */
/** @typedef {"electricite" | "plomberie" | "maconnerie" | "autre"} TicketCategorie */
/** @typedef {"urgent" | "normal" | "preventif"} TicketPriorite */
/** @typedef {"maintenance" | "taxes" | "assurance" | "gestion" | "autre"} ExpenseCategorie */
/** @typedef {"en_attente" | "validee" | "rejetee"} ExpenseStatut */
/** @typedef {"tenant" | "property" | "contract" | "ticket"} DocumentEntityType */

/**
 * @typedef {Object} Owner
 * @property {string} id
 * @property {string} nom
 * @property {string} created_at
 */

/**
 * @typedef {Object} AppUser
 * @property {string} id
 * @property {string} [auth_user_id]
 * @property {string} owner_id
 * @property {string} nom
 * @property {string} [telephone]
 * @property {UserRole} role
 * @property {string} created_at
 */

/**
 * @typedef {Object} Property
 * @property {string} id
 * @property {string} owner_id
 * @property {string} nom
 * @property {string} adresse
 * @property {string} quartier
 * @property {PropertyType} type
 * @property {number} [chambres]
 * @property {number} [surface_m2]
 * @property {number} loyer_mensuel
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} Lead
 * @property {string} id
 * @property {string} owner_id
 * @property {string} nom
 * @property {string} telephone
 * @property {string} [whatsapp]
 * @property {string} [email]
 * @property {number} [budget_max]
 * @property {PropertyType} [type_recherche]
 * @property {string} [zone_recherchee]
 * @property {LeadStatut} statut
 * @property {LeadSource} source
 * @property {string} [prochaine_action]
 * @property {string} [prochaine_action_date]
 * @property {boolean} dossier_complet
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} Tenant
 * @property {string} id
 * @property {string} owner_id
 * @property {string} [lead_origin_id]
 * @property {string} nom
 * @property {string} telephone
 * @property {string} [whatsapp]
 * @property {string} [email]
 * @property {string} created_at
 */

/**
 * @typedef {Object} Contractor
 * @property {string} id
 * @property {string} nom
 * @property {string} telephone
 * @property {string} [whatsapp]
 * @property {string} [zone_intervention]
 * @property {ContractorCategorie[]} categories
 * @property {string} created_at
 */

/**
 * @typedef {Object} Contract
 * @property {string} id
 * @property {string} property_id
 * @property {string} tenant_id
 * @property {string} date_debut
 * @property {string} [date_fin]
 * @property {number} loyer_mensuel
 * @property {boolean} actif
 * @property {string} created_at
 */

/**
 * @typedef {Object} Payment
 * @property {string} id
 * @property {string} contract_id
 * @property {string} mois
 * @property {number} montant
 * @property {PaymentStatut} statut
 * @property {string} [date_paiement]
 * @property {string} created_at
 */

/**
 * @typedef {Object} DocumentRef
 * @property {string} id
 * @property {string} owner_id
 * @property {DocumentEntityType} entity_type
 * @property {string} entity_id
 * @property {string} nom_fichier
 * @property {string} storage_path
 * @property {string} [type_fichier]
 * @property {number} [taille_octets]
 * @property {string} [uploaded_by]
 * @property {string} created_at
 */

/**
 * @typedef {Object} MaintenanceTicket
 * @property {string} id
 * @property {string} property_id
 * @property {string} [tenant_id]
 * @property {string} [contractor_id]
 * @property {string} titre
 * @property {string} [description]
 * @property {TicketCategorie} categorie
 * @property {TicketPriorite} priorite
 * @property {TicketStatut} statut
 * @property {string} [photo_avant_doc_id]
 * @property {string} [photo_apres_doc_id]
 * @property {string} [facture_doc_id]
 * @property {number} [montant_facture]
 * @property {boolean} [imputable_locataire]
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} Expense
 * @property {string} id
 * @property {string} owner_id
 * @property {string} [property_id]
 * @property {string} [ticket_id]
 * @property {ExpenseCategorie} categorie
 * @property {number} montant
 * @property {string} [justificatif_doc_id]
 * @property {ExpenseStatut} statut
 * @property {string} [motif_rejet]
 * @property {string} created_at
 */

/**
 * @typedef {Object} ActivityLog
 * @property {string} id
 * @property {string} owner_id
 * @property {string} [auteur_id]
 * @property {string} action_type
 * @property {string} entity_type
 * @property {string} entity_id
 * @property {Object} [valeur_avant]
 * @property {Object} [valeur_apres]
 * @property {string} [motif]
 * @property {string} horodatage
 */

export {};
