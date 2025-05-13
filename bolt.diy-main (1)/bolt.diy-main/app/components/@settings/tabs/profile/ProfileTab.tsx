import { useState, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { classNames } from '~/utils/classNames';
import { profileStore, updateProfile } from '~/lib/stores/profile';
import { toast } from 'react-toastify';
import { debounce } from '~/utils/debounce';
import { motion } from 'framer-motion';
import * as Tooltip from '@radix-ui/react-tooltip';
import useUser from '~/types/user';
import { PRICING_URL } from '~/config';

export default function ProfileTab() {
  const { getStoredToken, user, plan } = useUser();
  const user_token = getStoredToken();
  
  const formatNumber = (num: number) => {
    if (!num) return '0';
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toString();
  };
  
  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 200,
        damping: 20,
        mass: 0.6,
      },
    },
  };
  
  return (
    <div className="max-w-2xl mx-auto">
      <div className='w-full flex items-center justify-center mb-6 text-white'>
        <div className="w-full">
          <motion.div 
            layout 
            variants={itemVariants}
            className="mb-6"
          >
            <Tooltip.Provider delayDuration={200}>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <div className='flex flex-col items-center gap-4 mb-4'>
                    <div className="relative">
                      <div className="h-24 w-24 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 p-0.5">
                        <img
                          src={user?.profile_pic}
                          alt={user?.full_name || 'Profile picture'}
                          className="h-full w-full rounded-full object-cover bg-gray-900"
                          crossOrigin='anonymous'
                        />
                      </div>
                      {/* Green active status dot with improved styling */}
                      <div className="absolute bottom-0 right-0 h-5 w-5 rounded-full bg-green-500 border-2 border-gray-900 shadow-lg"></div>
                    </div>
                    <div className='flex flex-col items-center gap-2'>
                      <p className='font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400'>{user?.full_name}</p>
                      <span className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white text-xs px-3 py-1 rounded-full border border-blue-500/20">
                        {plan?.name} Plan
                      </span>
                    </div>
                  </div>
                </Tooltip.Trigger>
              </Tooltip.Root>
            </Tooltip.Provider>
          </motion.div>
          
          <div className='grid grid-cols-1 gap-4'>
            <motion.div 
              layout 
              variants={itemVariants}
              initial="hidden"
              animate="visible"
            >
              <Tooltip.Provider delayDuration={200}>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <div className='w-full h-full min-w-[160px] border border-purple-500/20 rounded-xl bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm shadow-lg overflow-hidden'>
                      <h4 className="text-white mb-2 border-b border-purple-500/20 py-3 px-4 font-medium bg-gradient-to-r from-blue-600/10 to-purple-600/10">
                        Profile Details
                      </h4>
                      <div className="w-full overflow-x-auto p-4">
                        <table className="w-full table-fixed text-white">
                          <colgroup>
                            <col className="w-1/3" />
                            <col />
                          </colgroup>
                          <tbody>
                            <tr>
                              <td className="p-2 text-gray-400">Name</td>
                              <td className="p-2">{user?.full_name}</td>
                            </tr>
                            <tr>
                              <td className="p-2 text-gray-400">Email</td>
                              <td className="p-2">{user?.email}</td>
                            </tr>
                            <tr>
                              <td className="p-2 text-gray-400">Role</td>
                              <td className="p-2">{user?.role}</td>
                            </tr>
                            <tr>
                              <td className="p-2 text-gray-400">Plan</td>
                              <td className="p-2">
                                <span className="font-bold">{plan?.name} </span>
                                {plan?.name !== 'Enterprise' && (
                                  <a 
                                    href={`${PRICING_URL}/${user_token}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:text-blue-300 transition-colors ml-1"
                                  >
                                    (Upgrade)
                                  </a>
                                )}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </Tooltip.Trigger>
                </Tooltip.Root>
              </Tooltip.Provider>
            </motion.div>
            
            <motion.div 
              layout 
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.15 }}
            >
              <Tooltip.Provider delayDuration={200}>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <div className='w-full h-full min-w-[160px] border border-purple-500/20 rounded-xl bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm shadow-lg overflow-hidden'>
                      <h4 className="text-white mb-2 border-b border-purple-500/20 py-3 px-4 font-medium bg-gradient-to-r from-blue-600/10 to-purple-600/10">
                        Token Management
                      </h4>
                      <div className="w-full overflow-x-auto p-4">
                        <table className="w-full table-fixed text-white">
                          <colgroup>
                            <col className="w-1/3" />
                            <col />
                          </colgroup>
                          <tbody>
                            <tr>
                              <td className="p-2 text-gray-400">Total Tokens</td>
                              <td className="p-2 font-medium">{formatNumber(plan?.total_token)}</td>
                            </tr>
                            <tr>
                              <td className="p-2 text-gray-400">Usage Tokens</td>
                              <td className="p-2 font-medium">{formatNumber((plan?.total_token || 0) - (plan?.token_available || 0))}</td>
                            </tr>
                            <tr>
                              <td className="p-2 text-gray-400">Remaining Token</td>
                              <td className="p-2 font-medium text-blue-400">{formatNumber(plan?.remaining_token)}</td>
                            </tr>
                          </tbody>
                        </table>
                        
                        {/* Progress bar showing token usage */}
                        <div className="mt-4 px-2">
                          <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full"
                              style={{ 
                                width: `${plan?.remaining_token ? (plan.remaining_token / plan.total_token) * 100 : 0}%` 
                              }}
                            />
                          </div>
                          <p className="text-xs text-gray-400 mt-1 text-right">
                            {plan?.remaining_token ? Math.round((plan.remaining_token / plan.total_token) * 100) : 0}% remaining
                          </p>
                        </div>
                      </div>
                    </div>
                  </Tooltip.Trigger>
                </Tooltip.Root>
              </Tooltip.Provider>
            </motion.div>
            
            {/* Action Buttons */}
            {/* <motion.div 
              layout 
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.3 }}
              className="flex justify-center gap-3 mt-2"
            >
              <button 
                className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium rounded-lg transition-all duration-300 shadow-lg shadow-blue-900/20 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit Profile
              </button>
              
              <button 
                className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg transition-all duration-200 border border-purple-500/20 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2">
                  <path d="m17 11-5-5-5 5" />
                  <path d="M17 18H7" />
                  <path d="M12 16V6" />
                </svg>
                Upgrade Plan
              </button>
            </motion.div> */}
          </div>
        </div>
      </div>
    </div>
  );
}