
import { useStore } from '@nanostores/react';
import { ClientOnly } from 'remix-utils/client-only';
import { chatStore } from '~/lib/stores/chat';
import { classNames } from '~/utils/classNames';
import Logo from '../../../icons/logo.svg';
import { ChatDescription } from '~/lib/persistence/ChatDescription.client';
import useViewport from '~/lib/hooks/useViewport';
import useAuth from '../auth/useAuth';
import useUser from '~/types/user';
import { useState } from 'react';
import SupabaseDropdown from './SupabaseDropdown';
import { useSupabaseConnection } from '~/lib/hooks/useSupabase';
import { useFirebaseConnection } from '~/lib/hooks/useFirebase';
import { FirebaseDropdown } from './FirebaseDropdown';

interface HeaderProps {
  handleMenuOpen: () => void;
  handleMenuClose: () => void;
  handleSignInOpen: () => void;
  handleSignUpOpen: () => void;
  isStreaming: boolean;
  setIsSupabaseConnectionDialogOpen?: (value: boolean) => void;
  setIsFirebaseConnectionDialogOpen?: (value: boolean) => void;
}

export const Header = ({ handleMenuOpen, handleSignInOpen, handleSignUpOpen, isStreaming, setIsSupabaseConnectionDialogOpen, setIsFirebaseConnectionDialogOpen }: HeaderProps) => {
  const chat = useStore(chatStore);
  const isSmallViewport = useViewport(1024);
  const { authState } = useAuth();
  const { getStoredToken } = useUser();
  const token = getStoredToken();

  const [supabaseOpen, setSupabaseOpen] = useState<boolean>(false);
  const [firebaseOpen, setFirebaseOpen] = useState<boolean>(false);

  // Use custom hooks to get data and loading states
  const { connection: supabaseData, connecting: isSupabaseLoading } = useSupabaseConnection();
  const { connection: firebaseData, connecting: isFirebaseLoading, initialFetch } = useFirebaseConnection();
  const isAuthLoading = isSupabaseLoading || isFirebaseLoading;
  const isLoggedIn = !!authState.access_token || !!token;

  const handleSupabaseMenuToggle = (event: React.MouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
    setSupabaseOpen(!supabaseOpen);
    setFirebaseOpen(false);
  };

  const handleFirebaseMenuToggle = (event: React.MouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
    setFirebaseOpen(!firebaseOpen);
    setSupabaseOpen(false);
  };

  return (
    <header
      className={classNames('flex justify-between items-center p-5 border-b h-[var(--header-height)]', {
        'border-transparent': !chat.started,
        'border-alpha-white-10': chat.started,
      })}
    >
      <div className="flex items-center gap-2 z-logo text-[#FFF] cursor-pointer">
        <div
          className="i-ph:sidebar-simple-duotone text-xl"
          onClick={isLoggedIn ? handleMenuOpen : handleSignInOpen}
        />
        <a href="/" className="text-2xl font-semibold text-accent flex items-center">
          <div className="flex items-center gap-1">
            <img src={Logo} width={30} height={40} alt="Logo" />
            {isSmallViewport ? (
              <></>
            ) : (
              <p className="font-semibold text-sm">Websparks</p>
            )}
          </div>
        </a>
      </div>

      {chat.started && (
        <ClientOnly fallback={<span className="flex-1 px-4 truncate text-center text-[#FFF]"></span>}>
          {() => (
            <span className="flex-1 px-4 truncate text-center text-[#FFF]">
              <ChatDescription />
            </span>
          )}
        </ClientOnly>
      )}

      {(!isLoggedIn && !isAuthLoading) ? (
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={handleSignInOpen}
            className="border rounded-md py-1 px-4 bg-transparent border-alpha-white-10"
          >
            <span className="font-['Montserrat'] text-xs text-white">
              Login
            </span>
          </button>

          <button
            onClick={handleSignUpOpen}
            className="border rounded-md py-1 px-4 bg-gradient-to-r from-blue-400 to-purple-500 border-alpha-white-10"
          >
            <span className={`font-['Montserrat'] text-xs text-white`}>
              Sign Up
            </span>
          </button>
        </div>
      ) : (
        chat.started && (
          <ClientOnly>
            {() => (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSupabaseMenuToggle}
                  className="flex items-center gap-2 border rounded-md py-1 px-4 bg-transparent hover:bg-gray-900 border-alpha-white-10"
                >
                  <div className="i-material-icon-theme:supabase text-md" />
                  <span className={`text-sm text-white`}>
                    <span className='hidden lg:inline'>Supabase</span> {supabaseData.stats?.totalProjects > 0 ? `(${supabaseData.stats?.totalProjects})` : ''}
                  </span>
                </button>
                <button
                  onClick={handleFirebaseMenuToggle}
                  className="flex items-center gap-2 border rounded-md py-1 px-4 bg-transparent hover:bg-gray-900 border-alpha-white-10"
                >
                  <div className="i-vscode-icons:file-type-firebase text-md" />
                  <span className={`text-sm text-white`}>
                    <span className='hidden lg:inline'>Firebase</span> {firebaseData.stats?.projects.length > 0 ? `(${firebaseData.stats?.projects.length})` : ''}
                  </span>
                </button>
                {supabaseOpen && (
                  <SupabaseDropdown
                    isOpen={supabaseOpen}
                    onClose={() => setSupabaseOpen(false)}
                    selectedProjectID={supabaseData.selectedProjectId || firebaseData.selectedAppId}
                    projects={supabaseData.stats?.projects}
                    // onDataChange={refetchSupabaseData} 
                    isStreaming={isStreaming}
                    setIsSupabaseConnectionDialogOpen={setIsSupabaseConnectionDialogOpen}
                  />
                )}
                {firebaseOpen && (
                  <FirebaseDropdown
                    isOpen={firebaseOpen}
                    onClose={() => setFirebaseOpen(false)}
                    initialFetch={initialFetch}
                    selectedAppID={firebaseData.selectedAppId || supabaseData.selectedProjectId}
                    projects={firebaseData.stats?.projects}
                    // onDataChange={fetchFirebaseData}
                    isStreaming={isStreaming}
                    setIsFirebaseConnectionDialogOpen={setIsFirebaseConnectionDialogOpen}
                  />
                )}
              </div>
            )}
          </ClientOnly>
        )
      )}
    </header>
  );
};