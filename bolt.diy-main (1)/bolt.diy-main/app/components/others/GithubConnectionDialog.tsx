import { useState, useEffect, useRef } from 'react';
import Logo from '../../icons/roundedlogo.svg';
import { motion } from 'framer-motion';
import { classNames } from '~/utils/classNames';
import useUser from '~/types/user';
import { GradientIconBox } from '../ui/GradientIconBox';
import WithTooltip from '../ui/Tooltip';
import GitHubConnection from '../@settings/tabs/connections/GithubConnection';
import useGithub from '~/lib/hooks/useGithub';
import { API_BASE_URL } from '~/config';
import { useGitHubStore } from '~/lib/stores/github';

interface GitHubResponse {
    id: number;
    github_token: string;
    github_username: string;
    user_id: number;
    created_at: string;
    updated_at: string;
}


interface GithubConnectionDialogProps {
    openGithubConnectionDialog: boolean;
    onClose: () => void;
    setIsGithubOpen: (value: boolean) => void;
}

export function GithubConnectionDialog({ openGithubConnectionDialog, setIsGithubOpen, onClose }: GithubConnectionDialogProps) {
    const menuRef = useRef<HTMLDivElement>(null);
    const { getStoredToken } = useUser();
    const user_token = getStoredToken();
    const {isConnected,fetchToken,refreshAllData} = useGithub();
    const { disconnect } = useGitHubStore();
    const [isFetching, setIsFetching] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [fetchCount, setFetchCount] = useState<number>(0);
    const fetchIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [manualConnection, setManualConnection] = useState<boolean>(false);
    const [manualGithubConnection, setManualGithubConnection] = useState<boolean>(false);
    const [githubConnection, setGithubConnection] = useState<boolean>(false);

    const handleManualConnection = () => {
        setManualConnection(true);
        setManualGithubConnection(true);
    }

    const handleManualClose = () => {
        setManualConnection(false);
    }

    useEffect(() => {
        setManualConnection(false);
        if (isConnected) {
            setGithubConnection(true);
        }
        else {
            setGithubConnection(false);
        }
    }, [isConnected]);

    useEffect(() => {
        return () => {
            if (fetchIntervalRef.current) {
                clearInterval(fetchIntervalRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (fetchCount >= 60) {
            if (fetchIntervalRef.current) {
                clearInterval(fetchIntervalRef.current);
                setIsFetching(false);
                setFetchCount(0);
            }
        }
    }, [fetchCount]);

    const fetchData = async () => {
        try {
            if (!user_token) return;
            const response = await fetchToken(user_token) as GitHubResponse;
            setFetchCount(prev => prev + 1);
            if (response && response.github_token) {
                if (fetchIntervalRef.current) {
                    clearInterval(fetchIntervalRef.current);
                    setIsFetching(false);
                    setIsGithubOpen(true);
                    onClose();
                    refreshAllData();
                }
                return response;
            }
            return response;
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleGituhbAutoConnect = async () => {
        setIsGithubOpen(false);
        const GITHUB_CLIENT_ID = 'Ov23li0HVoGWJirGmrwr';
        const REDIRECT_URI = `http://localhost:5173/auth-github`;
        const githubAuthorizeUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=repo user delete_repo workflow gist admin:repo_hook&prompt=consent`;
        window.open(githubAuthorizeUrl, '_blank');
        setIsFetching(true);
        setFetchCount(0);
        const initialResult = await fetchData() as GitHubResponse;

        if (initialResult && initialResult.github_token) {
            return;
        }

        if (fetchIntervalRef.current) {
            clearInterval(fetchIntervalRef.current);
        }

        fetchIntervalRef.current = setInterval(async () => {
            await fetchData();
        }, 2000);
    };

    const handleClose = () => {
        if (fetchIntervalRef.current) {
            clearInterval(fetchIntervalRef.current);
            setIsFetching(false);
            setFetchCount(0);
        }
        onClose();
    };

    const deleteToken = async (token: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/github-users-delete-me`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error(`Failed to delete token: ${response.status}`);
            }
            fetchToken(token);
            return true;
        } catch (error) {
            return false;
        }
    };

    const handleDisconnect = async () => {
        if (!user_token) return;
        setIsLoading(true);
        disconnect();
        const result = await deleteToken(user_token);
        if (result) {
            setTimeout(() => {
                refreshAllData();
            }, 100);
            setIsLoading(false);
        }
    };

    if (!openGithubConnectionDialog) return null;

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
                        manualGithubConnection ? (
                            <div>
                                <div className='flex gap-2 items-center border-b border-alpha-white-10 mb-4 pb-2'
                                    style={{
                                        animation: 'fadeInUp 0.3s ease-out 0.1s forwards',
                                        animationFillMode: 'backwards'
                                    }}
                                >
                                    <div onClick={() => handleManualClose()} className='i-ph:arrow-left cursor-pointer' />
                                    <h2 className="text-lg font-bold font-montserrat bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 tracking-wide">
                                        Github Connection
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
                                        <GitHubConnection statsShow={true} handleClose={handleClose} setIsGithubOpen={setIsGithubOpen} />
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
                                    Connection Apps in Websparks
                                </h2>
                                <p className="text-sm text-center font-montserrat text-gray-300 mt-1">
                                    Bring your everyday apps to Websparks
                                </p>
                            </div>
                            <div>
                                <div className="p-4 grid grid-cols-1 gap-2 sm:gap-3 md:gap-4 relative">
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
                                                <GradientIconBox iconClassName="i-codicon:github-inverted text-white text-xl" />
                                            </div>
                                            {/* Label and Description */}
                                            <div className="flex flex-col items-center mt-2 sm:mt-3 md:mt-5 w-full">
                                                <h3
                                                    className={classNames(
                                                        'text-xs sm:text-sm md:text-[15px] font-medium leading-snug mb-1 sm:mb-2',
                                                        'text-gray-200',
                                                    )}
                                                >
                                                    Github
                                                </h3>
                                                <p
                                                    className={classNames(
                                                        'hidden sm:block text-[11px] md:text-[13px] leading-relaxed',
                                                        'text-gray-400',
                                                        'max-w-[85%]',
                                                        'text-center',
                                                    )}
                                                >
                                                    Configure your GitHub connection
                                                </p>
                                                <div>
                                                    <button
                                                        onClick={githubConnection ? handleDisconnect : handleGituhbAutoConnect}
                                                        className={`${githubConnection ? 'bg-red-500' : isFetching || isLoading ? 'bg-gray-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'} flex items-center gap-1 text-white text-xs px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-md mt-2 sm:mt-3 md:mt-4 hover:scale-105 transition-transform duration-200`}
                                                        disabled={isFetching || isLoading}
                                                    >
                                                        <div className={`${githubConnection ? 'i-ph:sign-out' : isFetching || isLoading ? 'i-ph:circle-notch animate-spin' : 'i-ph:plug-charging'} w-4 h-4`} />
                                                        {githubConnection ? 'Disconnect' : isFetching ? `Connecting` : isLoading ? 'Disconnecting' : 'Connect'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`absolute top-2 sm:top-3 md:top-4 right-2 sm:right-3 md:right-4 w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full ${githubConnection ? 'bg-green-500' : 'bg-purple-400 animate-pulse'}`} />
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
