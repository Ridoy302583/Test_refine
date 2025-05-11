import React, { useRef, useState } from 'react';
import { API_BASE_URL } from '~/config';
import Logo from '../../icons/roundedlogo.svg';
import { Input } from '../ui/Input';
import { classNames } from '~/utils/classNames';
import { Button } from '../ui/Button';

interface CrawlerProps {
    crawlerOpen: boolean;
    onCrawlerClose: () => void;
    setUploadedFiles?: (files: File[]) => void;
    setImageDataList?: (dataList: string[]) => void;
    uploadedFiles?: File[];
    imageDataList?: string[];
    setCrawlerLoading: (value: boolean) => void;
}
interface ScreenshotResponse {
    image_base64: string;
}

const Crawler: React.FC<CrawlerProps> = ({
    crawlerOpen,
    onCrawlerClose,
    setUploadedFiles,
    setImageDataList,
    uploadedFiles = [],
    imageDataList = [],
    setCrawlerLoading
}) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [formData, setFormData] = useState({ url: '' });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData((prevState) => ({
            ...prevState,
            [id]: value,
        }));
        if (error) setError('');
    };

    const base64ToFile = async (base64Data: string, filename: string): Promise<File> => {
        const base64WithoutPrefix = base64Data.replace(/^data:image\/\w+;base64,/, '');
        const byteString = atob(base64WithoutPrefix);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);

        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }

        const blob = new Blob([ab], { type: 'image/jpeg' });
        return new File([blob], filename, { type: 'image/jpeg' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        setCrawlerLoading(true);

        try {
            if (!formData.url.trim()) {
                throw new Error('Please enter a valid URL.');
            }

            const response = await fetch(`${API_BASE_URL}/screenshot`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: formData.url }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                // throw new Error(errorData.detail || 'Server error');
            }

            const result = (await response.json()) as ScreenshotResponse;
            const timestamp = new Date().getTime();
            const filename = `screenshot_${formData.url}_${timestamp}.png`;

            const file = await base64ToFile(result.image_base64, filename);
            setUploadedFiles?.([...uploadedFiles, file]);
            setImageDataList?.([...imageDataList, `data:image/png;base64,${result.image_base64}`]);

            onCrawlerClose();
        } catch (error) {
            setError(error instanceof Error ? error.message : 'An unexpected error occurred');
        } finally {
            setIsSubmitting(false);
            setCrawlerLoading(false);
        }
    };

    if (!crawlerOpen) return null;

    return (
        <>
            <div
                className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-md"
                style={{
                    animation: 'fadeIn 0.3s ease-out forwards'
                }}
            >
                <div
                    ref={menuRef}
                    className="relative w-full max-w-lg p-6 bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-lg rounded-2xl border border-purple-500/20 text-white shadow-2xl overflow-hidden z-[1001]"
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
                            Generate from Crawler
                        </h2>
                        <p className="text-sm text-center font-montserrat text-gray-300 mt-1">
                            Paste a website link to generate a modern and beautiful website
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6">
                            <div className="px-4 py-3 bg-red-500/30 border border-red-500/40 text-red-300 rounded-xl">
                                {error}
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div>
                            {/* URL field with icon */}
                            <div className="mb-5">
                                <Input
                                    type="url"
                                    id="url"
                                    placeholder="Enter URL for Crawler"
                                    value={formData.url}
                                    onChange={handleChange}
                                    required
                                    className={classNames('w-full bg-transparent border border-alpha-white-10 outline-none focus:outline-none text-gray-200', {
                                        'border-red-500': false,
                                    })}
                                />
                            </div>

                            {/* Submit button with animated gradient */}
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className={`relative w-full flex justify-center items-center p-3.5 rounded-md text-white font-medium text-base transition-all duration-300 
                                ${isSubmitting ? 'bg-gray-700 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 cursor-pointer'}
                                overflow-hidden group shadow-lg shadow-blue-900/20`}
                            >
                                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                                <span className="relative flex items-center justify-center">
                                    {isSubmitting ? 'Generating...' : 'Generate from Crawler'}
                                    {!isSubmitting && (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                        </svg>
                                    )}
                                </span>
                            </Button>
                        </div>
                    </form>

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
                        onClick={onCrawlerClose}
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
        </>
    );
};

export default Crawler;