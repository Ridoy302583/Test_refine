//@ts-nocheck
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useStore } from '@nanostores/react';
import { logStore } from '~/lib/stores/logs';
import {
  netlifyConnectionStore,
  isConnecting,
  isFetchingStats,
  isFetchingDeploys,
  updateNetlifyConnection,
  fetchNetlifyStats,
  fetchSiteDeploys,
  initializeNetlifyConnection,
  saveNetlifyConnectionToDB,
  fetchNetlifyConnectionFromDB,
  removeNetlifyConnectionToDB,
} from '~/lib/stores/netlify';
import type { NetlifyUser, NetlifySite, NetlifyDeploy } from '~/types/netlify';
import useUser from '~/types/user';

export function useNetlifyConnection() {
  const connection = useStore(netlifyConnectionStore);
  const connecting = useStore(isConnecting);
  const fetchingStats = useStore(isFetchingStats);
  const fetchingDeploys = useStore(isFetchingDeploys);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [activeSiteIndex, setActiveSiteIndex] = useState(0);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const { getStoredToken } = useUser();
  const user_token = getStoredToken();

  // Initialize on first load - fetch from DB instead of localStorage
  useEffect(() => {
    if(user_token){
      initializeNetlifyConnection(user_token);
    }
  }, [user_token]);

  // Fetch stats if we have a connection but no stats
  useEffect(() => {
    if (connection.user && connection.token && (!connection.stats || !connection.stats.sites)) {
      fetchNetlifyData(connection.token);
    }
  }, [connection.user, connection.token, connection.stats]);

  const fetchNetlifyData = useCallback(async (token: string) => {
    try {
      await fetchNetlifyStats(token);
    } catch (error) {
      console.error('Error fetching Netlify stats:', error);
    }
  }, []);

  const handleConnect = async (tokenInput: string) => {
    if (!tokenInput && !user_token)return;
    isConnecting.set(true);
    try {
      const response = await fetch('https://api.netlify.com/api/v1/user', {
        headers: {
          Authorization: `Bearer ${tokenInput}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const userData = await response.json() as NetlifyUser;

      // Update the connection store
      updateNetlifyConnection({
        user: userData,
        token: tokenInput,
      });
      await saveNetlifyConnectionToDB(user_token, tokenInput);
      await fetchNetlifyData(tokenInput);
      return true;
    } catch (error) {
      console.error('Error connecting to Netlify:', error);
      logStore.logError('Failed to authenticate with Netlify', { error });
      updateNetlifyConnection({ user: null, token: '' });
      return false;
    } finally {
      isConnecting.set(false);
    }
  };

  const selectSite = async (siteId: string) => {
    const currentState = netlifyConnectionStore.get();
    let siteData: NetlifySite | undefined = undefined;

    if (siteId && currentState.stats?.sites) {
      siteData = currentState.stats.sites.find((site) => site.id === siteId);
    }

    updateNetlifyConnection({
      selectedSiteId: siteId,
      site: siteData,
    });

    if (siteId && currentState.token) {
      try {
        await fetchSiteDeploys(siteId, currentState.token);
      } catch (error) {
        console.error('Failed to fetch site deploys:', error);
      }
    } else {
    }
  };

  const handleSiteAction = async (
    siteId: string, 
    actionName: string, 
    action: () => Promise<void>, 
    requiresConfirmation: boolean = false
  ) => {
    if (requiresConfirmation) {
      if (!confirm(`Are you sure you want to ${actionName.toLowerCase()}?`)) {
        return;
      }
    }

    setIsActionLoading(true);
    try {
      await action();
      toast.success(`${actionName} completed successfully`);
      
      // Refresh stats after action
      if (connection.token) {
        await fetchNetlifyData(connection.token);
      }
    } catch (error) {
      console.error(`Failed to ${actionName.toLowerCase()}:`, error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const clearCache = async (siteId: string) => {
    return handleSiteAction(
      siteId,
      'Clear Cache',
      async () => {
        const response = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/cache`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${connection.token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to clear cache');
        }
      }
    );
  };

  const deleteSite = async (siteId: string) => {
    return handleSiteAction(
      siteId,
      'Delete Site',
      async () => {
        const response = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${connection.token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to delete site');
        }
      },
      true // Requires confirmation
    );
  };

  const handleDeploy = async (siteId: string, deployId: string, action: 'lock' | 'unlock' | 'publish') => {
    return handleSiteAction(
      siteId,
      `${action.charAt(0).toUpperCase() + action.slice(1)} Deploy`,
      async () => {
        const endpoint =
          action === 'publish'
            ? `https://api.netlify.com/api/v1/sites/${siteId}/deploys/${deployId}/restore`
            : `https://api.netlify.com/api/v1/deploys/${deployId}/${action}`;

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${connection.token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to ${action} deploy`);
        }
      }
    );
  };

  const handleCreateSite = () => {
    window.open('https://app.netlify.com/start', '_blank');
  };

  return {
    connection,
    connecting,
    fetchingStats,
    fetchingDeploys,
    isStatsOpen,
    setIsStatsOpen,
    activeSiteIndex,
    setActiveSiteIndex,
    isActionLoading,
    handleConnect,
    selectSite,
    clearCache,
    deleteSite,
    handleDeploy,
    handleCreateSite,
    refreshStats: () => connection.token ? fetchNetlifyData(connection.token) : Promise.reject(new Error('No token available')),
    updateToken: async (token: string) => {
      updateNetlifyConnection({ ...connection, token });
      await saveNetlifyConnectionToDB(user_token, token);
    },
    isConnected: !!(connection.user && connection.token),
    sites: connection.stats?.sites || [],
    deploys: connection.stats?.deploys || [],
    builds: connection.stats?.builds || [],
    totalSites: connection.stats?.totalSites || 0,
    lastDeployTime: connection.stats?.lastDeployTime || '',
  };
}