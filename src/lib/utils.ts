import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utilitaire pour merger les classes Tailwind
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formater une date
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

/**
 * Formater une date relative (il y a X jours)
 */
export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 7) {
    return formatDate(d);
  } else if (days > 0) {
    return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
  } else if (minutes > 0) {
    return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else {
    return 'À l\'instant';
  }
}

/**
 * Obtenir les initiales d'un nom
 */
export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

/**
 * Traduction des rôles
 */
export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    OWNER: 'Propriétaire',
    ADMIN: 'Administrateur',
    MANAGER: 'Manager',
    MEMBER: 'Membre',
    CUSTOM: 'Personnalisé',
  };
  return labels[role] || role;
}

/**
 * Couleur de badge pour les rôles
 */
export function getRoleColor(role: string): string {
  const colors: Record<string, string> = {
    OWNER: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    ADMIN: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    MANAGER: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    MEMBER: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    CUSTOM: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  };
  return colors[role] || colors.MEMBER;
}
