//@ts-nocheck
import React, { useCallback, type ReactNode } from 'react';
import { useStore } from '@nanostores/react';
import useUser from '~/types/user';
import Logo from '../../icons/roundedlogo.svg';
import SuggestIcon from '../../icons/suggesticon.svg'
import ShinyText from '../ui/AnimatedText';

interface ProcessingCardProps {
    title: string;
    subtitle: string;
    children: ReactNode;
    onClick?: () => void;
    showBetaBadge?: boolean;
}

const ProcessingCard = ({ title, subtitle, children, onClick, showBetaBadge = false }: ProcessingCardProps) => {
    return (
        <div className="w-1/3 p-1 flex-shrink-0">
            <div onClick={onClick} className="relative rounded-3xl pt-2 sm:pt-4 md:pt-6 px-2 sm:px-3 md:px-6 pb-2 md:pb-3 cursor-pointer mt-1 md:mt-3
                        bg-white/10 backdrop-blur-md
                        shadow-lg hover:shadow-xl hover:bg-white/15
                        transition-all duration-300">
                <div className="space-y-0 sm:space-y-1 pb-1 sm:pb-2 md:pb-4">
                    <div className="flex items-center justify-between">
                        <p className="text-[8px] sm:text-[10px] md:text-xs text-zinc-500 truncate">{subtitle}</p>
                        {showBetaBadge && (
                            <span className="inline-flex items-center justify-center px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[10px] font-medium rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/40">
                                <span className="sm:hidden">B</span>
                                <span className="hidden sm:inline">BETA</span>
                            </span>
                        )}
                    </div>
                    <p className="text-[10px] sm:text-xs md:text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 truncate">{title}</p>
                </div>
                <div className="flex items-center justify-center h-10 sm:h-14 md:h-20 relative mb-1 sm:mb-2 md:mb-5">
                    {children}
                </div>
            </div>
        </div>
    );
};

interface HeaderProps {
    handleFileUpload: () => void;
    handleClickOpenWhiteBoard: () => void;
    onCrawlerClose: () => void;
    setSignInOpen: (open: boolean) => void;
}


