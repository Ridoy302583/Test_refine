import React, { useRef, useState } from 'react';
import { API_BASE_URL } from '~/config';
import Logo from '../../icons/roundedlogo.svg';
import useUser from '~/types/user';
import { toast } from 'react-toastify';
import { classNames } from '~/utils/classNames';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';

interface FeedBackProps {
    feedbackOpen: boolean;
    onFeedbackClose: () => void;
}

const FeedBack: React.FC<FeedBackProps> = ({ feedbackOpen, onFeedbackClose }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [formData, setFormData] = useState({
        content: '',
        rating: 0
    });
    const [selectedEmoji, setSelectedEmoji] = useState("");
    const [error, setError] = useState('');
    const { getStoredToken, user } = useUser();
    const token = getStoredToken();
    const feedbacker_email = user?.email;
    const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);

    const emojis = [
        { emoji: "😡", mood: "Angry", value: 1 },
        { emoji: "😕", mood: "Unhappy", value: 2 },
        { emoji: "😐", mood: "Neutral", value: 3 },
        { emoji: "🙂", mood: "Satisfied", value: 4 },
        { emoji: "😄", mood: "Very Happy", value: 5 }
    ];

    const handleOverlayClick = (e: React.MouseEvent) => {
        // Only close if the click is directly on the overlay (not its children)
        if (e.target === e.currentTarget) {
            onFeedbackClose();
        }
    };

    const handleEmoji = (emoji: React.SetStateAction<string>, rating: number) => {
        setSelectedEmoji(emoji);
        setFormData(prev => ({
            ...prev,
            rating
        }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData((prevState) => ({
            ...prevState,
            [id]: value,
        }));
        if (error) setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate form
        if (!formData.content.trim()) {
            setError('Please enter your feedback message');
            return;
        }

        if (formData.rating === 0) {
            setError('Please select a rating');
            return;
        }

        setIsFeedbackLoading(true);
        try {
            // Add the selected emoji to the content
            const contentWithEmoji = `${selectedEmoji} ${formData.content}`;

            const requestBody = {
                feedbacker_email: feedbacker_email,
                content: contentWithEmoji,
                rating: formData.rating,
                mood: emojis.find(e => e.value === formData.rating)?.mood || 'Not specified'
            };

            const response = await fetch(`${API_BASE_URL}/post-feedbacks`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Server error');
            }

            const result = await response.json();
            if (result) {
                onFeedbackClose();
                setFormData({ content: '', rating: 0 });
                setSelectedEmoji("");
                toast.success(`Thank you! Your feedback has been submitted.`);
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'An unexpected error occurred');
        } finally {
            setIsFeedbackLoading(false);
        }
    };

    // Generate preview content with emoji
    const previewContent = selectedEmoji && formData.content ?
        `${selectedEmoji} ${formData.content}` : '';

    if (!feedbackOpen) return null;

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
                className="relative w-full max-w-2xl p-6 bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-lg rounded-2xl border border-purple-500/20 text-white shadow-2xl overflow-hidden z-[1001]"
                style={{
                    animation: 'scaleIn 0.3s ease-out forwards'
                }}
            >
                {/* Background decorative elements */}
                

                {/* Close button */}
                <button
                    onClick={isFeedbackLoading ? undefined : onFeedbackClose}
                    disabled={isFeedbackLoading}
                    className={`absolute top-4 right-4 text-white text-opacity-70 hover:text-opacity-100 transition-opacity bg-transparent ${isFeedbackLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                    aria-label="Close"
                    style={{ background: 'transparent' }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Logo with glow effect */}
                <div className="flex justify-center w-full mb-2 relative">
                    <div className="absolute inset-0 bg-blue-500/20 filter blur-xl rounded-full scale-75 opacity-70"></div>
                    <img src={Logo} alt="Logo" className="h-12 w-auto relative z-10" />
                </div>

                {/* Title with enhanced styling */}
                <div className="my-6">
                    <h2 className="text-xl font-bold text-center font-montserrat bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 tracking-wide">
                        Feedback
                    </h2>
                    <p className="text-sm text-center font-montserrat text-gray-300 mt-1">
                        Share your thoughts and help us improve
                    </p>
                </div>

                {/* Emoji Rating Box */}
                <div className="my-6">
                    <h3 className="text-sm font-medium mb-3 text-center text-white">How would you rate your experience?</h3>
                    <div className="flex justify-center space-x-4">
                        {emojis.map((item) => (
                            <button
                                key={item.value}
                                type="button"
                                onClick={() => handleEmoji(item.emoji, item.value)}
                                className={`relative w-12 h-12 rounded-full transition-all duration-200 flex items-center justify-center ${selectedEmoji === item.emoji
                                    ? 'bg-gradient-to-r from-blue-600/40 to-purple-600/40 transform scale-110 ring-2 ring-purple-500/50'
                                    : 'bg-black/30 hover:bg-black/40'}`}
                            >
                                <span className="text-2xl">{item.emoji}</span>
                                <span className={`absolute -bottom-6 text-xs whitespace-nowrap ${selectedEmoji === item.emoji ? 'opacity-100' : 'opacity-70'}`}>
                                    {item.mood}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Divider with shine effect */}
                <div className="my-8 flex items-center">
                    <div className="flex-grow h-px bg-gradient-to-r from-transparent via-gray-400/20 to-transparent"></div>
                    <span className="px-3 text-sm font-montserrat text-gray-300">Your Message</span>
                    <div className="flex-grow h-px bg-gradient-to-r from-transparent via-gray-400/20 to-transparent"></div>
                </div>

                {/* Preview section */}
                {/* {previewContent && (
                    <div className="mb-4 p-3 bg-blue-900/20 rounded-xl border border-blue-500/30">
                        <div className="flex items-center mb-1">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1 text-blue-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-xs uppercase font-medium text-blue-400">Preview</span>
                        </div>
                        <p className="text-gray-200 text-sm">{previewContent}</p>
                    </div>
                )} */}

                {/* Form with enhanced styling */}
                <form onSubmit={handleSubmit}>
                    <div>
                        <div className="relative">
                            <Textarea
                                id="content"
                                placeholder="Tell us what you think or suggest improvements..."
                                value={formData.content}
                                onChange={handleChange}
                                disabled={isFeedbackLoading}
                                className={classNames('w-full bg-transparent border border-alpha-white-10 outline-none focus:outline-none text-gray-200', {
                                    'border-red-500': false,
                                })}
                                rows={5}
                            />
                        </div>

                        {/* Error message */}
                        {error && (
                            <div className="mt-2 mb-4 px-4 py-3 bg-red-500/20 border border-red-500/30 text-red-300 rounded-xl text-center text-sm">
                                {error}
                            </div>
                        )}

                        {/* Submit button with animated gradient */}
                        <Button
                            type="submit"
                            disabled={isFeedbackLoading}
                            className={`relative w-full flex justify-center items-center p-3.5 rounded text-white font-medium text-base transition-all duration-300 mt-6
                                ${isFeedbackLoading ? 'bg-gray-700 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 cursor-pointer'}
                                overflow-hidden group shadow-lg shadow-blue-900/20`}
                        >
                            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                            <span className="relative flex items-center justify-center">
                                {isFeedbackLoading ? 'Loading...' : 'Continue'}
                                {!isFeedbackLoading && (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                    </svg>
                                )}
                            </span>
                        </Button>
                    </div>
                </form>

                {/* Divider with glow effect */}
                <div className="my-6 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>

                {/* Footer with enhanced styling */}
                <div className="flex justify-center items-center">
                    <span className="text-sm text-gray-400">
                        Thank you for your feedback!
                    </span>
                </div>
            </div>
        </div>
    );
};

export default FeedBack;