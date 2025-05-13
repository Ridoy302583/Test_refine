import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useStore } from '@nanostores/react';
import { logStore } from '~/lib/stores/logs';
import { classNames } from '~/utils/classNames';
import {
  vercelConnectionStore,
  isConnecting,
  isFetchingStats,
  updateVercelConnection,
  fetchVercelStats,
  refreshAllVercelData,
  deleteVercel,
  saveVercelConnectionToDB,
} from '~/lib/stores/vercel';
import { Input } from '~/components/ui/Input';
import { GradientIconBox } from '~/components/ui/GradientIconBox';
import { Button } from '~/components/ui/Button';
import useUser from '~/types/user';

interface VercelConnectionProps {
  setVercelConnection?: (connection: boolean) => void;
}

export default function VercelConnection({ setVercelConnection }: VercelConnectionProps) {
  const connection = useStore(vercelConnectionStore);
  const connecting = useStore(isConnecting);
  const { getStoredToken } = useUser();
  const user_token = getStoredToken();

  useEffect(() => {
    const fetchProjects = async () => {
      if (connection.user && connection.token) {
        await fetchVercelStats(connection.token);
      }
    };
    fetchProjects();
  }, [connection.user, connection.token]);

  const handleConnect = async (event: React.FormEvent) => {
    event.preventDefault();
    isConnecting.set(true);
    if (user_token) {
      try {
        const response = await fetch('https://api.vercel.com/v2/user', {
          headers: {
            Authorization: `Bearer ${connection.token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Invalid token or unauthorized');
        }

        const userData = (await response.json()) as any;
        updateVercelConnection({
          user: userData.user || userData,
          token: connection.token,
        });
        await saveVercelConnectionToDB(user_token,connection.token)
        await fetchVercelStats(connection.token);
        refreshAllVercelData(user_token);
        toast.success('Successfully connected to Vercel');
      } catch (error) {
        console.error('Auth error:', error);
        logStore.logError('Failed to authenticate with Vercel', { error });
        toast.error('Failed to connect to Vercel');
        updateVercelConnection({ user: null, token: '' });
      } finally {
        isConnecting.set(false);
      }
    }
  };

  const handleDisconnect = async () => {
    if (!user_token) return;
    try {
      const result = await deleteVercel(user_token);
      if (result) {
        updateVercelConnection({ user: null, token: '', stats: undefined });
        refreshAllVercelData(user_token);
      }
    } catch (error) {
      console.error('Error disconnecting from Vercel:', error);
    }
  };

  return (
    <motion.div
      className="bg-transparent rounded-lg border border-alpha-white-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <GradientIconBox iconClassName="i-material-icon-theme:vercel text-xl" />
            <div>
              <h3 className="text-lg font-medium text-white">Connection Settings</h3>
              <p className="text-sm text-gray-400">Configure your Vercel connection</p>
            </div>
          </div>
        </div>

        {!connection.user ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Personal Access Token</label>
              <Input
                type="password"
                value={connection.token}
                onChange={(e) => updateVercelConnection({ ...connection, token: e.target.value })}
                disabled={connecting}
                placeholder="Enter your Vercel personal access token"
                className={classNames('w-full bg-transparent border border-alpha-white-10 outline-none focus:outline-none text-gray-200', {
                  'border-red-500': false,
                })}
              />
              <div className="mt-2 text-sm text-gray-400">
                <a
                  href="https://vercel.com/account/tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline inline-flex items-center gap-1"
                >
                  Get your token
                  <div className="i-ph:arrow-square-out w-4 h-4" />
                </a>
              </div>
            </div>

            <Button
              onClick={handleConnect}
              variant="default"
              disabled={connecting || !connection.token}
              className={`relative flex justify-center items-center p-3.5 rounded-md text-white font-medium text-base transition-all duration-300 gap-2
                ${connecting ? 'bg-gray-700 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 cursor-pointer'}
                overflow-hidden group shadow-lg shadow-blue-900/20`}
            >
              {connecting ? (
                <>
                  <div className="i-ph:spinner-gap animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <div className="i-ph:plug-charging w-4 h-4" />
                  Connect to Vercel
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className='w-full'>
            {connection.user && (
              <div className="border-t border-alpha-white-10 pt-6">
                <div className="flex items-center gap-4 p-4 bg-transparent border border-alpha-white-10 rounded-lg mb-4">
                  <img
                    src={`https://vercel.com/api/www/avatar?u=${connection.user?.username || connection.user?.user?.username}`}
                    alt={connection.user.username}
                    className="w-12 h-12 rounded-full border-2 border-pink-500"
                    crossOrigin='anonymous'
                    referrerPolicy='no-referrer'
                  />
                  <div>
                    <h4 className="text-sm font-medium text-white">
                      {connection.user?.username || connection.user?.user?.username || 'Vercel User'}
                    </h4>
                    <p className="text-sm text-gray-400">
                      {connection.user?.email || connection.user?.user?.email || 'No email available'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="flex flex-col w-full gap-4 mt-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => window.open('https://vercel.com/', '_blank', 'noopener,noreferrer')}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <div className="i-hugeicons:dashboard-square-02 w-4 h-4" />
                  Dashboard
                </Button>
                <Button onClick={handleDisconnect} variant="destructive" size="sm" className="flex items-center gap-2">
                  <div className="i-ph:sign-out w-4 h-4" />
                  Disconnect
                </Button>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div className="i-ph:check-circle w-4 h-4 text-bolt-elements-icon-success dark:text-bolt-elements-icon-success" />
                    <span className="text-sm text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary">
                      Connected to Vercel
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
