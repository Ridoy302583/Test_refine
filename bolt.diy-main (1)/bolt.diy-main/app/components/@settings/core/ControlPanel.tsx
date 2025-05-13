import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as RadixDialog from '@radix-ui/react-dialog';
import { classNames } from '~/utils/classNames';
import { DialogTitle } from '~/components/ui/Dialog';
import ProfileTab from '~/components/@settings/tabs/profile/ProfileTab';
import FeaturesTab from '~/components/@settings/tabs/features/FeaturesTab';
import ConnectionsTab from '../tabs/connections/ConnectionsTab';
import BillingTab from '../tabs/billings/BillingTab';
import useAuth from '~/components/auth/useAuth';
import useUser from '~/types/user';
import { PRICING_URL } from '~/config';
import ReferralTab from '../tabs/referal/ReferralTab';
import PromptsTab from '../tabs/prompts/promptstab';

type TabType = 'profile' | 'features' | 'billings' | 'connections' | 'prompts' | 'referral' ;

interface ControlPanelProps {
  open: boolean;
  onClose: () => void;
}

// Tab labels mapping
const TAB_LABELS = {
  'profile': 'Profile',
  'features': 'Features',
  'billings': 'Billings',
  'connections': 'Connections',
  'prompts': 'Custom Prompts',
  'referral': (
    <span className="text-green-400">Get Free Tokens</span>
  ),
};

