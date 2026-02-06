'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { getRoleLabel } from '@/lib/utils';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4 text-sm text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              {process.env.NEXT_PUBLIC_INSTANCE_NAME || 'ProjectManager'}
            </h1>
            <button
              onClick={handleLogout}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-lg bg-white p-6 shadow">
          <h2 className="text-2xl font-bold text-gray-900">
            Bienvenue, {user.firstName} {user.lastName} !
          </h2>
          <p className="mt-2 text-gray-600">
            Rôle : <span className="font-medium">{getRoleLabel(user.role)}</span>
          </p>
          <p className="mt-1 text-sm text-gray-500">Email : {user.email}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Card Utilisateurs */}
          <div className="rounded-lg bg-white p-6 shadow hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Utilisateurs</h3>
              <svg
                className="h-8 w-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Gérer les utilisateurs de l'application
            </p>
            <button className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-500">
              Voir les utilisateurs →
            </button>
          </div>

          {/* Card Rôles */}
          <div className="rounded-lg bg-white p-6 shadow hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Rôles</h3>
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Gérer les rôles et permissions personnalisés
            </p>
            <button className="mt-4 text-sm font-medium text-green-600 hover:text-green-500">
              Voir les rôles →
            </button>
          </div>

          {/* Card Projets (Phase 2) */}
          <div className="rounded-lg bg-white p-6 shadow opacity-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Projets</h3>
              <svg
                className="h-8 w-8 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Disponible dans la Phase 2
            </p>
            <span className="mt-4 inline-block text-sm font-medium text-gray-400">
              Bientôt disponible
            </span>
          </div>
        </div>

        {/* Phase Status */}
        <div className="mt-8 rounded-lg bg-blue-50 p-6">
          <h3 className="text-lg font-semibold text-blue-900">
            Phase 1 : Authentication & Roles ✓
          </h3>
          <p className="mt-2 text-sm text-blue-700">
            Système d'authentification et gestion des rôles actifs
          </p>
          <div className="mt-4 space-y-2 text-sm text-blue-600">
            <p>✓ Inscription / Connexion</p>
            <p>✓ Gestion des utilisateurs</p>
            <p>✓ Rôles personnalisés avec permissions</p>
            <p>✓ Logs d'activité</p>
          </div>
        </div>
      </main>
    </div>
  );
}
