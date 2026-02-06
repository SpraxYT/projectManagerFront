'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, loadUser } = useAuthStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Charger l'utilisateur une seule fois au démarrage
    if (!initialized) {
      loadUser().finally(() => {
        setInitialized(true);
      });
    }
  }, [initialized, loadUser]);

  useEffect(() => {
    // Rediriger une fois l'utilisateur chargé
    if (initialized && !isLoading) {
      if (isAuthenticated) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [isAuthenticated, isLoading, initialized, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]">
          <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
            Chargement...
          </span>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">Chargement...</p>
      </div>
    </div>
  );
}
