import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Connectivity from '../../../../icons/connectivity.png'
import useUser from '~/types/user';
import { toast } from 'react-toastify';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';

// Define interfaces for type safety
interface ReferrerData {
  id: number;
  referred_id: number;
  status: string;
  reward_type: string;
  reward_amount: number;
  reward_claimed: boolean;
  created_at: string;
  relationship: "referrer";
}

interface ReferredData {
  id: number;
  referrer_id: number;
  status: string;
  reward_type: string;
  reward_amount: number;
  reward_claimed: boolean;
  created_at: string;
  relationship: "referred";
}

interface ReferralResponse {
  as_referrer: ReferrerData[];
  as_referred: ReferredData[];
}

export default function ReferralTab() {
  const { user, getStoredToken } = useUser();
  const [referralLink, setReferralLink] = useState('');
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    totalSignups: 0,
    completedSignups: 0,
    tokensEarned: 0,
    referredBy: null as number | null,
    referredStatus: null as string | null,
    referredReward: 0,
    referredRewardClaimed: false
  });
  const [referralsAsReferrer, setReferralsAsReferrer] = useState<ReferrerData[]>([]);
  const [referralsAsReferred, setReferralsAsReferred] = useState<ReferredData[]>([]);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to format status
  const formatStatus = (status: string): string => {
    switch (status) {
      case 'signup_completed':
        return 'Sign-up Completed';
      case 'pending':
        return 'Sign-up Pending';
      case 'registered':
        return 'Registered';
      default:
        return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  // Generate referral link and fetch referral data
  useEffect(() => {
    const fetchReferralData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const token = getStoredToken();
        if (!token) {
          throw new Error('Authentication token not found');
        }

        // Fetch referrals from the real API
        const response = await fetch('https://api.websparks.ai/user/referrals', {
          method: 'GET',
          headers: { 
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const referralsData: ReferralResponse = await response.json();
        
        // Extract referrals made by the user and referrals where the user was referred
        const asReferrer = referralsData.as_referrer || [];
        const asReferred = referralsData.as_referred || [];
        
        // Store the raw referrals data
        setReferralsAsReferrer(asReferrer);
        setReferralsAsReferred(asReferred);
        
        // Calculate statistics from the API response
        const stats = {
          totalReferrals: asReferrer.length,
          totalSignups: asReferrer.length,
          completedSignups: asReferrer.filter(ref => ref.status === "signup_completed").length,
          tokensEarned: asReferrer.reduce((total, ref) => {
            if (ref.status === "signup_completed") {
              return total + ref.reward_amount;
            }
            return total;
          }, 0),
          referredBy: asReferred.length > 0 ? asReferred[0].referrer_id : null,
          referredStatus: asReferred.length > 0 ? asReferred[0].status : null,
          referredReward: asReferred.length > 0 ? asReferred[0].reward_amount : 0,
          referredRewardClaimed: asReferred.length > 0 ? asReferred[0].reward_claimed : false
        };

        // Create referral link
        const referCode = user?.refer_code || '';
        
        // Check if we're in a production environment or local development
        const baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
          ? 'http://localhost:5173'
          : 'https://websparks.ai'; // Replace with your actual production URL
        
        const generatedReferralLink = `${baseUrl}/?=${referCode}`;
        
        setReferralLink(generatedReferralLink);
        setReferralStats(stats);
      } catch (err) {
        console.error('Error fetching referral data:', err);
        setError(err.message);
        toast.error(`Failed to load referral information: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchReferralData();
    }
  }, [user, getStoredToken]);

  // Copy referral link to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink)
      .then(() => {
        setCopied(true);
        toast.success('Referral link copied to clipboard!');
        setTimeout(() => setCopied(false), 3000);
      })
      .catch(err => {
        console.error('Failed to copy:', err);
        toast.error('Failed to copy link');
      });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Error state
  if (error && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="text-red-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Failed to load referral data</h3>
        <p className="text-gray-300 max-w-md mb-4">{error}</p>
        <Button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="w-full h-56 rounded-xl p-6 flex flex-col justify-between shadow-lg overflow-hidden relative"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(37, 99, 235, 0.9), rgba(124, 58, 237, 0.9)), url(${Connectivity})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Glow effects */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-400/20 rounded-full blur-3xl"></div>

        <div className="relative z-10 text-center py-4">
          <h2 className="text-2xl font-bold text-white mb-2">Invite Friends, Earn Tokens</h2>
          <p className="text-white/80 max-w-2xl mx-auto">
            Share your referral link with friends. When they sign up, you both get tokens!
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center max-w-xl mx-auto gap-2">
            <div className="relative w-full">
              <Input
                type="text"
                value={referralLink}
                readOnly
                className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 w-full text-white focus:outline-none focus:ring-2 focus:ring-white/30 pr-10"
              />
              <button
              onClick={copyToClipboard}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white hover:text-blue-200 transition-colors bg-transparent"
              style={{ background: 'transparent' }}
              aria-label="Copy link"
            >
              {copied ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" style={{ background: 'transparent' }}>
                  <path d="M9 2a1 1 0 00-.697 1.717L10.586 6H6a1 1 0 100 2h6a1 1 0 001-1V3a1 1 0 00-1-1H9z" />
                  <path fillRule="evenodd" d="M9 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H9a1 1 0 01-1-1V4zm7 0H9v6h7V4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </svg>
              )}
            </button>
            </div>

            <button
              onClick={copyToClipboard}
              className="h-9 px-4 py-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-websparks-elements-borderColor disabled:pointer-events-none disabled:opacity-50"
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          className="bg-gradient-to-br from-gray-900/90 to-black/90 border border-purple-500/20 rounded-xl p-5 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex flex-col">
            <span className="text-gray-400 text-sm">Total Referrals</span>
            <span className="text-xl font-bold text-white mt-1">{referralStats.totalReferrals}</span>
          </div>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-gray-900/90 to-black/90 border border-purple-500/20 rounded-xl p-5 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex flex-col">
            <span className="text-gray-400 text-sm">Total Sign-ups</span>
            <span className="text-xl font-bold text-white mt-1">{referralStats.totalSignups}</span>
          </div>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-gray-900/90 to-black/90 border border-purple-500/20 rounded-xl p-5 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex flex-col">
            <span className="text-gray-400 text-sm">Completed</span>
            <span className="text-xl font-bold text-white mt-1">{referralStats.completedSignups}</span>
          </div>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-gray-900/90 to-black/90 border border-purple-500/20 rounded-xl p-5 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex flex-col">
            <span className="text-gray-400 text-sm">Tokens Earned</span>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mt-1">
              {referralStats.tokensEarned.toLocaleString()}
            </span>
          </div>
        </motion.div>
      </div>
      
      {/* Referral History */}
      <motion.div
        className="bg-gradient-to-br from-gray-900/90 to-black/90 border border-purple-500/20 rounded-xl p-6 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="text-lg font-semibold text-white mb-4">People You've Referred</h3>
        
        {referralsAsReferrer.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">You haven't referred anyone yet. Share your link to start earning rewards!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Reward</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Claimed</th>
                </tr>
              </thead>
              <tbody>
                {referralsAsReferrer.map((referral) => (
                  <tr key={`referrer-${referral.id}`} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                    <td className="py-3 px-4 text-sm text-gray-300">#{referral.id}</td>
                    <td className="py-3 px-4 text-sm text-gray-300">
                      {new Date(referral.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        referral.status === 'signup_completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {formatStatus(referral.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-300">
                      {referral.reward_amount.toLocaleString()} {referral.reward_type}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {referral.reward_claimed ? (
                        <span className="text-green-500 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Yes
                        </span>
                      ) : (
                        <span className="text-gray-400 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          No
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
      
      {/* When User Was Referred */}
      {referralsAsReferred.length > 0 && (
        <motion.div
          className="bg-gradient-to-br from-gray-900/90 to-black/90 border border-purple-500/20 rounded-xl p-6 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <h3 className="text-lg font-semibold text-white mb-4">You Were Referred By</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Your Reward</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Claimed</th>
                </tr>
              </thead>
              <tbody>
                {referralsAsReferred.map((referral) => (
                  <tr key={`referred-${referral.id}`} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                    <td className="py-3 px-4 text-sm text-gray-300">#{referral.id}</td>
                  
                    <td className="py-3 px-4 text-sm text-gray-300">
                      {new Date(referral.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        referral.status === 'signup_completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {formatStatus(referral.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-300">
                      {referral.reward_amount.toLocaleString()} {referral.reward_type}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {referral.reward_claimed ? (
                        <span className="text-green-500 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Yes
                        </span>
                      ) : (
                        <span className="text-gray-400 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          No
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* How it works section */}
      <motion.div
        className="bg-gradient-to-br from-gray-900/90 to-black/90 border border-purple-500/20 rounded-xl p-6 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h3 className="text-lg font-semibold text-white mb-4">How it works</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col items-center text-center px-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600/30 to-purple-600/30 flex items-center justify-center mb-3">
              <span className="text-white font-bold">1</span>
            </div>
            <h4 className="font-medium text-white mb-2">Share Your Link</h4>
            <p className="text-sm text-gray-300">
              Copy your unique referral link and share it with friends and colleagues.
            </p>
          </div>

          <div className="flex flex-col items-center text-center px-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600/30 to-purple-600/30 flex items-center justify-center mb-3">
              <span className="text-white font-bold">2</span>
            </div>
            <h4 className="font-medium text-white mb-2">Friends Sign Up</h4>
            <p className="text-sm text-gray-300">
              When your friends use your link to create a new account, they'll be connected to you.
            </p>
          </div>

          <div className="flex flex-col items-center text-center px-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600/30 to-purple-600/30 flex items-center justify-center mb-3">
              <span className="text-white font-bold">3</span>
            </div>
            <h4 className="font-medium text-white mb-2">Both Get Rewarded</h4>
            <p className="text-sm text-gray-300">
              You both receive tokens once they complete the sign-up process.
            </p>
          </div>
        </div>
      </motion.div>

      {/* FAQ section */}
      <motion.div
        className="bg-gradient-to-br from-gray-900/90 to-black/90 border border-purple-500/20 rounded-xl p-6 shadow-lg mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <h3 className="text-lg font-semibold text-white mb-4">Frequently Asked Questions</h3>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-white mb-1">How many people can I refer?</h4>
            <p className="text-sm text-gray-300">
              There's no limit! You can refer as many people as you want and earn rewards for each successful referral.
            </p>
          </div>

          <div>
            <h4 className="font-medium text-white mb-1">When do I receive my tokens?</h4>
            <p className="text-sm text-gray-300">
              Tokens are automatically credited to your account once your referred friend completes the sign-up process.
            </p>
          </div>

          <div>
            <h4 className="font-medium text-white mb-1">Can my referred friends also refer others?</h4>
            <p className="text-sm text-gray-300">
              Yes! Everyone can participate in the referral program and earn tokens by inviting their friends.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-white mb-1">What happens if my referral doesn't complete the sign-up?</h4>
            <p className="text-sm text-gray-300">
              You'll only receive tokens when referrals complete the full sign-up process. Incomplete referrals will show in your dashboard but won't generate rewards until completed.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}