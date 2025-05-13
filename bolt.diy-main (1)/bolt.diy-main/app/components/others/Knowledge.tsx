//@ts-nocheck
import React, { useState, useEffect } from 'react';
import { Box, CircularProgress, Dialog, TextField } from '@mui/material';
import Logo from '../../../icons/roundedlogo.svg';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '~/config';
import useUser from '~/types/user';
import { workbenchStore } from '~/lib/stores/workbench';
import { useParams } from '@remix-run/react';

const guidelines = [
    {
      id: 1,
      text: 'Define project-specific rules or guidelines to establish a clear framework for development, ensuring consistency and maintainability across the projects lifecycle.'
    },
    {
      id: 2,
      text: 'Set coding style preferences such as indentation, naming conventions, and formatting rules to maintain code readability and facilitate collaboration between team members.'
    },
    {
      id: 3,
      text: 'Include external documentation or style guides as references to standardize development practices and provide comprehensive guidance for the entire development team.'
    }
];

interface KnowledgeProps {
    knowledgeOpen: boolean;
    onKnowledgeClose: () => void;
    urlID: string;
}

const MAX_WORDS = 200;

const Knowledge: React.FC<KnowledgeProps> = ({ knowledgeOpen, onKnowledgeClose, urlID }) => {
    const [formData, setFormData] = useState({ content: '' });
    const [error, setError] = useState('');
    const [wordCount, setWordCount] = useState(0);
    const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
    const { getStoredToken, user} = useUser();
    const token = getStoredToken();
    const { firstArtifact } = workbenchStore;
    const decodedid = firstArtifact?.id + user?.id + firstArtifact?.time;
    const urlId = useParams();

    const countWords = (text: string): number => {
        if (!text) return 0;
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    };

    const fetchKnowledge = async (url_id: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/get-knowledge-base-by-urlid/?urlId=${url_id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch knowledge');
            }
            const content = await response.text();
            const formattedContent = content === 'null' ? '' : content;
            setFormData({ content: formattedContent });
            setWordCount(countWords(formattedContent));
        } catch (error) {
            setError(error instanceof Error ? error.message : 'An unexpected error occurred');
        }
    };
    const updateKnowledge = async (url_id: string, knowledge_base: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/update-knowledge-base/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    urlId: url_id,
                    knowledge_base: knowledge_base
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to update knowledge');
            }
            
            const data = await response.json();
            const content = data?.content || knowledge_base;
            setFormData({ content });
            setWordCount(countWords(content));
        } catch (error) {
            setError(error instanceof Error ? error.message : 'An unexpected error occurred');
            throw error;
        }
    };
    const clearKnowledge = async (url_id: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/remove-knowledge-base/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    urlId: url_id
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to update knowledge');
            }
            setFormData({ content: '' });
        } catch (error) {
            setError(error instanceof Error ? error.message : 'An unexpected error occurred');
            throw error;
        }
    };

    useEffect(() => {
        const id = urlId.id || decodedid;
        if (id) {
            fetchKnowledge(id);
        }
    }, [urlId.id, decodedid]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        const currentWordCount = countWords(value);
        
        if (currentWordCount <= MAX_WORDS) {
            setFormData(prevState => ({
                ...prevState,
                [id]: value
            }));
            setWordCount(currentWordCount);
            setError('');
        } else {
            setError(`Please limit your input to ${MAX_WORDS} words.`);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (wordCount > MAX_WORDS) {
            setError(`Please limit your input to ${MAX_WORDS} words.`);
            return;
        }

        if (!formData.content.trim()) {
            setError('Please enter valid content.');
            return;
        }

        setIsFeedbackLoading(true);
        try {
            const id = urlId.id || decodedid;
            await updateKnowledge(id, formData.content.trim());
            onKnowledgeClose();
            toast.success('Knowledge saved successfully!');
        } catch (error) {
            setError(error instanceof Error ? error.message : 'An unexpected error occurred');
        } finally {
            setIsFeedbackLoading(false);
        }
    };

    const handleClear =()=>{
        if(urlId.id){
            clearKnowledge(urlId.id);
        }
        else{
            clearKnowledge(decodedid);
        }
    }

    return (
        <Dialog
            open={knowledgeOpen}
            onClose={isFeedbackLoading ? undefined : onKnowledgeClose}
            maxWidth={'lg'}
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
           <div className="p-5 text-white">
                <div className="flex justify-center">
                    <img src={Logo} alt="Logo" className="h-10 w-auto" />
                </div>
                <div className='my-3'>
                    <p className='bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 font-bold lg:text-2xl sm:text-lg text-center'>
                        Manage Knowledge
                    </p>
                    <p className='text-center'>
                        Add custom context and instructions for your project. Websparks will use it in every edit. Use it to:
                    </p>
                    <ul className="space-y-4 mt-5">
                        {guidelines.map((item) => (
                        <li key={item.id} className="flex items-start text-white">
                            <span className="flex-shrink-0 w-6 h-6 mt-1">
                            <div className="i-ph:dot-outline-fill text-white" />
                            </span>
                            <span className="text-white">{item.text}</span>
                        </li>
                        ))}
                    </ul>
                </div>
                <form onSubmit={handleSubmit}>
                    <div>
                        <TextField
                            required
                            type="textarea"
                            id="content"
                            placeholder="Enter your custom instruction and condition in here..."
                            fullWidth
                            variant="outlined"
                            multiline
                            rows={9}
                            value={formData.content}
                            onChange={handleChange}
                            disabled={isFeedbackLoading}
                            error={!!error}
                            helperText={'' || `${wordCount}/${MAX_WORDS} words`}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': {
                                        borderColor: 'rgba(211, 211, 211, 0.2)',
                                        borderRadius: '15px',
                                    },
                                    '&:hover fieldset': {
                                        borderColor: 'rgba(211, 211, 211, 0.2)',
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: 'rgba(211, 211, 211, 0.2)',
                                    },
                                    '& input': {
                                        fontFamily: 'Montserrat, sans-serif',
                                        fontSize: 14,
                                        color: '#FFF'
                                    },
                                    '& textarea': {
                                        color: '#FFF',
                                        fontFamily: 'Montserrat, sans-serif',
                                        fontSize: 14,
                                    },
                                    '& input::placeholder': {
                                        fontFamily: 'Montserrat, serif',
                                        opacity: 0.7,
                                        fontSize: 14,
                                        color: '#FFF'
                                    },
                                    '& textarea::placeholder': {
                                        fontFamily: 'Montserrat, serif',
                                        opacity: 0.7,
                                        fontSize: 14,
                                        color: '#FFF'
                                    }
                                },
                                '& .MuiFormHelperText-root': {
                                    color: error ? '#f44336' : '#fff',
                                    marginLeft: 'auto',
                                    textAlign: 'right'
                                }
                            }}
                        />
                        <div className='mt-3 flex gap-2 w-full'>
                            <div
                                onClick={handleClear}
                                className='flex justify-center p-0 items-center rounded-xl w-full bg-red-500 cursor-pointer'
                            >
                                <span className='text-white p-0'>
                                    Clear Knowledge
                                </span>
                            </div>
                            <Box
                                display="flex"
                                justifyContent="center"
                                alignItems="center"
                                p={1}
                                border="1px solid #000"
                                borderRadius={3}
                                width={'100%'}
                                sx={{
                                    background: '#000',
                                    cursor: isFeedbackLoading ? 'default' : 'pointer',
                                    opacity: isFeedbackLoading ? 0.7 : 1,
                                }}
                                onClick={isFeedbackLoading ? undefined : handleSubmit}
                                component="button"
                                type="submit"
                            >
                                {isFeedbackLoading && (
                                    <CircularProgress color="success" size={20} sx={{ mx: 1 }} />
                                )}
                                <span className='text-white'>
                                    Save Knowledge
                                </span>
                                <i className="bi bi-arrow-right" />
                            </Box>
                        </div>
                    </div>
                </form>
            </div>
        </Dialog>
    );
};

export default Knowledge;