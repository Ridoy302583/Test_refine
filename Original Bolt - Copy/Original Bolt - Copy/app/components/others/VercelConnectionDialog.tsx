import { useState, useEffect, useRef } from 'react';
import Logo from '../../icons/roundedlogo.svg';
import { motion } from 'framer-motion';
import { classNames } from '~/utils/classNames';
import { GradientIconBox } from '../ui/GradientIconBox';
import WithTooltip from '../ui/Tooltip';
import VercelConnection from '../@settings/tabs/connections/VercelConnection';
import useUser from '~/types/user';
import { useVercelConnection } from '~/lib/hooks/useVercel';
import { deleteVercel, refreshAllVercelData, updateVercelConnection } from '~/lib/stores/vercel';

interface VercelConnectionDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function VercelConnectionDialog({ isOpen, onClose }: VercelConnectionDialogProps) {
    const menuRef = useRef<HTMLDivElement>(null);
    const { getStoredToken } = useUser();
    const user_token = getStoredToken();
    const { connection: vercelConn } = useVercelConnection();
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [manualConnection, setManualConnection] = useState<boolean>(false);
    const [manualVercelConnection, setManualVercelConnection] = useState<boolean>(false);
    const [vercelConnection, setVercelConnection] = useState<boolean>(false);

    const handleManualConnection = () => {
        setManualConnection(true);
        setManualVercelConnection(true);
    }

    const handleManualClose = () => {
        setManualConnection(false);
    }

