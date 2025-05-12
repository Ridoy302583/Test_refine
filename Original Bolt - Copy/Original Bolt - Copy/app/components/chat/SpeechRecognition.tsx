import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// import useUser from '~/types/user';
import { IconButton } from '../ui/IconButton';

interface SpeechRecognitionButtonProps {
  isListening: boolean;
  onStart: () => void;
  onStop: () => void;
  disabled: boolean;
  selectedLanguage: string;
  onLanguageChange: (value: string) => void;
  setSignInOpen: (open: boolean) => void;
}

interface Language {
  value: string;
  label: string;
  icon: string;
  color: {
    background: string;
    text: string;
    hover: string;
  };
}

export const SpeechRecognitionButton: React.FC<SpeechRecognitionButtonProps> = ({
  isListening,
  onStart,
  onStop,
  disabled,
  selectedLanguage,
  onLanguageChange,
  setSignInOpen
}) => {
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);
  // const { getStoredToken } = useUser();
  // const token = getStoredToken();

  const animationStyles = {
    micContainer: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    soundWaveContainer: {
      position: 'absolute',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '4px',
      width: '100%',
      height: '100%',
      pointerEvents: 'none' as const,
    },
    soundWave: {
      width: '4px',
      borderRadius: '9999px',
      background: 'linear-gradient(to bottom, #1488fc, #b44aff)',
      transformOrigin: 'bottom',
    },
  };

  const keyframes = `
    @keyframes brandPulse {
      0%, 100% { 
        transform: scale(1);
        opacity: 1;
      }
      50% { 
        transform: scale(1.1);
        opacity: 0.7;
      }
    }
    
    @keyframes soundWaveFlow {
      0%, 100% { 
        height: 10px; 
        opacity: 0.6;
      }
      50% { 
        height: 30px; 
        opacity: 1;
      }
    }
  `;

  const handleMenuToggle = (event: React.MouseEvent<HTMLButtonElement>): void => {
    if (token) {
      setMenuOpen(!menuOpen);
    } else {
      setSignInOpen(true);
    }
  };

  const handleLanguageSelect = (value: string): void => {
    onLanguageChange(value);
    setMenuOpen(false);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const languages: Language[] = [
    { 
      value: 'en-US', 
      label: 'English (US)', 
      icon: 'i-circle-flags:us',
      color: {
        background: '#1488fc',
        text: '#ffffff',
        hover: '#1e90ff'
      }
    },
    { 
      value: 'ru', 
      label: 'Russian', 
      icon: 'i-circle-flags:ru',
      color: {
        background: '#FF4136',
        text: '#ffffff',
        hover: '#FF6347'
      }
    },
    { 
      value: 'es-ES', 
      label: 'Spanish', 
      icon: 'i-circle-flags:es',
      color: {
        background: '#FF851B',
        text: '#ffffff',
        hover: '#FFA500'
      }
    },
    { 
      value: 'fr-FR', 
      label: 'French', 
      icon: 'i-circle-flags:fr',
      color: {
        background: '#B44AFF',
        text: '#ffffff',
        hover: '#9932CC'
      }
    },
    { 
      value: 'bn-BD', 
      label: 'Bengali', 
      icon: 'i-circle-flags:bd',
      color: {
        background: '#2ECC40',
        text: '#ffffff',
        hover: '#3CB371'
      }
    },
    { 
      value: 'de-DE', 
      label: 'German', 
      icon: 'i-circle-flags:de',
      color: {
        background: '#000000',
        text: '#ffffff',
        hover: '#333333'
      }
    },
    { 
      value: 'pt-PT', 
      label: 'Portuguese', 
      icon: 'i-circle-flags:pt',
      color: {
        background: '#008000',
        text: '#ffffff',
        hover: '#00A000'
      }
    },
    { 
      value: 'it-IT', 
      label: 'Italian', 
      icon: 'i-circle-flags:it',
      color: {
        background: '#4CAF50',
        text: '#ffffff',
        hover: '#66BB6A'
      }
    },
    { 
      value: 'hi-IN', 
      label: 'Hindi', 
      icon: 'i-circle-flags:in',
      color: {
        background: '#FF9800',
        text: '#ffffff',
        hover: '#FFA726'
      }
    },
    { 
      value: 'ar-SA', 
      label: 'Arabic', 
      icon: 'i-circle-flags:lang-ar',
      color: {
        background: '#2196F3',
        text: '#ffffff',
        hover: '#42A5F5'
      }
    },
    { 
      value: 'ja-JP', 
      label: 'Japanese', 
      icon: 'i-circle-flags:jp',
      color: {
        background: '#FF0000',
        text: '#ffffff',
        hover: '#FF3333'
      }
    },
    { 
      value: 'ko-KR', 
      label: 'Korean', 
      icon: 'i-circle-flags:ko',
      color: {
        background: '#1565C0',
        text: '#ffffff',
        hover: '#1976D2'
      }
    },
    { 
      value: 'zh-CN', 
      label: 'Chinese (Simplified)', 
      icon: 'i-circle-flags:cn',
      color: {
        background: '#D32F2F',
        text: '#ffffff',
        hover: '#F44336'
      }
    },
    { 
      value: 'id-ID', 
      label: 'Indonesia', 
      icon: 'i-circle-flags:id',
      color: {
        background: '#D32F2F',
        text: '#ffffff',
        hover: '#F44336'
      }
    },
    { 
      value: 'tr', 
      label: 'Turkish', 
      icon: 'i-circle-flags:tr',
      color: {
        background: '#D32F2F',
        text: '#ffffff',
        hover: '#F44336'
      }
    },
    { 
      value: 'sv-SE', 
      label: 'Swedish', 
      icon: 'i-circle-flags:se',
      color: {
        background: '#1976D2',
        text: '#ffffff',
        hover: '#2196F3'
      }
    },
    
    // ... (previous language list remains the same)
  ];

  const getLanguageLabel = (value: string): string => {
    return languages.find(lang => lang.value === value)?.label || value;
  };

  return (
    <div className="flex items-center">
      {/* Inject animation keyframes */}
      <style>{keyframes}</style>
      
      {/* Microphone Button with Brand-Inspired Animation */}
      <div style={animationStyles.micContainer} className="relative">
        <motion.button
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 10 }}
          className={`
            relative flex items-center justify-center 
            w-10 h-10 rounded-full 
            transition-all duration-300
            ${isListening 
              ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
              : 'bg-transparent hover:bg-blue-500/10'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          disabled={disabled}
          onClick={isListening ? onStop : onStart}
          style={{ 
            animation: isListening ? 'brandPulse 2s infinite' : 'none',
            boxShadow: isListening 
              ? '0 0 15px rgba(79, 70, 229, 0.4), 0 0 25px rgba(168, 85, 247, 0.3)' 
              : 'none'
          }}
        >
          {/* Microphone Icon */}
          <div className={`
            relative z-10 
            ${isListening ? 'text-white' : 'text-blue-500 hover:text-blue-600'}
          `}>
            {isListening ? (
              <div className="i-ph:pause text-xl" />
            ) : (
              <div className="i-ph:microphone text-xl" />
            )}
          </div>

          {/* Sound Wave Animation */}
          {isListening && (
            <div style={animationStyles.soundWaveContainer}>
              {[1, 2, 3].map((wave) => (
                <motion.div
                  key={wave}
                  style={{
                    ...animationStyles.soundWave,
                    height: `${10 * wave}px`,
                    animation: `soundWaveFlow 1.5s ease-in-out infinite ${wave * 0.2}s`,
                  }}
                  initial={{ opacity: 0, height: 10 }}
                  animate={{ 
                    opacity: [0.6, 1, 0.6],
                    height: [10, 30, 10],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: wave * 0.2,
                  }}
                />
              ))}
            </div>
          )}
        </motion.button>
      </div>

      {/* Language Selection Button */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={handleMenuToggle}
          className={`
            flex items-center text-white ml-1 py-1 px-2 
            ${menuOpen ? 'bg-blue-500/10' : 'bg-transparent'}
            hover:bg-blue-500/10 rounded
            transition-colors duration-200
          `}
        >
          <span className="text-sm mr-1">{getLanguageLabel(selectedLanguage)}</span>
          <div className={`i-ph:caret-${menuOpen ? 'down' : 'right'} text-blue-400`} />
        </button>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute left-0 bottom-8 mt-1 
              bg-[#121212] 
              border border-[#1e1e1e]
              rounded-xl shadow-2xl z-50 
              overflow-hidden"
              style={{
                maxHeight: '100px',
                width: '250px',
                overflowY: 'auto',
                zIndex: 99999,
                top: 'auto', // Let it position naturally
                // zIndex: 99999, // Super high z-index
                position: 'absolute', // Explicitly set position 
                transform: 'translateZ(0)', // Forces a new stacking context
                // bottom: 'calc(100% + 8px)', // Position above the button with some spacing
              }}
            >
              {languages.map((language, index) => (
                <motion.button
                  key={language.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleLanguageSelect(language.value)}
                  style={{
                    backgroundColor: 
                      selectedLanguage === language.value 
                        ? language.color.background 
                        : 'transparent',
                    color: language.color.text
                  }}
                  className={`
                    flex gap-2 items-center w-full text-left 
                    px-4 py-2.5 text-sm 
                    transition-all duration-200
                    hover:bg-opacity-10
                    border-b border-[#1e1e1e] last:border-b-0
                  `}
                >
                  <div className={`${language.icon} mr-2 text-xl`}></div>
                  <span>{language.label}</span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};