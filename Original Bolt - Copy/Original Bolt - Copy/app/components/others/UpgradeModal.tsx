/*
 * @ts-nocheck
 * Preventing TS checks with files presented in the video for a better presentation.
 */
import React from 'react';
import useUser from '~/types/user';
import { PRICING_URL } from '~/config';

interface UpgradeModalProps {
  openUpgradeModal: boolean;
  handleUpgradeClose: () => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ openUpgradeModal, handleUpgradeClose }) => {
  const { getStoredToken } = useUser();
  const token = getStoredToken();

  const handleUpgradeClick = () => {
    window.location.href = `${PRICING_URL}/${token}`;
  };

  if (!openUpgradeModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-md"
        onClick={handleUpgradeClose}
      ></div>
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-[600px] rounded-xl border border-white/10 bg-white/10 p-6 backdrop-blur-3xl"
        style={{ 
          animation: "slideUp 0.3s ease-out forwards",
        }}
      >
        <div className="text-center text-white">
          <h1 className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-2xl font-bold text-transparent">
            Unleash Limitless Creativity with Premium Access!
          </h1>
          <p className="mt-2">
            Transform your ideas into reality with our Exclusive Feature—designed to
            amplify your results and streamline your journey to success.
          </p>
          <p className="mt-5 mb-1 font-bold text-white">🎯 Why Go Premium?</p>
          <ul className="py-3 text-left">
            <li className="flex items-start pt-5">
              <div className="flex min-w-[40px] justify-center text-[#6C63FF]">
                <i className="bi bi-rocket-takeoff-fill"></i>
              </div>
              <div>
                <p className="font-bold">Exclusive Tools</p>
                <p className="text-sm">
                  Gain access to powerful features that take your prompts to the next
                  level.
                </p>
              </div>
            </li>
            <li className="flex items-start pt-5">
              <div className="flex min-w-[40px] justify-center text-[#6C63FF]">
                <i className="bi bi-speedometer2"></i>
              </div>
              <div>
                <p className="font-bold">Lightning-Fast Processing</p>
                <p className="text-sm">
                  Save time and achieve more with our optimized premium service.
                </p>
              </div>
            </li>
            <li className="flex items-start pt-5">
              <div className="flex min-w-[40px] justify-center text-[#6C63FF]">
                <i className="bi bi-headset"></i>
              </div>
              <div>
                <p className="font-bold">Priority Support</p>
                <p className="text-sm">
                  Enjoy dedicated assistance whenever you need it.
                </p>
              </div>
            </li>
            <li className="flex items-start pt-5">
              <div className="flex min-w-[40px] justify-center text-[#6C63FF]">
                <i className="bi bi-graph-up-arrow"></i>
              </div>
              <div>
                <p className="font-bold">Advanced Insights</p>
                <p className="text-sm">
                  Unlock detailed analytics to perfect your craft.
                </p>
              </div>
            </li>
          </ul>
          <p className="mb-2 text-sm text-white">
            ✨ Don't settle for less—step into the premium experience and make every
            prompt count.
          </p>
          <div className="mt-5 flex justify-center">
            <button
              onClick={handleUpgradeClick}
              className="flex items-center rounded bg-gradient-to-r from-blue-400 to-purple-500 px-4 py-2 text-sm font-bold text-white transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:ring-opacity-50"
            >
              <i className="bi bi-check-circle-fill mr-2"></i> Upgrade Now
            </button>
          </div>
        </div>
      </div>
      
      {/* CSS for animation */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default UpgradeModal;