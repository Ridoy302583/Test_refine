import { useState, useEffect } from 'react';
import { classNames } from '~/utils/classNames';
import { Input } from '../../../ui/Input';
import { motion } from 'framer-motion';
import { GradientIconBox } from '../../../ui/GradientIconBox';
import { Button } from '../../../ui/Button';
import useUser from '~/types/user';
import { Textarea } from '~/components/ui/Textarea';
import { isConnecting } from '~/lib/stores/firebase';
import { useFirebaseConnection } from '~/lib/hooks/useFirebase';

interface FirebaseConfig {
    projectId: string;
    clientEmail: string;
    privateKey: string;
}

export function FirebaseConnection({ setManualConnection }: { setManualConnection?: (value: boolean) => void }) {
    const { getStoredToken, user } = useUser();
    const user_token = getStoredToken();
    const [connecting, setConnecting] = useState<boolean>(false);
    const {
        connection: firebaseData,
        connecting: firebaseConnecting,
        handleConnect,
        initialFetch,
        handleDisconnect: disconnectFirebase,
        updateConfig
    } = useFirebaseConnection();

    const [config, setConfig] = useState<FirebaseConfig>({
        projectId: '',
        clientEmail: '',
        privateKey: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setConfig(prev => ({
            ...prev,
            [name]: value
        }));
        updateConfig(config);
    };

    const handleConnectFirebase = async () => {
        isConnecting.set(true);
        setConnecting(true);
        await handleConnect(config);
        setConnecting(false);
        if (setManualConnection) {
            setManualConnection(false);
        }
    };

    return (
        <motion.div
            className="bg-websparks-elements-background dark:bg-websparks-elements-background border border-websparks-elements-borderColor dark:border-websparks-elements-borderColor rounded-lg overflow-y-auto max-h-screen"
            style={{
                maxHeight: '70vh',
                overflowY: 'auto'
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
        >
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <GradientIconBox iconClassName="i-vscode-icons:file-type-firebase text-xl" />
                        <div>
                            <h3 className="text-lg font-medium text-white">Firebase Connection</h3>
                            <p className="text-sm text-gray-400">Configure your Firebase connection</p>
                        </div>
                    </div>
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-2" htmlFor="projectId">Project ID</label>
                    <Input
                        id="projectId"
                        name="projectId"
                        type="text"
                        value={config.projectId}
                        onChange={handleInputChange}
                        disabled={firebaseConnecting}
                        placeholder="Enter your Firebase project ID"
                        className={classNames('w-full bg-transparent border border-alpha-white-10 outline-none focus:outline-none text-gray-200', {
                            'border-red-500': false,
                        })}
                    />
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-2" htmlFor="clientEmail">Client Email</label>
                    <Input
                        id="clientEmail"
                        name="clientEmail"
                        type="email"
                        value={config.clientEmail}
                        onChange={handleInputChange}
                        disabled={firebaseConnecting}
                        placeholder="Enter your service account client email"
                        className={classNames('w-full bg-transparent border border-alpha-white-10 outline-none focus:outline-none text-gray-200', {
                            'border-red-500': false,
                        })}
                    />
                    <div className="mt-2 text-sm text-gray-400">
                        <a
                            href="https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-orange-500 hover:underline inline-flex items-center gap-1"
                        >
                            Get service account
                            <div className="i-ph:arrow-square-out w-4 h-4" />
                        </a>
                    </div>
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-2" htmlFor="privateKey">Private Key</label>
                    <Textarea
                        id="privateKey"
                        name="privateKey"
                        value={config.privateKey}
                        onChange={handleInputChange}
                        disabled={firebaseConnecting}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----"
                        rows={5}
                    />
                </div>
                <div className="flex justify-between gap-2 mt-6">
                    <Button
                        onClick={handleConnectFirebase}
                        variant="default"
                        disabled={connecting || !config.projectId || !config.clientEmail || !config.privateKey}
                        className={`relative flex justify-center items-center p-3.5 rounded-md text-white font-medium text-base transition-all duration-300 
                  ${connecting ? 'bg-gray-700 cursor-not-allowed' : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 cursor-pointer'}
                  overflow-hidden group shadow-lg shadow-orange-900/20`}
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
            </div>
        </motion.div>
    );
}