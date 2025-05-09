import { json, type MetaFunction } from '@remix-run/cloudflare';
import { useState } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '~/components/chat/BaseChat';
import { Chat } from '~/components/chat/Chat.client';
import { Header } from '~/components/header/Header';
import BackgroundRays from '~/components/ui/BackgroundRays';
import useUser from '~/types/user';

// Import authentication components
import EnterEmail from '~/components/auth/ForgotPass/EnterEmail';
import ForgetVerficationCode from '~/components/auth/ForgotPass/ForgetVerficationCode';
import PasswordSet from '~/components/auth/ForgotPass/PasswordSet';
import Login from '~/components/auth/Login';
import SignUp from '~/components/auth/SignUp';
import VerificationCode from '~/components/auth/VerificationCode';

// Import other components
import FeedBack from '~/components/others/FeedBack';
import UpgradeModal from '~/components/others/UpgradeModal';
import { SupabaseConnectionDialog } from '~/components/others/SupabaseConnectionDialog';
import { FirebaseConnectionDialog } from '~/components/others/FirebaseConnectionDialog';
// import { SettingsWindow } from '~/components/settings/SettingsWindow';

export const meta: MetaFunction = () => {
  return [
    { title: 'Websparks AI Agent' },
    { name: 'description', content: 'Talk with Websparks AI Agent, an AI assistant from Websparks AI Agent' }
  ];
};

type TabType = 'general' | 'billings' | 'connector';
type TabActive = 'github' | 'supabase' | 'netlify' | 'vercel';

export const loader = () => json({});

/**
 * Landing page component for websparks
 * Enhanced with authentication, settings, feedback, and various modals
 */
