//@ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from '@mui/material';
import Logo from '../../../icons/roundedlogo.svg';
import { toast } from 'react-toastify';
import useUser from '~/types/user';
import { API_BASE_URL } from '~/config';
import { useParams } from '@remix-run/react';
import { workbenchStore } from '~/lib/stores/workbench';

interface Asset {
    id: number;
    urlId: string;
    image_url: string;
    used: string;
    created_at: string;
}

interface StoreAssetsProps {
    assetsOpen: boolean;
    onAssetsClose: () => void;
    uploadedFiles?: File[];
    setUploadedFiles?: (files: File[]) => void;
    imageDataList?: string[];
    setImageDataList?: (dataList: string[]) => void;
    input?: string;  // Add this
    setInput?: (value: string | ((prevInput: string) => string)) => void;  // Add this
}

const StoreAssets: React.FC<StoreAssetsProps> = ({ assetsOpen, onAssetsClose, uploadedFiles = [], setUploadedFiles, imageDataList = [], setImageDataList, input = '',  // Add this
    setInput }) => {
    const { getStoredToken, user } = useUser();
    const token = getStoredToken();
    const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { firstArtifact } = workbenchStore;
    const decodedid = firstArtifact ? firstArtifact.id + user?.id + firstArtifact.time : '';
    const urlId = useParams();

    // New states for file renaming
    const [showRenameDialog, setShowRenameDialog] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [newFileName, setNewFileName] = useState('');

    const fetchAssets = async (url_id: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/get-project-assets-by-urlid?urlId=${url_id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (Array.isArray(data)) {
                setAssets(data);
            } else if (data.assets && Array.isArray(data.assets)) {
                setAssets(data.assets);
            } else {
                setAssets([]);
            }
            return data;
        }
        catch (error) {
            // console.error('Fetch error:', error);
            setAssets([]);
            toast.error('Failed to fetch assets');
        }
    }

    const deleteAssets = async (assets_id: string) => {
        const targetId = urlId.id || decodedid;
        setDeletingIds(prev => new Set(prev).add(assets_id));

        try {
            const response = await fetch(`${API_BASE_URL}/delete-project-assets-by-id/?asset_id=${assets_id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data) {
                await fetchAssets(targetId);
                toast.success('Asset deleted successfully');
            }
        }
        catch (error) {
            toast.error('Failed to delete asset');
        } finally {
            setDeletingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(assets_id);
                return newSet;
            });
        }
    }

    const uploadImage = async (file: File, customFileName: string) => {
        const targetId = urlId.id || decodedid;
        try {
            setIsFeedbackLoading(true);
            const formData = new FormData();

            // Create a new File object with the custom name
            const fileExtension = file.name.split('.').pop();
            const renamedFile = new File([file], `${customFileName}-${crypto.randomUUID().slice(0, 8)}.${fileExtension}`, {
                type: file.type,
                lastModified: file.lastModified,
            });

            formData.append('image', renamedFile);
            const uploadUrl = `${API_BASE_URL}/post-project-assets/?urlId=${targetId}&used=false`;

            const response = await fetch(uploadUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Upload failed: ${errorText}`);
            }

            await response.json();
            toast.success('Asset uploaded successfully');
            await fetchAssets(targetId);

        } catch (error) {
            // console.error('Upload error:', error);
            toast.error('Failed to upload asset');
        } finally {
            setIsFeedbackLoading(false);
        }
    }

    const handleFileUpload = () => {
        fileInputRef.current?.click();
    };

    const handleDelete = async (assets_id: string) => {
        if (token) {
            await deleteAssets(assets_id);
        }
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            // Set initial filename without extension
            const fileName = file.name.split('.')[0];
            setNewFileName(fileName);
            setShowRenameDialog(true);
        }
        event.target.value = '';
    };

    const handleRenameSubmit = async () => {
        if (selectedFile && newFileName.trim()) {
            await uploadImage(selectedFile, newFileName.trim());
            setShowRenameDialog(false);
            setSelectedFile(null);
            setNewFileName('');
        }
    };

    useEffect(() => {
        const targetId = urlId?.id || decodedid;
        if (targetId) {
            fetchAssets(targetId);
        }
    }, [urlId?.id, decodedid]);

    const handleCopyLink = (assetUrl: string) => {
        const cdnUrl = assetUrl.replace('/Project_Images', '');
        navigator.clipboard.writeText(`https://cdn.websparks.ai${cdnUrl}`);
        toast.success('Link copied to clipboard');
    };

    const handleUseImage = async (assetUrl: string) => {
        // Transform API URL to CDN URL
        const cdnUrl = assetUrl.replace('/Project_Images', '');
        const fullImageUrl = `${API_BASE_URL}${assetUrl}`; // Keep this for fetching
        
        try {
            const response = await fetch(fullImageUrl);
            const blob = await response.blob();
            const fileName = assetUrl.split('/').pop() || 'image.jpg';
            const file = new File([blob], fileName, { type: blob.type });
            const spacer = input ? '\n' : '';
            // Use cdnUrl instead of fullImageUrl when setting input
            setInput?.((prevInput) => prevInput + spacer + `https://cdn.websparks.ai${cdnUrl}`);
            toast.success('Image added successfully');
            onAssetsClose();
        } catch (error) {
            toast.error('Failed to add image');
        }
    };
    return (
        <>
            <Dialog
                open={assetsOpen}
                onClose={isFeedbackLoading ? undefined : onAssetsClose}
                maxWidth={'xl'}
                sx={{
                    '& .MuiDialog-paper': {
                        borderRadius: '10px',
                        border: `1px solid rgba(211, 211, 211, 0.1)`,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(15px)'
                    }
                }}
                BackdropProps={{
                    sx: {
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        backdropFilter: 'blur(8px)',
                    },
                }}
            >
                {/* Main content */}
                <div className="p-5 text-white">
                    <div className="flex justify-center">
                        <img src={Logo} alt="Logo" className="h-10 w-auto" />
                    </div>
                    <div className='my-3'>
                        <p className='bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 font-bold lg:text-2xl sm:text-lg text-center'>
                            Store Assets
                        </p>
                        <p className='text-center'>
                            Add your project assets here, and it will use our Websparks.
                        </p>
                    </div>
                    <div>
                        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                            {Array.isArray(assets) && assets.map((asset, index) => (
                                <div key={index} className='relative border border-[#FFFFFF1A] rounded p-2 h-36'>
                                    <img
                                        src={`${API_BASE_URL}${asset.image_url}`}
                                        crossOrigin='anonymous'
                                        alt={`Asset ${index + 1}`}
                                        className="h-full w-full object-cover"
                                    />
                                    <div className='absolute bottom-0 left-0 w-full border-t border-[#FFFFFF1A] bg-white/10 backdrop-blur-lg'>
                                        <div className='flex justify-between items-center text-center'>
                                            <div
                                                className='w-full p-1 rounded-lb cursor-pointer hover:bg-[#FFFFFF1A]'
                                                onClick={() => handleCopyLink(asset.image_url)}
                                            >
                                                <p className='text-[12px] text-blue-500 font-bold'>Copy Link</p>
                                            </div>
                                            <div
                                                className='w-full p-1 rounded-rb cursor-pointer hover:bg-[#FFFFFF1A]'
                                                onClick={() => handleUseImage(asset.image_url)}
                                            >
                                                <p className='text-[12px] text-green-500 font-bold'>Use Image</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        className={`absolute top-3 right-3 bg-red-500 p-1 rounded ${deletingIds.has(asset.id.toString()) ? 'opacity-50' : 'cursor-pointer'}`}
                                        onClick={() => !deletingIds.has(asset.id.toString()) && handleDelete(asset.id.toString())}
                                    >
                                        {deletingIds.has(asset.id.toString()) ? (
                                            <div className="animate-spin i-ph:spinner" />
                                        ) : (
                                            <div className="i-ph:trash" />
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div onClick={handleFileUpload} className='relative border border-dashed border-[#FFFFFF59] rounded p-2 h-36 flex justify-center items-center cursor-pointer'>
                                <div className='text-center flex flex-col justify-center items-center'>
                                    <div className='i-ph:plus' />
                                    <p>Add Image</p>
                                </div>
                            </div>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />
                    </div>
                </div>
            </Dialog>

            {/* Rename Dialog */}
            <Dialog
                open={showRenameDialog}
                maxWidth="sm"
                sx={{
                    '& .MuiDialog-paper': {
                        borderRadius: '10px',
                        border: `1px solid rgba(211, 211, 211, 0.1)`,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(15px)'
                    }
                }}
            >
                <div className="p-5 text-white">
                    <h2 className="text-lg font-bold mb-4">Rename Image</h2>
                    <input
                        type="text"
                        value={newFileName}
                        onChange={(e) => setNewFileName(e.target.value)}
                        className="w-full p-2 mb-4 bg-white/10 border border-[#FFFFFF1A] rounded text-white"
                        placeholder="Enter new file name"
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            className="px-4 py-2 text-sm text-white bg-gray-600 rounded hover:bg-gray-700"
                            onClick={() => setShowRenameDialog(false)}
                            disabled={isFeedbackLoading}
                        >
                            Cancel
                        </button>
                        <button
                            className="px-4 py-2 text-sm text-white bg-accent-500 rounded hover:bg-accent-600 disabled:opacity-50 flex items-center gap-2"
                            onClick={handleRenameSubmit}
                            disabled={!newFileName.trim() || isFeedbackLoading}
                        >
                            {isFeedbackLoading ? (
                                <>
                                    <div className="animate-spin i-ph:spinner h-4 w-4" />
                                    Uploading...
                                </>
                            ) : (
                                'Upload'
                            )}
                        </button>
                    </div>
                </div>
            </Dialog>
        </>
    );
};

export default StoreAssets;