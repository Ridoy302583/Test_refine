import { useState, useEffect } from 'react';
import { classNames } from '~/utils/classNames';
import { Input } from '../../../ui/Input';
import { motion } from 'framer-motion';
import { GradientIconBox } from '../../../ui/GradientIconBox';
import { Button } from '../../../ui/Button';
import useUser from '~/types/user';
import { useSupabaseConnection } from '~/lib/hooks/useSupabase';
import { isConnecting, updateSupabaseConnection } from '~/lib/stores/supabase';
import { supabaseApi } from '~/lib/api/supabase';
import { API_BASE_URL } from '~/config';

interface SupabaseProject {
    id: number;
    urlId: string;
    project_ref_id: string;
    organization_id: string;
    ann_api_key: string;
    service_api_key: string;
}

export function SupabaseConnection() {
    const { getStoredToken } = useUser();
    const user_token = getStoredToken();
    const [connecting, setConnecting] = useState<boolean>(false);
    const [disconnecting, setDisconnecting] = useState<boolean>(false);
    const { connection: supabaseData, connecting:supabaseConnecting, handleConnect, initialFetch, updateToken } = useSupabaseConnection();
    const isConnected = supabaseData.isConnected;
    
    const handleConnectSupabase = async () => {
        isConnecting.set(true);
        setConnecting(true);
        await handleConnect();
        setConnecting(false);
    };

    const deleteToken = async (urlId: string, userToken: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/supabase/projects/${urlId}`, {
                method: 'DELETE',
                headers: {
                    'accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to post access token: ${response.statusText}`);
            }
            const data = await response.json();
            return data;
        }
        catch (error) {
            return null;
        }
    }

    const handleDisconnect = async () => {
        if (!user_token) return;
        setDisconnecting(true);
        try {
            const supabaseProjects = await supabaseApi.fetchProjects(user_token) as SupabaseProject;
            if (supabaseProjects) {
                const result = await deleteToken(supabaseProjects.urlId, user_token);
                if (result) {
                    updateSupabaseConnection({
                        user: null,
                        token: '',
                        stats: undefined
                    });
                    window.dispatchEvent(new CustomEvent('supabaseDisconnected'));
                    console.log("Progress 03")
                    setTimeout(() => {
                        initialFetch(user_token);
                    }, 100);
                    setDisconnecting(false);
                }
            }
        } catch (error) {
            console.error('Error disconnecting from Supabase:', error);
            setDisconnecting(false);
        }
    };

    return (
        <motion.div
            className="bg-websparks-elements-background border border-websparks-elements-borderColor rounded-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
        >
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <GradientIconBox iconClassName="i-material-icon-theme:supabase text-xl" />
                        <div>
                            <h3 className="text-lg font-medium text-white">Supabase Connection</h3>
                            <p className="text-sm text-gray-400">Configure your Supabase connection</p>
                        </div>
                    </div>
                </div>
                {!isConnected ? (
                    <>
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Access Token</label>
                            <Input
                                type="password"
                                value={supabaseData.token}
                                onChange={(e) => updateToken(e.target.value)}
                                disabled={supabaseConnecting}
                                placeholder="Enter your Supabase access token"
                                className={classNames('w-full bg-transparent border border-alpha-white-10 outline-none focus:outline-none text-gray-200', {
                                    'border-red-500': false,
                                })}
                            />
                            <div className="mt-2 text-sm text-gray-400">
                                <a
                                    href="https://app.supabase.com/account/tokens"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#3ECF8E] hover:underline inline-flex items-center gap-1"
                                >
                                    Get your token
                                    <div className="i-ph:arrow-square-out w-4 h-4" />
                                </a>
                            </div>
                        </div>

                        <div className="flex justify-between gap-2 mt-6">
                            <Button
                                onClick={handleConnectSupabase}
                                variant="default"
                                disabled={connecting || !supabaseData.token}
                                className={`relative flex justify-center items-center p-3.5 rounded-md text-white font-medium text-base transition-all duration-300 
                                    ${connecting ? 'bg-gray-700 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 cursor-pointer'}
                                    overflow-hidden group shadow-lg shadow-blue-900/20`
                                }
                            >
                                {connecting ? (
                                    <>
                                        <div className="i-ph:spinner-gap animate-spin" />
                                        Connecting...
                                    </>
                                ) : (
                                    <>
                                        <div className="i-ph:plug-charging w-4 h-4" />
                                        Connect
                                    </>
                                )}
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex items-center gap-4 p-3 bg-transparent border border-alpha-white-10 rounded-lg">
                            <img
                                className="w-5 h-5"
                                height="24"
                                width="24"
                                crossOrigin="anonymous"
                                src="https://cdn.simpleicons.org/supabase"
                            />
                            <div>
                                <h4 className="text-sm font-medium text-websparks-elements-textPrimary">
                                    {supabaseData.isConnected && `${supabaseData.user?.role} (${supabaseData.user?.email})`}
                                </h4>
                                <p className="text-xs text-websparks-elements-textSecondary">
                                    Projects: {supabaseData.stats?.totalProjects}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button
                                onClick={() => window.open('https://app.supabase.com', '_blank', 'noopener,noreferrer')}
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2"
                            >
                                <div className="i-hugeicons:dashboard-square-02 w-4 h-4" />
                                Dashboard
                            </Button>
                            <Button
                                onClick={handleDisconnect}
                                variant="destructive"
                                size="sm"
                                className="flex items-center gap-2"
                                disabled={disconnecting}
                            >
                                <div className={`${disconnecting ? 'i-ph:circle-notch animate-spin' : 'i-ph:sign-out'} w-4 h-4`} />
                                Disconnect
                            </Button>
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <div className="i-ph:check-circle w-4 h-4 text-websparks-elements-icon-success" />
                                    <span className="text-sm text-websparks-elements-textPrimary">
                                        Connected to Supabase
                                    </span>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </motion.div>
    );
}