export default function Index() {
  const { getStoredToken } = useUser();
  const token = getStoredToken();

  // Authentication states
  const [forgotVerificationEmail, setForgotVerificationEmail] = useState<string | null>(null);
  const [forgotPassCode, setForgotPassCode] = useState<string | null>(null);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);
  const [signinOpen, setSignInOpen] = useState(false);
  const [signUpOpen, setSignUpOpen] = useState(false);
  const [verficationOpen, setVerificationOpen] = useState(false);
  const [enterEmailOpen, setEnterEmailOpen] = useState(false);
  const [forgotVerificationOpen, setForgotVerificationOpen] = useState(false);
  const [passwordSetOpen, setPasswordSetOpen] = useState(false);

  // Settings and menu states
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [activeConnection, setActiveConnection] = useState<TabActive>("github");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [isSupabaseConnectionDialogOpen, setIsSupabaseConnectionDialogOpen] = useState(false);
  const [isFirebaseConnectionDialogOpen, setIsFirebaseConnectionDialogOpen] = useState(false);

  // Other feature states
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [openUpgradeModal, setOpenUpgradeModal] = useState<boolean>(false);
  const [anchorE2, setAnchorE2] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorE2);

  // Authentication handlers
  const handleSignInOpen = () => {
    setSignInOpen(true);
    setPasswordSetOpen(false); // Close password set modal when opening sign in
  }

  const handleSignInClose = () => {
    setSignUpOpen(false);
    setSignInOpen(false);
  };

  const handleSignUpOpen = () => {
    setSignUpOpen(true);
    setSignInOpen(false);
  };

  const handleSignUpClose = () => {
    setSignInOpen(false);
    setSignUpOpen(false);
  };

  const handleEnterEmailOpen = () => {
    setEnterEmailOpen(true);
    setSignInOpen(false);
  };

  const handleForgotVerificationOpen = (email: string) => {
    setForgotVerificationEmail(email)
    setForgotVerificationOpen(true);
    setEnterEmailOpen(false);
  };

  const handlePasswordSetOpen = (email: string, code: string) => {
    setForgotVerificationEmail(email);
    setForgotPassCode(code);
    setPasswordSetOpen(true);
    setEnterEmailOpen(false);
    setForgotVerificationOpen(false)
  };

  const handlePasswordSetClose = () => {
    setPasswordSetOpen(false);
  };

  const handlePasswordResetSuccess = () => {
    setPasswordSetOpen(false); // Close the password set modal
    setSignInOpen(true); // Open the sign in modal
  };

  const handleEnterEmailClose = () => {
    setEnterEmailOpen(false);
    setSignInOpen(false);
  };

  const handleVerficationOpen = (email: string) => {
    setVerificationEmail(email);
    setVerificationOpen(true);
    setSignUpOpen(false);
  };

  const handleVerficationClose = () => {
    setVerificationOpen(false);
    setSignUpOpen(false);
    setSignInOpen(false);
  };

  // Menu handlers
  const handleMenuOpen = () => {
    setMenuOpen(!menuOpen);
  }

  const handleMenuClose = () => {
    setMenuOpen(false);
  }

  // Other feature handlers
  const handleClickOpenUpgrade = () => {
    setOpenUpgradeModal(true);
  };

  const handleUpgradeClose = () => {
    setOpenUpgradeModal(false);
    setAnchorE2(null);
  };

  const openFeedback = () => {
    if (token) {
      setFeedbackOpen(true);
    }
    else {
      handleSignInOpen();
    }
  }

  const onFeedbackClose = () => {
    setFeedbackOpen(false);
  }

  return (
    <>
      <div className="flex flex-col h-full w-full bg-bolt-elements-background-depth-1">
        <BackgroundRays />
        <Header
          setIsSupabaseConnectionDialogOpen={setIsSupabaseConnectionDialogOpen}
          setIsFirebaseConnectionDialogOpen={setIsFirebaseConnectionDialogOpen}
          handleMenuOpen={handleMenuOpen}
          handleMenuClose={handleMenuClose}
          handleSignInOpen={handleSignInOpen}
          handleSignUpOpen={handleSignUpOpen}
          isStreaming={isStreaming}
        />
        <ClientOnly fallback={
          <BaseChat
            setSignInOpen={setSignInOpen}
            menuOpen={menuOpen}
            isSettingsOpen={isSettingsOpen}
            setIsSettingsOpen={setIsSettingsOpen}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            setActiveConnection={setActiveConnection}
          />
        }>{() =>
          <Chat
            setSignInOpen={setSignInOpen}
            handleClickOpenUpgrade={handleClickOpenUpgrade}
            menuOpen={menuOpen}
            isSettingsOpen={isSettingsOpen}
            setIsSettingsOpen={setIsSettingsOpen}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            setActiveConnection={setActiveConnection}
            setIsStreaming={setIsStreaming}
          />
          }
        </ClientOnly>

        {/* Feedback button */}
        <div style={{ right: '-70px' }} onClick={() => openFeedback()} className="fixed top-1/2 z-50 bg-gradient-to-r from-blue-400 to-purple-500 rounded no-underline transform -rotate-90 translate-x-[-25px] translate-y-[39px] mt-[-83px] cursor-pointer shadow-lg">
          <div className="flex items-center justify-center px-2">
            <i className="bi bi-chat-square-dots text-white"></i>
            <small className="uppercase text-white font-bold py-2 pe-2 ps-1">Feedback</small>
          </div>
        </div>
      </div>

      {/* Auth components */}
      <Login
        signinOpen={signinOpen}
        handleSignInClose={handleSignInClose}
        handleSignUpOpen={handleSignUpOpen}
        handleEnterEmailOpen={handleEnterEmailOpen}
      />
      <SignUp
        signUpOpen={signUpOpen}
        handleSignUpClose={handleSignUpClose}
        handleSignInOpen={handleSignInOpen}
        handleVerficationOpen={handleVerficationOpen}
      />
      <VerificationCode
        verificationOpen={verficationOpen}
        handleVerificationOpen={handleVerficationOpen}
        email={verificationEmail}
        handleSignInOpen={handleSignInOpen}
        handleVerficationClose={handleVerficationClose}
      />
      <EnterEmail
        enterEmailOpen={enterEmailOpen}
        handleEnterEmailClose={handleEnterEmailClose}
        handleForgotVerificationOpen={handleForgotVerificationOpen}
      />
      <ForgetVerficationCode
        forgotVerificationOpen={forgotVerificationOpen}
        email={forgotVerificationEmail}
        handlePasswordSetOpen={handlePasswordSetOpen}
      />
      <PasswordSet
        passwordSetOpen={passwordSetOpen}
        email={forgotVerificationEmail}
        code={forgotPassCode}
        handleSignInOpen={handlePasswordResetSuccess} // Use the new handler
        handlePasswordSetClose={handlePasswordSetClose} // Add close handler
      />

      {/* Other modals */}
      <UpgradeModal
        openUpgradeModal={openUpgradeModal}
        handleUpgradeClose={handleUpgradeClose}
      />
      <FeedBack
        feedbackOpen={feedbackOpen}
        onFeedbackClose={onFeedbackClose}
      />

      <SupabaseConnectionDialog openSupabaseConnectionDialog={isSupabaseConnectionDialogOpen} onClose={() => setIsSupabaseConnectionDialogOpen(false)} />
      <FirebaseConnectionDialog openFirebaseConnectionDialog={isFirebaseConnectionDialogOpen} onClose={() => setIsFirebaseConnectionDialogOpen(false)} />
      {/* <SettingsWindow 
        open={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        activeConnection={activeConnection} 
        setActiveConnection={setActiveConnection} 
      /> */}
    </>
  );
}