    useEffect(() => {
        if (vercelConn.user) {
            setVercelConnection(true);
        }
        if (!vercelConn.user) {
            setVercelConnection(false);
        }
    }, [vercelConn])

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleDisconnect = async () => {
        if (!user_token) return;
        setIsLoading(true);
        try {
            const result = await deleteVercel(user_token);
            if (result) {
                updateVercelConnection({ user: null, token: '', stats: undefined });
                refreshAllVercelData(user_token);
            }
            setIsLoading(false);
        } catch (error) {
            console.error('Error disconnecting from Vercel:', error);
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            <div
                className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-md"
                style={{
                    animation: 'fadeIn 0.3s ease-out forwards'
                }}
                onClick={handleOverlayClick}
            >
                <div
                    ref={menuRef}
                    className="relative w-full max-w-xl p-6 bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-lg rounded-2xl border border-purple-500/20 text-white shadow-2xl overflow-hidden z-[1001]"
                    style={{
                        animation: 'scaleIn 0.3s ease-out forwards'
                    }}
                >
                    {manualConnection ? (
                        manualVercelConnection ? (
                            <div>
                                <div className='flex gap-2 items-center border-b border-alpha-white-10 mb-4 pb-2'
                                    style={{
                                        animation: 'fadeInUp 0.3s ease-out 0.1s forwards',
                                        animationFillMode: 'backwards'
                                    }}
                                >
                                    <div onClick={() => handleManualClose()} className='i-ph:arrow-left cursor-pointer' />
                                    <h2 className="text-lg font-bold font-montserrat bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 tracking-wide">
                                        Vercel Connection
                                    </h2>
                                </div>
                                <div
                                    style={{
                                        animation: 'fadeInUp 0.3s ease-out 0.2s forwards',
                                        animationFillMode: 'backwards'
                                    }}
                                >
                                    <div
                                        style={{
                                            animation: 'fadeInUp 0.3s ease-out 0.2s forwards',
                                            animationFillMode: 'backwards'
                                        }}
                                    >
                                        <VercelConnection setVercelConnection={setVercelConnection} />
                                    </div>
                                </div>
                            </div>
                        ) : null
                    ) : (
                        <>
                            <div
                                className="mb-6"
                                style={{
                                    animation: 'fadeInUp 0.3s ease-out 0.2s forwards',
                                    animationFillMode: 'backwards'
                                }}
                            >
                                <div className="flex justify-center items-center w-full mb-2 relative">
                                    <img src={Logo} alt="Logo" className="h-12 w-auto relative z-10" />
                                </div>
                                <h2 className="text-lg font-bold text-center font-montserrat bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 tracking-wide">
                                    Vercel Connection in Websparks
                                </h2>
                                <p className="text-sm text-center font-montserrat text-gray-300 mt-1">
                                    deploy your sites in netlify to Websparks
                                </p>
                            </div>
                            <div>
                                <div className="p-4 grid grid-cols-1 gap-2 sm:gap-3 md:gap-4 relative">

                                    {/* Fifth Card - Vercel */}
                                    <motion.div
                                        className={classNames(
                                            'relative flex flex-col items-center p-2 sm:p-4 md:p-6 rounded-xl',
                                            'w-full h-full min-h-[120px] sm:min-h-[140px] md:min-h-[160px]',
                                            'bg-transparent',
                                            'border border-[#333333]',
                                            'group',
                                        )}
                                        style={{
                                            animation: 'fadeInUp 0.3s ease-out 0.4s forwards',
                                            animationFillMode: 'backwards'
                                        }}
                                    >
                                        {/* Main Content */}
                                        <div className="flex flex-col items-center justify-center flex-1 w-full">
                                            <div className="scale-75 sm:scale-90 md:scale-100">
                                                <GradientIconBox iconClassName="i-vscode-icons:file-type-vercel text-purple-400 text-xl" />
                                            </div>
                                            {/* Label and Description */}
                                            <div className="flex flex-col items-center mt-2 sm:mt-3 md:mt-5 w-full">
                                                <h3
                                                    className={classNames(
                                                        'text-xs sm:text-sm md:text-[15px] font-medium leading-snug mb-1 sm:mb-2',
                                                        'text-gray-200',
                                                    )}
                                                >
                                                    Vercel
                                                </h3>
                                                <p
                                                    className={classNames(
                                                        'hidden sm:block text-[11px] md:text-[13px] leading-relaxed',
                                                        'text-gray-400',
                                                        'max-w-[85%]',
                                                        'text-center',
                                                    )}
                                                >
                                                    Deploy sites with Vercel platform
                                                </p>
                                                <div>
                                                    <button
                                                        onClick={vercelConnection ? handleDisconnect : () => handleManualConnection()}
                                                        className={`${vercelConnection ? 'bg-red-500' : isLoading ? 'bg-gray-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'} flex items-center gap-1 text-white text-xs px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-md mt-2 sm:mt-3 md:mt-4 hover:scale-105 transition-transform duration-200`}
                                                        disabled={isLoading}
                                                    >
                                                        <div className={`${vercelConnection ? 'i-ph:sign-out' : isLoading ? 'i-ph:circle-notch animate-spin' : 'i-ph:plug-charging'} w-4 h-4`} />
                                                        {vercelConnection ? 'Disconnect' : isLoading ? 'Disconnecting' : 'Connect'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`absolute top-2 sm:top-3 md:top-4 right-2 sm:right-3 md:right-4 w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full ${vercelConnection ? 'bg-green' : 'bg-purple-400 animate-pulse'}`} />
                                        <WithTooltip tooltip={'Manual Connection'}>
                                            <div
                                                onClick={() => handleManualConnection()}
                                                className="absolute top-2 sm:top-3 md:top-4 left-2 sm:left-3 md:left-4 rounded-full bg-transparent cursor-pointer">
                                                <div className='i-ph:pencil-circle-light' />
                                            </div>
                                        </WithTooltip>
                                    </motion.div>

                                </div>
                            </div>
                        </>
                    )}

                    <div
                        className="my-4 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"
                        style={{
                            animation: 'fadeIn 0.3s ease-out 0.6s forwards',
                            animationFillMode: 'backwards'
                        }}
                    ></div>
                    <div
                        className="flex justify-center items-center"
                        style={{
                            animation: 'fadeIn 0.3s ease-out 0.7s forwards',
                            animationFillMode: 'backwards'
                        }}
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-400">
                                Secured by <span className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Websparks</span>
                            </span>
                        </div>
                    </div>

                    {/* Close button with hover effect */}
                    <button
                        onClick={handleClose}
                        className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors duration-200 bg-transparent p-1.5 rounded-full hover:bg-white/10"
                        style={{
                            animation: 'fadeIn 0.3s ease-out 0.1s forwards',
                            animationFillMode: 'backwards'
                        }}
                        aria-label="Close"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div >
            </div >
        </>
    );
}
