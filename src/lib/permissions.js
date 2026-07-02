/**
 * NKAMA — Matrice de permissions (RBAC).
 *
 * SOURCE UNIQUE DE VÉRITÉ côté application. Doit rester cohérente avec les
 * politiques RLS (supabase/migrations/0005_rbac.sql) qui, elles, font foi
 * réellement en base. Ici on pilote l'UI (masquer/désactiver).
 *
 * Rôles : "owner" (propriétaire), "admin" (administrateur), "agent".
 */

/** Liste des actions et rôles autorisés (owner est toujours autorisé). */
const MATRIX = {
  // Parc
  "property.create": ["admin"],
  "property.update": ["admin"],
  "property.delete": ["admin"],
  "property.rentOut": ["admin"],

  // Gestion locative
  "tenant.manage": ["admin"],
  "contract.manage": ["admin"],
  "contractor.manage": ["admin"],
  "lead.manage": ["admin"],

  // Finances
  "finance.view": ["admin"],
  "payment.record": ["admin"],
  "expense.create": ["admin"],
  "expense.validate": ["admin"],

  // Pilotage
  "settings.edit": [], // OWNER uniquement
  "control.view": ["admin"],

  // Utilisateurs
  "users.view": ["admin"],
  "users.createAdmin": [], // OWNER uniquement
  "users.createAgent": ["admin"],
  "users.suspend": ["admin"], // agents pour l'admin ; tout pour l'owner
  "users.delete": ["admin"],
  "users.assignProperties": ["admin"],

  // Maintenance
  "ticket.create": ["admin", "agent"],
  "ticket.update": ["admin", "agent"],
  "ticket.close": ["admin"],
  "ticket.delete": ["admin"],
  "ticket.addDocument": ["admin", "agent"],
  "ticket.comment": ["admin", "agent"],
};

/**
 * Indique si un rôle peut réaliser une action.
 * @param {string|null} role
 * @param {string} action
 * @returns {boolean}
 */
export function can(role, action) {
  if (!role) return false;
  if (role === "owner") return true;
  const allowed = MATRIX[action];
  return Array.isArray(allowed) && allowed.includes(role);
}

/**
 * Un acteur peut-il gérer (créer/éditer) un utilisateur d'un rôle donné ?
 * owner → admin/agent ; admin → agent uniquement.
 * @param {string} actorRole @param {string} targetRole
 */
export function canManageUser(actorRole, targetRole) {
  if (actorRole === "owner") return targetRole === "admin" || targetRole === "agent";
  if (actorRole === "admin") return targetRole === "agent";
  return false;
}

/**
 * Un acteur peut-il supprimer/suspendre un utilisateur d'un rôle donné ?
 * (jamais un propriétaire).
 */
export function canActOnUser(actorRole, targetRole) {
  if (targetRole === "owner") return false;
  return canManageUser(actorRole, targetRole);
}

/** Rôles créables par un acteur (pour les listes déroulantes). */
export function creatableRoles(actorRole) {
  if (actorRole === "owner") return ["admin", "agent"];
  if (actorRole === "admin") return ["agent"];
  return [];
}

export const ROLE_LABELS = {
  owner: "Propriétaire",
  admin: "Administrateur",
  agent: "Agent",
};