const MediaFile = ({ handleFileUpload, handleClickOpenWhiteBoard, onCrawlerClose, setSignInOpen = () => { } }: HeaderProps) => {
    const { getStoredToken, user } = useUser();
    const token = getStoredToken();

    const checkAuthAndExecute = useCallback((action) => {
        if (!token) {
            if (typeof setSignInOpen === 'function') {
                setSignInOpen(true);
            }
            return;
        }
        action();
    }, [token, setSignInOpen]);

    return (
        <div className="flex flex-col items-center w-full">
            <div className="w-full max-w-[800px] px-2 sm:px-4 flex flex-col items-center">
                {/* Header section */}
                <div id="intro" className="mb-[0.5vh] w-full">
                    <div className="w-full flex mb-1 sm:mb-2">
                        <img src={Logo} className="h-6 sm:h-8 md:h-10 w-auto" alt="Logo" />
                    </div>
                    <h1 className="text-lg sm:text-xl md:text-2xl text-[#FFF] mb-1 sm:mb-2">
                        {user ? (
                            <><ShinyText text="HELLO," disabled={false} speed={3} className='custom-class' /> <span className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">{user?.full_name}</span></>
                        ) : (
                            <><ShinyText text="Welcome to," disabled={false} speed={3} className='custom-class' /> <span className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Websparks AI</span></>
                        )}
                    </h1>
                    <p className="text-base sm:text-lg md:text-xl mb-2 sm:mb-4 text-[#FFFFFF91]">
                        What you want to Build?
                    </p>
                </div>

                {/* Suggested label */}
                <div className="w-full flex mb-[0.5vh]">
                    <div className="flex flex-wrap gap-1 items-center">
                        <img src={SuggestIcon} className="h-3 sm:h-4 md:h-5 w-auto" alt="Suggest" />
                        <p className="font-['Montserrat'] text-[8px] sm:text-[10px] md:text-xs text-[#FFFFFF91]">Suggested</p>
                    </div>
                </div>

                {/* Cards section */}
                <div className="w-full mb-4">
                    <div className="flex flex-row flex-nowrap justify-between gap-2">
                        <ProcessingCard
                            title="From Image"
                            subtitle="From Image"
                            onClick={() => token ? handleFileUpload() : setSignInOpen(true)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="absolute opacity-10 w-14 sm:w-20 md:w-24 h-14 sm:h-20 md:h-24" viewBox="0 0 40 54" fill="none">
                                <path d="M20.5003 27C20.5003 22.3539 24.7026 18.5 30.0002 18.5C35.2975 18.5 39.5 22.3539 39.5 27C39.5 31.6462 35.2975 35.5 30.0002 35.5C24.7026 35.5 20.5003 31.6462 20.5003 27Z" stroke="white" />
                                <path d="M0.5 45C0.5 40.3539 4.70238 36.5 9.99985 36.5H19.4997V45C19.4997 49.6462 15.2974 53.5 9.99985 53.5C4.70237 53.5 0.5 49.6462 0.5 45Z" stroke="white" />
                                <path d="M30.0002 17.5H20.5003V0.5H30.0002C35.2977 0.5 39.5 4.35383 39.5 9.00001C39.5 13.6462 35.2977 17.5 30.0002 17.5Z" stroke="white" />
                                <path d="M9.99985 17.5C4.70237 17.5 0.5 13.6462 0.5 9.00002C0.5 4.35383 4.70237 0.5 9.99985 0.5H19.4997V17.5H9.99985Z" stroke="white" />
                                <path d="M9.99985 35.5C4.70237 35.5 0.5 31.6462 0.5 27C0.5 22.3539 4.70238 18.5 9.99985 18.5H19.4997V35.5H9.99985Z" stroke="white" />
                            </svg>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 sm:w-6 md:w-8 h-8 sm:h-10 md:h-12 text-whitey" viewBox="0 0 40 54" fill="none">
                                <path d="M20.5003 27C20.5003 22.3539 24.7026 18.5 30.0002 18.5C35.2975 18.5 39.5 22.3539 39.5 27C39.5 31.6462 35.2975 35.5 30.0002 35.5C24.7026 35.5 20.5003 31.6462 20.5003 27Z" stroke="white" />
                                <path d="M0.5 45C0.5 40.3539 4.70238 36.5 9.99985 36.5H19.4997V45C19.4997 49.6462 15.2974 53.5 9.99985 53.5C4.70237 53.5 0.5 49.6462 0.5 45Z" stroke="white" />
                                <path d="M30.0002 17.5H20.5003V0.5H30.0002C35.2977 0.5 39.5 4.35383 39.5 9.00001C39.5 13.6462 35.2977 17.5 30.0002 17.5Z" stroke="white" />
                                <path d="M9.99985 17.5C4.70237 17.5 0.5 13.6462 0.5 9.00002C0.5 4.35383 4.70237 0.5 9.99985 0.5H19.4997V17.5H9.99985Z" stroke="white" />
                                <path d="M9.99985 35.5C4.70237 35.5 0.5 31.6462 0.5 27C0.5 22.3539 4.70238 18.5 9.99985 18.5H19.4997V35.5H9.99985Z" stroke="white" />
                            </svg>
                        </ProcessingCard>

                        <ProcessingCard
                            title="From Sketch"
                            subtitle="From Sketch"
                            onClick={() => checkAuthAndExecute(handleClickOpenWhiteBoard)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="absolute opacity-10 w-14 sm:w-20 md:w-32 h-14 sm:h-20 md:h-32" viewBox="0 0 77 73" fill="none">
                                <path d="M64.4875 24.9417L61.6 27.6792L47.8042 14.6L50.6917 11.8625C54.5417 8.2125 60.6375 8.2125 64.4875 11.8625C68.3375 15.5125 68.3375 21.2917 64.4875 24.9417Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M61.6 27.6788L28.5542 59.0079C25.3458 62.0496 20.8542 63.8746 16.0417 63.8746H12.8333C10.9083 63.8746 9.625 62.3538 9.625 60.8329V57.7913C9.625 53.5329 11.55 49.2746 14.7583 45.9288L47.8042 14.5996L61.6 27.6788Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 sm:w-10 md:w-16 h-8 sm:h-10 md:h-16 text-whitey" viewBox="0 0 77 73" fill="none">
                                <path d="M64.4875 24.9417L61.6 27.6792L47.8042 14.6L50.6917 11.8625C54.5417 8.2125 60.6375 8.2125 64.4875 11.8625C68.3375 15.5125 68.3375 21.2917 64.4875 24.9417Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M61.6 27.6788L28.5542 59.0079C25.3458 62.0496 20.8542 63.8746 16.0417 63.8746H12.8333C10.9083 63.8746 9.625 62.3538 9.625 60.8329V57.7913C9.625 53.5329 11.55 49.2746 14.7583 45.9288L47.8042 14.5996L61.6 27.6788Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </ProcessingCard>

                        <ProcessingCard
                            title="From Crawler"
                            subtitle="From Crawler"
                            onClick={() => checkAuthAndExecute(onCrawlerClose)}
                            showBetaBadge={true}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="absolute opacity-10 w-14 sm:w-20 md:w-32 h-14 sm:h-20 md:h-32" viewBox="0 0 103 102" fill="none">
                                <path d="M51.5 89.25C72.832 89.25 90.125 72.1249 90.125 51C90.125 29.8751 72.832 12.75 51.5 12.75C30.168 12.75 12.875 29.8751 12.875 51C12.875 72.1249 30.168 89.25 51.5 89.25Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M51.5 89.25C58.6107 89.25 64.375 72.1249 64.375 51C64.375 29.8751 58.6107 12.75 51.5 12.75C44.3893 12.75 38.625 29.8751 38.625 51C38.625 72.1249 44.3893 89.25 51.5 89.25Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M51.5 63.75C72.832 63.75 90.125 58.0416 90.125 51C90.125 43.9584 72.832 38.25 51.5 38.25C30.168 38.25 12.875 43.9584 12.875 51C12.875 58.0416 30.168 63.75 51.5 63.75Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 sm:w-10 md:w-16 h-8 sm:h-10 md:h-16 text-whitey" viewBox="0 0 103 102" fill="none">
                                <path d="M51.5 89.25C72.832 89.25 90.125 72.1249 90.125 51C90.125 29.8751 72.832 12.75 51.5 12.75C30.168 12.75 12.875 29.8751 12.875 51C12.875 72.1249 30.168 89.25 51.5 89.25Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M51.5 89.25C58.6107 89.25 64.375 72.1249 64.375 51C64.375 29.8751 58.6107 12.75 51.5 12.75C44.3893 12.75 38.625 29.8751 38.625 51C38.625 72.1249 44.3893 89.25 51.5 89.25Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M51.5 63.75C72.832 63.75 90.125 58.0416 90.125 51C90.125 43.9584 72.832 38.25 51.5 38.25C30.168 38.25 12.875 43.9584 12.875 51C12.875 58.0416 30.168 63.75 51.5 63.75Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </ProcessingCard>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MediaFile;