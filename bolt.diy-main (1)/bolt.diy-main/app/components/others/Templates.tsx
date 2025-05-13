import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '~/config';
import Logo from '../../icons/roundedlogo.svg';
import StarterTemplates from '../chat/StarterTemplates';
import type { Message } from 'ai';

interface TemplatesProps {
    templateOpen: boolean;
    onTemplatesClose: () => void;
    importChat?: (description: string, messages: Message[], repoUrl?: string) => Promise<void>;
    setTemplateLoading: (value: boolean) => void;
}

const Templates: React.FC<TemplatesProps> = ({
    templateOpen,
    onTemplatesClose,
    importChat,
    setTemplateLoading
}) => {
    const [isAnimated, setIsAnimated] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const handleOverlayClick = (e: React.MouseEvent) => {
        // Only close if the click is directly on the overlay (not its children)
        if (e.target === e.currentTarget) {
            onTemplatesClose();
        }
    };
    // Handle outside clicks to close the menu
    useEffect(() => {
        if (!templateOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            // Close modal if click is outside the menu content
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onTemplatesClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [templateOpen, onTemplatesClose]);

    // Handle Escape key to close menu
    useEffect(() => {
        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && templateOpen) {
                onTemplatesClose();
            }
        };

        document.addEventListener('keydown', handleEscapeKey);
        return () => document.removeEventListener('keydown', handleEscapeKey);
    }, [templateOpen, onTemplatesClose]);
    // Handle animation sequence
    useEffect(() => {
        if (templateOpen) {
            setIsAnimated(true);
        } else {
            const timer = setTimeout(() => {
                setIsAnimated(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [templateOpen]);

    if (!templateOpen && !isAnimated) return null;

    return (
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
                <div className="flex justify-center w-full mb-2 relative">
                    <img
                        src={Logo}
                        alt="Logo"
                        className="h-12 w-auto relative z-10"
                        crossOrigin="anonymous"
                    />
                </div>
                <div className="my-6">
                    <h2
                        className="text-xl font-bold text-center font-montserrat bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 tracking-wide"
                        style={{
                            animation: 'fadeInUp 0.3s ease-out 0.1s forwards',
                            animationFillMode: 'backwards'
                        }}
                    >
                        Start Building with Templates
                    </h2>
                    <p className="text-sm text-center font-montserrat text-gray-300 mt-1"
                        style={{
                            animation: 'fadeInUp 0.3s ease-out 0.2s forwards',
                            animationFillMode: 'backwards'
                        }}
                    >
                        Choose a framework to jumpstart your next project
                    </p>
                </div>
                <div className="mt-5 mb-8">
                    <StarterTemplates
                        importChat={importChat}
                        setTemplateLoading={setTemplateLoading}
                        onTemplatesClose={onTemplatesClose}
                    />
                </div>
                <div className="my-6 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>
                <div className="flex justify-center items-center">
                    <span className="text-sm text-gray-400">
                        Secured by <span
                            className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"
                            style={{
                                backgroundSize: '200% 200%',
                                animation: 'gradientMove 8s linear infinite'
                            }}
                        >Websparks</span>
                    </span>
                </div>
                <button
                    onClick={onTemplatesClose}
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

export default Templates;