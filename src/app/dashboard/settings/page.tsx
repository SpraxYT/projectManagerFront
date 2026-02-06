'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { getRoleLabel } from '@/lib/utils';
import { api } from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function SettingsPage() {
  const { user, loadUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });

  // Synchroniser profileData avec user
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [instanceData, setInstanceData] = useState({
    instanceName: '',
    enableRegistration: true,
    enableGoogleAuth: false,
    maintenanceMode: false,
    maintenanceMessage: '',
  });

  // Charger les paramètres de l'instance
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await api.getSettings();
        if (response.settings) {
          setInstanceData({
            instanceName: response.settings.instanceName,
            enableRegistration: response.settings.enableRegistration,
            enableGoogleAuth: response.settings.enableGoogleAuth,
            maintenanceMode: response.settings.maintenanceMode,
            maintenanceMessage: response.settings.maintenanceMessage || '',
          });
        }
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres:', error);
      }
    };
    loadSettings();
  }, []);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await api.updateUser(user!.id, profileData);
      await loadUser();
      setMessage('Profil mis à jour avec succès');
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage(error.error || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    try {
      await api.updateUser(user!.id, {
        password: passwordData.newPassword,
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMessage('Mot de passe mis à jour avec succès');
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage(error.error || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handleInstanceUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await api.updateSettings(instanceData);
      setMessage('Paramètres de l\'instance mis à jour avec succès');
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage(error.error || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profil', icon: '👤' },
    { id: 'security', name: 'Sécurité', icon: '🔒' },
    { id: 'instance', name: 'Instance', icon: '⚙️' },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
        <p className="mt-2 text-gray-600">
          Gérez vos préférences et paramètres du compte
        </p>
      </div>

      {/* Horizontal Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center space-x-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }
              `}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'profile' && (
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Informations du profil</h2>
            
            {message && (
              <div className={`mb-4 rounded-lg p-3 text-sm ${
                message.includes('succès') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {message}
              </div>
            )}

            <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold text-white">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </div>
                  <div>
                    <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
                      Changer la photo
                    </button>
                    <p className="mt-1 text-xs text-gray-500">JPG, PNG. Max 2MB</p>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <Input
                    label="Prénom"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                    required
                  />

                  <Input
                    label="Nom"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                    required
                  />

                  <div className="md:col-span-2">
                    <Input
                      label="Email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Input
                      label="Rôle"
                      value={user?.role ? getRoleLabel(user.role) : ''}
                      disabled
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setProfileData({
                      firstName: user?.firstName || '',
                      lastName: user?.lastName || '',
                      email: user?.email || '',
                    })}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                </div>
              </form>
            </div>
        )}

        {activeTab === 'security' && (
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Sécurité</h2>
            
            {message && (
              <div className={`mb-4 rounded-lg p-3 text-sm ${
                message.includes('succès') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {message}
              </div>
            )}

            <form onSubmit={handlePasswordUpdate} className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4">Changer le mot de passe</h3>
                <div className="space-y-4">
                  <Input
                    label="Mot de passe actuel"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    required
                  />

                  <Input
                    label="Nouveau mot de passe"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    required
                  />

                  <Input
                    label="Confirmer le nouveau mot de passe"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Enregistrement...' : 'Changer le mot de passe'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'instance' && (
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Paramètres de l'instance</h2>
            
            {message && (
              <div className={`mb-4 rounded-lg p-3 text-sm ${
                message.includes('succès') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {message}
              </div>
            )}

            <form onSubmit={handleInstanceUpdate} className="space-y-6">
              <div>
                <Input
                  label="Nom de l'instance"
                  value={instanceData.instanceName}
                  onChange={(e) => setInstanceData({ ...instanceData, instanceName: e.target.value })}
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Ce nom apparaît dans la barre latérale et les emails
                </p>
              </div>

              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={instanceData.enableRegistration}
                    onChange={(e) => setInstanceData({ ...instanceData, enableRegistration: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Autoriser l'inscription publique</span>
                </label>
                <p className="ml-7 mt-1 text-xs text-gray-500">
                  Les utilisateurs peuvent créer un compte sans invitation
                </p>
              </div>

              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={instanceData.enableGoogleAuth}
                    onChange={(e) => setInstanceData({ ...instanceData, enableGoogleAuth: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Authentification Google</span>
                </label>
                <p className="ml-7 mt-1 text-xs text-gray-500">
                  Permettre la connexion via Google (nécessite une configuration OAuth)
                </p>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Mode maintenance</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={instanceData.maintenanceMode}
                        onChange={(e) => setInstanceData({ ...instanceData, maintenanceMode: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Activer le mode maintenance</span>
                    </label>
                    <p className="ml-7 mt-1 text-xs text-gray-500">
                      Seuls les administrateurs pourront accéder à l'application
                    </p>
                  </div>

                  {instanceData.maintenanceMode && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message de maintenance
                      </label>
                      <textarea
                        value={instanceData.maintenanceMessage}
                        onChange={(e) => setInstanceData({ ...instanceData, maintenanceMessage: e.target.value })}
                        rows={3}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Message affiché aux utilisateurs pendant la maintenance..."
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={async () => {
                    try {
                      const response = await api.getSettings();
                      if (response.settings) {
                        setInstanceData({
                          instanceName: response.settings.instanceName,
                          enableRegistration: response.settings.enableRegistration,
                          enableGoogleAuth: response.settings.enableGoogleAuth,
                          maintenanceMode: response.settings.maintenanceMode,
                          maintenanceMessage: response.settings.maintenanceMessage || '',
                        });
                      }
                    } catch (error) {
                      console.error('Erreur:', error);
                    }
                  }}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
