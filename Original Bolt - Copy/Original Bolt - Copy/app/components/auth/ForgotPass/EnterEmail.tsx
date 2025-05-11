import React, { useRef, useState } from 'react';
import Logo from '../../../icons/roundedlogo.svg';
import useAuth from '../useAuth';
import { Input } from '~/components/ui/Input';
import { classNames } from '~/utils/classNames';
import { Button } from '~/components/ui/Button';

interface EnterEmailProps {
    enterEmailOpen: boolean;
    handleEnterEmailClose: () => void;
    handleForgotVerificationOpen: (email: string) => void;
}

interface FormData {
    email: string;
}

const EnterEmail: React.FC<EnterEmailProps> = ({
    enterEmailOpen,
    handleEnterEmailClose,
    handleForgotVerificationOpen
}) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const { sendForgotPasswordOtp } = useAuth();

    const [formData, setFormData] = useState<FormData>({
        email: '',
    });
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) return 'Email is required';
        if (!emailRegex.test(email)) return 'Enter a valid email address';
        return '';
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: value,
        }));
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const emailError = validateEmail(formData.email);
        if (emailError) {
            setError(emailError);
            return;
        }

        try {
            setLoading(true);
            const result = await sendForgotPasswordOtp(formData.email);

            if (result.success) {
                handleForgotVerificationOpen(formData.email);
                setFormData({ email: '' });
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!enterEmailOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-md overflow-y-auto"
            style={{
                animation: 'fadeIn 0.3s ease-out forwards'
            }}
        >
            <div
                ref={menuRef}
                className="relative w-full max-w-lg p-6 bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-lg rounded-2xl border border-purple-500/20 text-white shadow-2xl z-[1001] my-8"
                style={{
                    animation: 'scaleIn 0.3s ease-out forwards',
                    maxHeight: '90vh',
                    overflowY: 'auto'
                }}
            >
                {/* Background decorative elements */}
                {/* <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-purple-600/20 blur-3xl"></div>
                <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-blue-600/20 blur-3xl"></div> */}

                {/* Close button */}
                <button
                    onClick={handleEnterEmailClose}
                    className="absolute top-4 right-4 text-white text-opacity-70 hover:text-opacity-100 transition-opacity bg-transparent"
                    aria-label="Close"
                    style={{ background: 'transparent' }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Logo with glow effect */}
                <div className="flex justify-center w-full mb-2 relative">
                    <img src={Logo} alt="Logo" className="h-12 w-auto relative z-10" />
                </div>

                {/* Title with enhanced styling */}
                <div className="my-6">
                    <h2 className="text-xl font-bold text-center font-montserrat bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 tracking-wide">
                        Forgot Password
                    </h2>
                    <p className="text-sm text-center font-montserrat text-gray-300 mt-1">
                        Enter your email address to receive a verification code
                    </p>
                </div>

                {/* Divider with shine effect */}
                <div className="my-6 flex items-center">
                    <div className="flex-grow h-px bg-gradient-to-r from-transparent via-gray-400/20 to-transparent"></div>
                    <span className="px-3 text-sm font-montserrat text-gray-300">Enter Email</span>
                    <div className="flex-grow h-px bg-gradient-to-r from-transparent via-gray-400/20 to-transparent"></div>
                </div>

                {/* Form with enhanced styling */}
                <form onSubmit={handleSubmit}>
                    <div>
                        {/* Email field with icon */}
                        <div className="mb-5">
                            <div className="relative group">
                                <Input
                                    required
                                    type="email"
                                    id="email"
                                    placeholder="Enter Your Email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={classNames('w-full bg-transparent border border-alpha-white-10 outline-none focus:outline-none text-gray-200', {
                                        'border-red-500': false,
                                    })}
                                />
                            </div>
                        </div>
                        <div className="mt-4">
                            {error && (
                                <div className="mb-2 px-4 py-3 bg-red-500/20 border border-red-500/30 text-red-300 rounded-xl text-center text-sm">
                                    {error}
                                </div>
                            )}
                        </div>
                        {/* Submit button with animated gradient */}
                        <Button
                            type="submit"
                            disabled={loading}
                            className={`relative w-full flex justify-center items-center p-3.5 rounded text-white font-medium text-base transition-all duration-300 
                                ${loading ? 'bg-gray-700 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 cursor-pointer'}
                                overflow-hidden group shadow-lg shadow-blue-900/20 mt-2`}
                        >
                            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                            <span className="relative flex items-center justify-center">
                                {loading ? (
                                    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : 'Send Verification Code'}
                                {!loading && (
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
                        Secured by <span className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Websparks</span>
                    </span>
                </div>
            </div>
        </div>
    );
};

export default EnterEmail;