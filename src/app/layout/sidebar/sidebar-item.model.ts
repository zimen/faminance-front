/**
 * Modèle pour les items de navigation de la sidebar
 */

export interface SidebarItem {
  label: string;
  icon: string;
  route?: string;
  children?: SidebarItem[];
  badge?: number; // Nombre d'éléments en attente (invitations, notifications)
  expanded?: boolean; // Pour les sections collapsibles
}

export interface SidebarSection {
  title?: string; // Titre de la section (optionnel)
  items: SidebarItem[];
}