export const ControlPanel = ({ open, onClose }: ControlPanelProps) => {
  // State for active tab
  const [activeTab, setActiveTab] = useState<TabType | null>(null);
  const [loadingTab, setLoadingTab] = useState<TabType | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { logout } = useAuth();
  const { getStoredToken } = useUser();
  const user_token = getStoredToken();
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);
  
  // Icon mapping for tab navigation using SVGs
  const tabIcons = {
    'profile': (<div className='i-solar:user-broken text-xl w-5 h-5' />),
    'features': (<div className='i-hugeicons:stars text-xl w-5 h-5' />),
    'billings': (<div className='i-solar:card-broken text-xl w-5 h-5' />),
    'connections': (<div className='i-ph:plugs-connected text-xl w-5 h-5' />),
    'prompts': (<div className='i-fluent:prompt-24-regular text-xl w-5 h-5' />),
    'referral': (<div className='i-ph:users-four text-xl w-5 h-5 text-green-400' />),
  };

  // Fixed tabs - added 'prompts' tab
  const tabs: TabType[] = ['profile', 'features', 'billings', 'connections', 'prompts', 'referral'];

  // Reset to default view when modal opens/closes
  useEffect(() => {
    if (!open) {
      // Reset when closing
      setActiveTab(null);
      setLoadingTab(null);
      setMobileMenuOpen(false);
    } else {
      // When opening, set to null to show the main view
      setActiveTab(null);
    }
  }, [open]);

  // Handle closing
  const handleClose = () => {
    setActiveTab(null);
    setLoadingTab(null);
    setMobileMenuOpen(false);
    onClose();
  };

  // Handle going back to main view
  const handleBack = () => {
    if (activeTab) {
      setActiveTab(null);
    }
  };

  // Get the component for the selected tab
  const getTabComponent = (tabId: TabType) => {
    switch (tabId) {
      case 'profile':
        return <ProfileTab />;
      case 'features':
        return <FeaturesTab />;
      case 'billings':
        return <BillingTab />;
      case 'connections':
        return <ConnectionsTab />;
      case 'prompts':
        return <PromptsTab />;
      case 'referral':
        return <ReferralTab />;
      default:
        return null;
    }
  };

  // Handle tab click
  const handleTabClick = (tabId: TabType) => {
    setLoadingTab(tabId);
    setActiveTab(tabId);
    setMobileMenuOpen(false); // Close mobile menu when a tab is selected

    // Clear loading state after a delay
    setTimeout(() => setLoadingTab(null), 500);
  };

  const handleUpgradeClick = () => {
    if (user_token) {
      window.open(`${PRICING_URL}/${user_token}`, '_blank');
    }
    setMobileMenuOpen(false);
  };

  const handleClickLogout = () => {
    setIsLogoutLoading(true);
    // logout(user_token || '');
    logout(getStoredToken() || '');
    setMobileMenuOpen(false);
  }

  return (
    <RadixDialog.Root open={open}>
      <RadixDialog.Portal>
        <div className="fixed inset-0 flex items-center justify-center z-[100]">
          <RadixDialog.Overlay asChild>
            <motion.div
              className="absolute inset-0 bg-black/70 dark:bg-black/80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
          </RadixDialog.Overlay>

          <RadixDialog.Content
            aria-describedby={undefined}
            onEscapeKeyDown={handleClose}
            onPointerDownOutside={handleClose}
            className="relative z-[101] w-full h-full sm:h-auto"
          >
            <motion.div
              className={classNames(
                'w-full sm:max-w-[95%] md:max-w-[90%] lg:max-w-[1000px] mx-auto',
                'h-full sm:h-[90vh] md:h-[80vh]', // Full height on mobile
                'bg-gradient-to-br from-gray-900/90 to-black/90',
                'sm:rounded-2xl shadow-2xl', // Only rounded on larger screens
                'border border-purple-500/20',
                'flex flex-col overflow-hidden',
                'relative',
              )}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Background gradient */}
              <div className="absolute inset-0 overflow-hidden sm:rounded-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/5 to-transparent"></div>
              </div>

              <div className="relative z-10 flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-purple-500/20">
                  <div className="flex items-center space-x-4">
                    {activeTab && (
                      <button
                        onClick={handleBack}
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-transparent hover:bg-purple-500/10 dark:hover:bg-purple-500/20 group transition-all duration-200"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-gray-300 group-hover:text-purple-500 transition-colors">
                          <path d="M19 12H5" />
                          <path d="M12 19l-7-7 7-7" />
                        </svg>
                      </button>
                    )}
                    <DialogTitle className="text-lg sm:text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                    {activeTab ? (
                        <>
                          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                            {TAB_LABELS[activeTab]}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="hidden sm:inline-block mr-2 text-blue-400">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </span>
                          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                            Settings
                          </span>
                        </>
                      )}
                    </DialogTitle>
                  </div>
                  <div className="flex items-center gap-3">
                    {!activeTab && !mobileMenuOpen && (
                      <button
                        onClick={() => setMobileMenuOpen(true)}
                        className="md:hidden flex items-center justify-center w-8 h-8 rounded-full bg-transparent hover:bg-purple-500/10 group transition-all duration-200"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-gray-300 group-hover:text-purple-500">
                          <line x1="3" y1="12" x2="21" y2="12" />
                          <line x1="3" y1="6" x2="21" y2="6" />
                          <line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={handleClose}
                      className="flex items-center justify-center w-8 h-8 rounded-full bg-transparent hover:bg-purple-500/10 dark:hover:bg-purple-500/20 group transition-all duration-200"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-gray-300 group-hover:text-purple-500 transition-colors">
                        <path d="M18 6L6 18" />
                        <path d="M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Content with vertical tab layout */}
                <div className="flex flex-1 overflow-hidden">
                  {/* Left sidebar with vertical tabs - hidden on mobile unless menu is open */}
                  <div 
                    className={classNames(
                      "md:w-64 border-r border-purple-500/20 bg-transparent md:flex-shrink-0 md:overflow-y-auto",
                      mobileMenuOpen 
                        ? "absolute inset-0 z-20 bg-gradient-to-br from-gray-900/95 to-black/95 block" 
                        : "hidden md:block"
                    )}
                  >
                    {/* Mobile menu close button */}
                    {mobileMenuOpen && (
                      <div className="flex justify-end p-4 md:hidden">
                        <button 
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center justify-center w-8 h-8 rounded-full bg-transparent hover:bg-purple-500/10 group transition-all duration-200"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-gray-300 group-hover:text-purple-500">
                            <path d="M18 6L6 18" />
                            <path d="M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                    
                    <div className="h-full flex flex-col justify-between px-3 py-4">
                      <nav className="space-y-1">
                        {tabs.map((tab) => (
                          <button
                            key={tab}
                            onClick={() => handleTabClick(tab)}
                            className={classNames(
                              'flex items-center w-full px-3 py-2 text-sm rounded-md transition-all',
                              'group relative',
                              activeTab === tab
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600/30 text-white font-semibold'
                                : 'text-gray-300 bg-transparent hover:bg-gray-800'
                            )}
                          >
                            {tabIcons[tab] && (
                              <span className={classNames("mr-3 flex-shrink-0", 
                                activeTab === tab ? "text-white" : "")}
                              >
                                {tabIcons[tab]}
                              </span>
                            )}
                            <span>{TAB_LABELS[tab]}</span>
                            {activeTab === tab && (
                              <span className="ml-auto h-5 w-1.5 rounded-full bg-gradient-to-b from-blue-400 to-purple-500"></span>
                            )}
                          </button>
                        ))}
                      </nav>
                      <nav className="space-y-1">
                        <button
                          onClick={handleUpgradeClick}
                          className={classNames(
                            'flex items-center w-full px-3 py-2 text-sm rounded-md transition-all',
                            'group relative text-gray-300 bg-transparent hover:bg-gradient-to-r from-blue-600/20 to-purple-600/20'
                          )}
                        >
                          <span className="mr-3 flex-shrink-0">
                            <div className="i-solar:archive-up-broken text-xl text-blue-500 w-5 h-5" />
                          </span>
                          <span className='bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 font-bold'>Upgrade Plan</span>
                        </button>
                        <button
                          onClick={handleClickLogout}
                          className={classNames(
                            'flex items-center w-full px-3 py-2 text-sm rounded-md transition-all',
                            'group relative text-red-600 hover:text-white bg-red-500/10 hover:bg-red-800'
                          )}
                        >
                          <span className="mr-3 flex-shrink-0">
                          {isLogoutLoading ? (
                            <div className="animate-spin w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full"></div>
                          ) : (
                            <div className='i-octicon:sign-out-16 text-xl w-5 h-5'/>
                          )}
                          </span>
                          <span className='font-bold'>Logout</span>
                        </button>
                      </nav>
                    </div>
                  </div>

                  {/* Main content area */}
                  <div className={classNames(
                    "flex-1 overflow-y-auto",
                    mobileMenuOpen ? "hidden md:block" : ''
                  )}>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeTab || 'home'}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="p-4 sm:p-6 h-full"
                      >
                        {activeTab ? (
                          getTabComponent(activeTab)
                        ) : (
                          <ProfileTab />
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          </RadixDialog.Content>
        </div>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
};