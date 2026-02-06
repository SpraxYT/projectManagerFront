'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const { register, error, clearError } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier si l'inscription est activée
    const checkRegistration = async () => {
      try {
        const response = await api.get('/settings');
        const enabled = response.settings?.enableRegistration ?? true;
        setRegistrationEnabled(enabled);
        
        if (!enabled) {
          // Rediriger vers login si inscription désactivée
          router.push('/login');
        }
      } catch (error) {
        // En cas d'erreur, permettre l'inscription
        setRegistrationEnabled(true);
      } finally {
        setLoading(false);
      }
    };
    checkRegistration();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setIsSubmitting(true);

    try {
      await register(formData);
      router.push('/dashboard');
    } catch (error) {
      // L'erreur est déjà gérée dans le store
    } finally {
      setIsSubmitting(false);
    }
  };

  // Afficher un loader pendant la vérification
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Vérification...</p>
        </div>
      </div>
    );
  }

  // Redirection en cours si inscription désactivée
  if (!registrationEnabled) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            {process.env.NEXT_PUBLIC_INSTANCE_NAME || 'ProjectManager'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Créez votre compte
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-4 rounded-md shadow-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="sr-only">
                  Prénom
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="relative block w-full rounded-md border-0 px-3 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  placeholder="Prénom"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="sr-only">
                  Nom
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="relative block w-full rounded-md border-0 px-3 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  placeholder="Nom"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="relative block w-full rounded-md border-0 px-3 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                placeholder="Email"
              />
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="relative block w-full rounded-md border-0 px-3 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                placeholder="Mot de passe"
              />
              <p className="mt-1 text-xs text-gray-500">
                Minimum 8 caractères, incluant au moins : 1 majuscule, 1 minuscule et 1 chiffre
              </p>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Création...' : 'Créer mon compte'}
            </button>
          </div>

          <div className="text-center text-sm">
            <span className="text-gray-600">Déjà un compte ? </span>
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Se connecter
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
