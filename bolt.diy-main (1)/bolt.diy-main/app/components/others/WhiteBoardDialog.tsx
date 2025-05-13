/*
 * @ts-nocheck
 * Preventing TS checks with files presented in the video for a better presentation.
 */
import React, { lazy, Suspense, useState, useEffect } from 'react'
import { ClientOnly } from 'remix-utils/client-only';

// Import our canvas-based whiteboard instead of the Konva version
const CanvasWhiteBoard = lazy(() => import('./WhiteBoard'));

interface HeaderProps {
    openWhiteBoard: boolean;
    handleWhiteBoardClose: () => void;
    setUploadedFiles?: (files: File[]) => void;
    setImageDataList?: (dataList: string[]) => void;
    uploadedFiles?: File[];
    imageDataList?: string[];
}

const WhiteBoardDialog: React.FC<HeaderProps> = ({ 
    openWhiteBoard, 
    handleWhiteBoardClose, 
    setUploadedFiles, 
    setImageDataList, 
    uploadedFiles = [], 
    imageDataList = [] 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (openWhiteBoard) {
            setIsAnimating(true);
            setIsOpen(true);
            // Lock body scroll when dialog is open
            document.body.style.overflow = 'hidden';
        } else {
            setIsAnimating(false);
            // Delay closing to allow animation to complete
            const timer = setTimeout(() => {
                setIsOpen(false);
                // Restore body scroll when dialog is closed
                document.body.style.overflow = '';
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [openWhiteBoard]);

    const base64ToFile = (base64String: string) => {
        const base64Data = base64String.split(',')[1];
        const binaryData = atob(base64Data);
        const arrayBuffer = new ArrayBuffer(binaryData.length);
        const uint8Array = new Uint8Array(arrayBuffer);

        for (let i = 0; i < binaryData.length; i++) {
            uint8Array[i] = binaryData.charCodeAt(i);
        }
        const blob = new Blob([arrayBuffer], { type: 'image/jpeg' });
        const filename = `whiteboard-${Date.now()}.jpg`;
        const file = new File([blob], filename, { type: 'image/jpeg' });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);

        return dataTransfer.files;
    };

    const handleDrawImage = (base64Image: string | null) => {
        if (base64Image) {
            const files = base64ToFile(base64Image);
            if (files && files.length > 0) {
                const file = files[0]; // Get the first file from FileList
                setUploadedFiles?.([...uploadedFiles, file]);
                setImageDataList?.([...imageDataList, base64Image]); // Use original base64Image
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm transition-opacity duration-300 ${
                isAnimating ? 'opacity-100' : 'opacity-0'
            }`}
        >
            <div 
                className={`w-full h-full transform transition-transform duration-300 ${
                    isAnimating ? 'translate-y-0' : 'translate-y-full'
                }`}
            >
                <ClientOnly fallback={
                    <div className="w-full h-full flex items-center justify-center bg-black">
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 border-t-4 border-b-4 border-blue-500 rounded-full animate-spin"></div>
                            <p className="mt-4 text-white text-xl">Loading Whiteboard...</p>
                        </div>
                    </div>
                }>
                    {() => (
                        <Suspense fallback={
                            <div className="w-full h-full flex items-center justify-center bg-black">
                                <div className="flex flex-col items-center">
                                    <div className="w-16 h-16 border-t-4 border-b-4 border-blue-500 rounded-full animate-spin"></div>
                                    <p className="mt-4 text-white text-xl">Loading Whiteboard...</p>
                                </div>
                            </div>
                        }>
                            <CanvasWhiteBoard 
                                setDrawImage={handleDrawImage} 
                                handleWhiteBoardClose={handleWhiteBoardClose} 
                            />
                        </Suspense>
                    )}
                </ClientOnly>
            </div>
        </div>
    );
};

export default WhiteBoardDialog;