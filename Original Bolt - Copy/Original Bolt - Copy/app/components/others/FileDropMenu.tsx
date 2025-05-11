import { useEffect, useRef, useCallback } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import Logo from '../../icons/roundedlogo.svg';
// Custom CSS for animations
const animationStyles = `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleIn {
  from { 
    transform: scale(0.95); 
    opacity: 0; 
  }
  to { 
    transform: scale(1); 
    opacity: 1; 
  }
}

@keyframes fadeInUp {
  from { 
    transform: translateY(10px); 
    opacity: 0; 
  }
  to { 
    transform: translateY(0); 
    opacity: 1; 
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
`;

interface HeaderProps {
  open: boolean;
  anchorE2: HTMLElement | null;
  handleClose: () => void;
  handleFileUpload: () => void;
  handleClickOpenWhiteBoard: () => void;
  onCrawlerClose: () => void;
  handleGithubClose: () => void;
}

interface ProcessingCardProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  onClick?: () => void;
  showBetaBadge?: boolean;
  showConnectBadge?: boolean;
  connected?: boolean;
  delay?: number;
}

const ProcessingCard = ({ title, subtitle, children, onClick, showBetaBadge = false, showConnectBadge = false, connected = false, delay }: ProcessingCardProps) => {
  return (
    <div className="flex-shrink-0 transition-all duration-300 group"
      style={{
        animation: `fadeInUp 0.3s ease-out ${delay}s forwards`,
        animationFillMode: 'backwards'
      }}
    >
      <div onClick={onClick} className="relative rounded-md lg:rounded-3xl pt-2 sm:pt-4 md:pt-6 px-2 sm:px-3 md:px-6 pb-2 md:pb-3 cursor-pointer
                        bg-white/10 backdrop-blur-md
                        shadow-lg hover:shadow-xl hover:bg-white/15
                        transition-all duration-300">
        <div className="space-y-0 sm:space-y-1 pb-1 sm:pb-2 md:pb-4">
          <div className="flex items-center justify-between">
            <p className="text-[8px] sm:text-[10px] md:text-xs text-zinc-500 truncate">{subtitle}</p>
            {showBetaBadge && (
              <span className="absolute right-5 inline-flex items-center justify-center px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[10px] font-medium rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/40">
                <span className="sm:hidden">B</span>
                <span className="hidden sm:inline">BETA</span>
              </span>
            )}
            {showConnectBadge && (
              connected ? (
                <span className="absolute right-5 inline-flex items-center justify-center px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[10px] font-medium rounded-full bg-green-500/20 text-green-400 border border-green-500/40">
                  <span className="sm:hidden">C</span>
                  <span className="hidden sm:inline">CONNECT</span>
                </span>
              ) : (
                <span className="absolute right-5 inline-flex items-center justify-center px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[10px] font-medium rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/40">
                  <span className="sm:hidden">B</span>
                  <span className="hidden sm:inline">BETA</span>
                </span>
              )
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

const FileUploadMenu = ({
  open,
  anchorE2,
  handleClose,
  handleFileUpload,
  handleClickOpenWhiteBoard,
  onCrawlerClose,
  handleGithubClose,
}: HeaderProps) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Inject animations into document
  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.type = 'text/css';
    styleSheet.innerText = animationStyles;
    document.head.appendChild(styleSheet);

    // Cleanup function
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  // Handle outside clicks to close the menu
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
        event.target !== anchorE2) {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, handleClose, anchorE2]);

  // Handle Escape key to close menu
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [open, handleClose]);

  // Modified handler function to include the close after file upload
  const handleFileUploadAndClose = () => {
    handleFileUpload();
    handleClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-md"
      style={{
        animation: 'fadeIn 0.3s ease-out forwards'
      }}
    >
      <div
        ref={menuRef}
        className="relative w-full max-w-4xl p-6 bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-lg rounded-2xl border border-purple-500/20 text-white shadow-2xl overflow-hidden z-[1001]"
        style={{
          animation: 'scaleIn 0.3s ease-out forwards'
        }}
      >
        <div
          className="mb-6"
          style={{
            animation: 'fadeInUp 0.3s ease-out 0.2s forwards',
            animationFillMode: 'backwards'
          }}
        >
          <div className="flex justify-center w-full mb-2 relative">
            <img src={Logo} alt="Logo" className="h-12 w-auto relative z-10" />
          </div>
          <h2 className="text-lg font-bold text-center font-montserrat bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 tracking-wide">
            Choose Import Option
          </h2>
          <p className="text-sm text-center font-montserrat text-gray-300 mt-1">
            Select a method to import your content
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2">
          <ProcessingCard
            title="From Image"
            subtitle="From Image"
            onClick={handleFileUploadAndClose}
            delay={0.3}
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
            onClick={handleClickOpenWhiteBoard}
            delay={0.4}
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
            onClick={onCrawlerClose}
            showBetaBadge={true}
            delay={0.5}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="absolute opacity-10 w-14 sm:w-20 md:w-32 h-14 sm:h-20 md:h-30" viewBox="0 0 103 102" fill="none">
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

          {/* <ProcessingCard
            title="Clone GitHub"
            subtitle="Clone GitHub"
            onClick={handleGithubClose}
            showConnectBadge={true}
            connected={true}
            delay={0.5}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="absolute opacity-10 w-14 sm:w-20 md:w-28 h-14 sm:h-20 md:h-30" viewBox="0 0 48 48" fill="none">
              <path d="M24 2.5a21.5 21.5 0 0 0-6.8 41.9c1.08.2 1.47-.46 1.47-1v-3.65c-6 1.3-7.24-2.88-7.24-2.88A5.7 5.7 0 0 0 9 33.68c-1.95-1.33.15-1.31.15-1.31a4.52 4.52 0 0 1 3.29 2.22c1.92 3.29 5 2.34 6.26 1.79a4.6 4.6 0 0 1 1.37-2.88c-4.78-.54-9.8-2.38-9.8-10.62a8.3 8.3 0 0 1 2.22-5.77a7.68 7.68 0 0 1 .21-5.69s1.8-.58 5.91 2.2a20.46 20.46 0 0 1 10.76 0c4.11-2.78 5.91-2.2 5.91-2.2a7.74 7.74 0 0 1 .21 5.69a8.28 8.28 0 0 1 2.21 5.77c0 8.26-5 10.07-9.81 10.61a5.12 5.12 0 0 1 1.46 4v5.9c0 .71.39 1.24 1.48 1A21.5 21.5 0 0 0 24 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 sm:w-10 md:w-16 h-8 sm:h-10 md:h-16 text-whitey" viewBox="0 0 48 48" fill="none">
              <path d="M24 2.5a21.5 21.5 0 0 0-6.8 41.9c1.08.2 1.47-.46 1.47-1v-3.65c-6 1.3-7.24-2.88-7.24-2.88A5.7 5.7 0 0 0 9 33.68c-1.95-1.33.15-1.31.15-1.31a4.52 4.52 0 0 1 3.29 2.22c1.92 3.29 5 2.34 6.26 1.79a4.6 4.6 0 0 1 1.37-2.88c-4.78-.54-9.8-2.38-9.8-10.62a8.3 8.3 0 0 1 2.22-5.77a7.68 7.68 0 0 1 .21-5.69s1.8-.58 5.91 2.2a20.46 20.46 0 0 1 10.76 0c4.11-2.78 5.91-2.2 5.91-2.2a7.74 7.74 0 0 1 .21 5.69a8.28 8.28 0 0 1 2.21 5.77c0 8.26-5 10.07-9.81 10.61a5.12 5.12 0 0 1 1.46 4v5.9c0 .71.39 1.24 1.48 1A21.5 21.5 0 0 0 24 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </ProcessingCard> */}
        </div>

        {/* Divider with glow effect */}
        <div
          className="my-4 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"
          style={{
            animation: 'fadeIn 0.3s ease-out 0.6s forwards',
            animationFillMode: 'backwards'
          }}
        ></div>

        {/* Secured by section with animation */}
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
      </div>
    </div>
  );
};

export default FileUploadMenu;