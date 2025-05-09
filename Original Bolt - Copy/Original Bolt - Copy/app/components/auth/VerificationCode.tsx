import React, { useEffect, useRef, useState } from 'react';
import Logo from '../../icons/roundedlogo.svg';
import useAuth from './useAuth';
import { Input } from '../ui/Input';
import { classNames } from '~/utils/classNames';
import { Button } from '../ui/Button';

interface VerificationProps {
    verificationOpen: boolean;
    handleVerificationOpen: (email: string) => void;
    handleSignInOpen: () => void;
    handleVerficationClose: () => void;
    email: string | null;
}

const VerificationCode: React.FC<VerificationProps> = ({
    verificationOpen,
    email,
    handleSignInOpen,
    handleVerficationClose
}) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const { verifyEmail, resendVerificationCode } = useAuth();
    const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
    const [errors, setErrors] = useState<boolean[]>(new Array(6).fill(false));
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [loading, setLoading] = useState(false);
    const [isButtonDisabled, setIsButtonDisabled] = useState(true);
    // New state for referral code
    const [referralCode, setReferralCode] = useState<string>('');
    
    // Extract referral code from URL on component mount
    useEffect(() => {
        // Parse URL to extract referral code
        const searchParams = window.location.search;
        // Check if the URL has the format "?=XXXX"
        if (searchParams.startsWith('?=')) {
            const extractedReferralCode = searchParams.substring(2);
            if (extractedReferralCode) {
                setReferralCode(extractedReferralCode);
                console.log('Referral code extracted from URL:', extractedReferralCode);
            }
        }
    }, []);

    useEffect(() => {
        const isFilled = verificationCode.every(digit => digit !== '');
        setIsButtonDisabled(!isFilled);
    }, [verificationCode]);

    const handleVerificationChange = (index: number, value: string) => {
        const newVerificationCode = [...verificationCode];
        newVerificationCode[index] = value.toUpperCase();
        setVerificationCode(newVerificationCode);

        if (value) {
            const newErrors = [...errors];
            newErrors[index] = false;
            setErrors(newErrors);
        }

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').toUpperCase();
        const pastedChars = pastedData.split('').slice(0, 6);

        const newVerificationCode = [...verificationCode];
        pastedChars.forEach((char, index) => {
            if (index < 6) {
                newVerificationCode[index] = char;
            }
        });

        setVerificationCode(newVerificationCode);
        const newErrors = [...errors];
        pastedChars.forEach((_, index) => {
            newErrors[index] = false;
        });
        setErrors(newErrors);
        const nextEmptyIndex = newVerificationCode.findIndex(char => char === '');
        const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
        inputRefs.current[focusIndex]?.focus();
    };

    // Handle referral code change
    const handleReferralCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setReferralCode(e.target.value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!email) {
            setError('Email is required');
            return;
        }

        const enteredCode = verificationCode.join('');

        if (enteredCode.length < 6) {
            setError('Verification code must be 6 digits.');
            return;
        }

        try {
            setLoading(true);
            // Pass the referral code to the verifyEmail function
            const result = await verifyEmail(email, enteredCode, referralCode);

            if (result.success) {
                window.location.reload()
                handleVerficationClose();
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (!email) {
            setError('Email is required');
            return;
        }

        setError('');
        setSuccess('');

        try {
            const result = await resendVerificationCode(email);
            if (result.success) {
                setSuccess(result.message);
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError('Failed to resend verification code. Please try again.');
        }
    };

    if (!verificationOpen) return null;

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

                {/* Logo with glow effect */}
                <div className="flex justify-center w-full mb-2 relative">
                    <img src={Logo} alt="Logo" className="h-12 w-auto relative z-10" />
                </div>

                {/* Title with enhanced styling */}
                <div className="my-6">
                    <h2 className="text-xl font-bold text-center font-montserrat bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 tracking-wide">
                        Verification Code
                    </h2>
                    <p className="text-sm text-center font-montserrat text-gray-300 mt-1">
                        Enter The 6 Digit Code Sent to your Email<br />{email}.
                    </p>
                </div>

                {/* Divider with shine effect */}
                <div className="my-6 flex items-center">
                    <div className="flex-grow h-px bg-gradient-to-r from-transparent via-gray-400/20 to-transparent"></div>
                    <span className="px-3 text-sm font-montserrat text-gray-300">Enter Code</span>
                    <div className="flex-grow h-px bg-gradient-to-r from-transparent via-gray-400/20 to-transparent"></div>
                </div>

                {/* Form with enhanced styling */}
                <form onSubmit={handleSubmit}>
                    <div>
                        {/* Verification code inputs */}
                        <div className="grid grid-cols-6 gap-2 max-w-md mx-auto">
                            {verificationCode.map((digit, index) => (
                                <div key={index} className="relative">
                                    <Input
                                        ref={el => inputRefs.current[index] = el}
                                        id={`verification-${index}`}
                                        type="text"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleVerificationChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e as React.KeyboardEvent<HTMLInputElement>)}
                                        onPaste={handlePaste}
                                        className={classNames('w-full bg-transparent border border-alpha-white-10 outline-none focus:outline-none text-gray-200 text-center font-bold', {
                                            'border-red-500': false,
                                        })}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Referral Code Input */}
                        {/* <div className="mt-6">
                            <div className="flex items-center">
                                <div className="flex-grow h-px bg-gradient-to-r from-transparent via-gray-400/20 to-transparent"></div>
                                <span className="px-3 text-sm font-montserrat text-gray-300">Referral Code (Optional)</span>
                                <div className="flex-grow h-px bg-gradient-to-r from-transparent via-gray-400/20 to-transparent"></div>
                            </div>
                            <div className="mt-4">
                                <Input
                                    id="referral-code"
                                    type="text"
                                    placeholder="Enter referral code (if any)"
                                    value={referralCode}
                                    onChange={handleReferralCodeChange}
                                    className="w-full bg-transparent border border-alpha-white-10 outline-none focus:outline-none text-gray-200 px-3 py-2"
                                />
                            </div>
                        </div> */}

                        {/* Error and success messages */}
                        <div className="mt-4">
                            {error && (
                                <div className="mb-2 px-4 py-3 bg-red-500/20 border border-red-500/30 text-red-300 rounded-xl text-center text-sm">
                                    {error}
                                </div>
                            )}
                            {success && !error && (
                                <div className="mb-2 px-4 py-3 bg-green-500/20 border border-green-500/30 text-green-300 rounded-xl text-center text-sm">
                                    {success}
                                </div>
                            )}
                        </div>

                        {/* Submit button with animated gradient */}
                        <Button
                            type="submit"
                            disabled={isButtonDisabled || loading}
                            className={`relative w-full flex justify-center items-center p-3.5 rounded-xl text-white font-medium text-base transition-all duration-300 mt-6
                                ${isButtonDisabled || loading ? 'bg-gray-700 cursor-not-allowed opacity-70' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 cursor-pointer'}
                                overflow-hidden group shadow-lg shadow-blue-900/20`}
                        >
                            <span className={`absolute inset-0 w-full h-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 ${!isButtonDisabled && !loading ? 'group-hover:opacity-100' : ''} transition-opacity duration-300`}></span>
                            <span className="relative flex items-center justify-center">
                                {loading ? (
                                    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : 'Verify Code'}
                                {!loading && !isButtonDisabled && (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                    </svg>
                                )}
                            </span>
                        </Button>

                        {/* Resend code link */}
                        <div className="flex justify-center items-center my-6">
                            <button
                                type="button"
                                onClick={handleResendCode}
                                className="text-blue-400 hover:text-blue-300 transition-colors duration-200 font-montserrat font-bold text-sm cursor-pointer bg-transparent"
                                style={{ background: 'transparent' }}
                            >
                                Resend Verify Code
                            </button>
                        </div>

                        {/* Divider with glow effect */}
                        <div className="h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent my-6"></div>

                        {/* Footer with enhanced styling */}
                        <div className="flex justify-center items-center">
                            <span className="text-sm text-gray-400">
                                Secured by <span className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Websparks</span>
                            </span>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VerificationCode;