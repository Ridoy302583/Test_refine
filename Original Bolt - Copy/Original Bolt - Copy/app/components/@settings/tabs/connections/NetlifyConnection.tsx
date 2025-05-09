import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { classNames } from '~/utils/classNames';
import { useStore } from '@nanostores/react';
import { updateNetlifyConnection, initializeNetlifyConnection, removeNetlifyConnectionToDB, refreshAllNetlifyData } from '~/lib/stores/netlify';
import type { NetlifySite, NetlifyDeploy, NetlifyBuild, NetlifyUser } from '~/types/netlify';
import {
  CloudIcon,
  BuildingLibraryIcon,
  ClockIcon,
  CodeBracketIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  ArrowPathIcon,
  LockClosedIcon,
  LockOpenIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';
import { Button } from '~/components/ui/Button';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '~/components/ui/Collapsible';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '~/components/ui/Badge';
import { GradientIconBox } from '~/components/ui/GradientIconBox';
import { Input } from '~/components/ui/Input';
import { useNetlifyConnection } from '~/lib/hooks/useNetlify';
import useUser from '~/types/user';

export default function NetlifyConnection() {
  const {
    connection,
    connecting,
    handleConnect,
  } = useNetlifyConnection();
  const { getStoredToken } = useUser();
  const user_token = getStoredToken();
  const [tokenInput, setTokenInput] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const handleConnectSubmit = async () => {
    const success = await handleConnect(tokenInput);
    if (success) {
      setTokenInput('');
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      if (!user_token) return;
      const result = await removeNetlifyConnectionToDB(user_token);
      if (result) {
        updateNetlifyConnection({ user: null, token: '' });
        setTimeout(() => {
          refreshAllNetlifyData(user_token);
        }, 100);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error disconnecting from Netlify:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 bg-websparks-elements-background dark:bg-websparks-elements-background border border-websparks-elements-borderColor dark:border-websparks-elements-borderColor rounded-lg">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <GradientIconBox iconClassName="i-material-icon-theme:netlify text-xl" />
            <div>
              <h3 className="text-lg font-medium text-websparks-elements-textPrimary">Connection Settings</h3>
              <p className="text-sm text-websparks-elements-textSecondary">Configure your Netlify connection</p>
            </div>
          </div>
        </div>

        {!connection.user ? (
          <div className="mt-4">
            <label className="block text-sm text-websparks-elements-textSecondary dark:text-websparks-elements-textSecondary mb-2">
              API Token
            </label>
            <Input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Enter your Netlify API token"
              className={classNames('w-full bg-transparent border border-alpha-white-10 outline-none focus:outline-none text-gray-200', {
                'border-red-500': false,
              })}
            />
            <div className="mt-2 text-sm text-websparks-elements-textSecondary dark:text-websparks-elements-textSecondary">
              <a
                href="https://app.netlify.com/user/applications#personal-access-tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-websparks-elements-link-text dark:text-websparks-elements-link-text hover:text-websparks-elements-link-textHover dark:hover:text-websparks-elements-link-textHover flex items-center gap-1"
              >
                <div className="i-ph:key w-4 h-4" />
                Get your token
                <div className="i-ph:arrow-square-out w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center justify-between mt-4">
              <Button
                onClick={handleConnectSubmit}
                disabled={connecting || !tokenInput}
                variant="default"
                className={`relative flex justify-center items-center p-3.5 rounded-md text-white font-medium text-base transition-all duration-300 gap-2
                  ${connecting ? 'bg-gray-700 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 cursor-pointer'}
                  overflow-hidden group shadow-lg shadow-blue-900/20`}
              >
                {connecting ? (
                  <>
                    <div className="i-ph:spinner-gap animate-spin w-4 h-4" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <CloudIcon className="w-4 h-4" />
                    Connect to Netlify
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className='w-full'>
            {connection.user && (
              <div className="border-t border-websparks-elements-borderColor dark:border-websparks-elements-borderColor pt-6">
                <div className="flex items-center gap-4 p-4 bg-transparent border border-alpha-white-10 rounded-lg mb-4">
                  <img
                    src={connection.user.avatar_url}
                    alt={connection.user.full_name}
                    className="w-12 h-12 rounded-full border-2 border-websparks-elements-item-contentAccent dark:border-websparks-elements-item-contentAccent"
                    crossOrigin='anonymous'
                    referrerPolicy='no-referrer'
                  />
                  <div>
                    <h4 className="text-sm font-medium text-websparks-elements-textPrimary dark:text-websparks-elements-textPrimary">
                      {connection.user.full_name || "Netlify User"}
                    </h4>
                    <p className="text-sm text-websparks-elements-textSecondary dark:text-websparks-elements-textSecondary">
                      {connection.user.email}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="flex flex-col w-full gap-4 mt-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => window.open('https://app.netlify.com', '_blank', 'noopener,noreferrer')}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <div className="i-hugeicons:dashboard-square-02 w-4 h-4" />
                  Dashboard
                </Button>
                <Button onClick={handleDisconnect} disabled={isLoading} variant="destructive" size="sm" className="flex items-center gap-2">
                  <div className={`${isLoading ? 'i-ph:circle-notch animate-spin':'i-ph:sign-out'} w-4 h-4`} />
                  Disconnect
                </Button>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div className="i-ph:check-circle w-4 h-4 text-websparks-elements-icon-success dark:text-websparks-elements-icon-success" />
                    <span className="text-sm text-websparks-elements-textPrimary dark:text-websparks-elements-textPrimary">
                      Connected to Netlify
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
