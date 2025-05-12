
import type { JSONValue, Message } from 'ai';
import React, { type RefCallback, useEffect, useRef, useState } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { Menu } from '~/components/sidebar/Menu.client';
import { IconButton } from '~/components/ui/IconButton';
import { Workbench } from '~/components/workbench/Workbench.client';
import { classNames } from '~/utils/classNames';
import { PROVIDER_LIST } from '~/utils/constants';
import { Messages } from './Messages.client';
import { SendButton } from './SendButton.client';
import { APIKeyManager, getApiKeysFromCookies } from './APIKeyManager';
import Cookies from 'js-cookie';
import * as Tooltip from '@radix-ui/react-tooltip';

import styles from './BaseChat.module.scss';
import { ExportChatButton } from '~/components/chat/chatExportAndImport/ExportChatButton';
import { ImportButtons } from '~/components/chat/chatExportAndImport/ImportButtons';
import { ExamplePrompts } from '~/components/chat/ExamplePrompts';
import GitCloneButton from './GitCloneButton';

import FilePreview from './FilePreview';
import { ModelSelector } from '~/components/chat/ModelSelector';
import { SpeechRecognitionButton } from '~/components/chat/SpeechRecognition';
import type { ProviderInfo } from '~/types/model';
import { ScreenshotStateManager } from './ScreenshotStateManager';
import { toast } from 'react-toastify';
import StarterTemplates from './StarterTemplates';
import type { ActionAlert, SupabaseAlert, DeployAlert } from '~/types/actions';
import DeployChatAlert from '~/components/deploy/DeployAlert';
import ChatAlert from './ChatAlert';
import type { ModelInfo } from '~/lib/modules/llm/types';
import ProgressCompilation from './ProgressCompilation';
import type { ProgressAnnotation } from '~/types/context';
import type { ActionRunner } from '~/lib/runtime/action-runner';
import { LOCAL_PROVIDERS } from '~/lib/stores/settings';
import { SupabaseChatAlert } from '~/components/chat/SupabaseAlert';
import { SupabaseConnection } from './SupabaseConnection';
import { ExpoQrModal } from '~/components/workbench/ExpoQrModal';
import { expoUrlAtom } from '~/lib/stores/qrCodeStore';
import { useStore } from '@nanostores/react';
import { StickToBottom, useStickToBottomContext } from '~/lib/hooks';
import useViewport from '~/lib/hooks';
import { PRICING_URL } from '~/config';
import MediaFile from '../others/MediaFile';
import useUser from '~/types/user';
import FileUploadMenu from '../others/FileDropMenu';
// import MediaFile from '../others/MediaFile';
import Crawler from '../others/Crawler';
import WhiteBoardDialog from '../others/WhiteBoardDialog';
import { LoadingOverlay } from '../ui/LoadingOverlay';
import Templates from '../others/Templates';
import ShinyText from '../ui/AnimatedText';
import { RepositorySelectionDialog } from '../@settings/tabs/connections/components/RepositorySelectionDialog';
import { generateId } from '~/utils/fileUtils';
import ignore from 'ignore';
import { useGit } from '~/lib/hooks/useGit';
import { Button } from '../ui/Button';
import { GradientIconBox } from '../ui/GradientIconBox';
import { GithubConnectionDialog } from '../others/GithubConnectionDialog';
import { getAll, type ChatHistoryItem } from '~/lib/persistence';
// import { ConnectionApps } from '../others/ConnectionApps';

const TEXTAREA_MIN_HEIGHT = 76;
const EXAMPLE_PROMPTS = [
  { text: 'Create a Personal Portfolio for me. My name is John Doe, who is the CEO of Websparks Corporations. I want Dark Background but Light Beam focus the every section with stunning color pallete. I want use more and more section and Stunning Color pallete. Use React Jsx and tailwind css.' },
  { text: 'Create a SaaS Landing Page for my startup. My Startup Name is StartMotion. I want Light Dark Background color using gradient and Light Beam focus the every section. Use React Jsx and tailwind css' },
  { text: 'Create a modern, responsive landing page for a fictional SaaS company. The landing page should include the following sections: A header with the company logo, navigation links, and a call-to-action button.A hero section with a catchy headline, brief description, and a prominent call-to-action.A features section highlighting 3-4 key features of StreamLine.A testimonials section with quotes from satisfied customers.A pricing section with different plan options.A final call-to-action section to encourage sign-ups.A footer with important links and social media icons.' },
  { text: 'Create a modern, minimalist newsletter signup form for a fictional brand.The signup form should include the following elements:A centered card with subtle shadow and rounded corners.A white card on a subtle purple gradient backdrop for a clean, modern look.A logo or brand mark displayed at the top.A welcoming headline, e.g., "Subscribe to My Newsletter," and a brief subheading explaining the value proposition.Social sign-up options with recognizable icons.An email input field and a prominent call-to-action button (e.g., purple or indigo).Additional links below the form for terms, privacy, or help. A footer with trust indicators, such as "We respect your privacy.' },
];
interface BaseChatProps {
  textareaRef?: React.RefObject<HTMLTextAreaElement> | undefined;
  messageRef?: RefCallback<HTMLDivElement> | undefined;
  scrollRef?: RefCallback<HTMLDivElement> | undefined;
  showChat?: boolean;
  menuOpen: boolean;
  chatStarted?: boolean;
  isStreaming?: boolean;
  onStreamingChange?: (streaming: boolean) => void;
  messages?: Message[];
  description?: string;
  enhancingPrompt?: boolean;
  promptEnhanced?: boolean;
  input?: string;
  model?: string;
  setModel?: (model: string) => void;
  provider?: ProviderInfo;
  setProvider?: (provider: ProviderInfo) => void;
  providerList?: ProviderInfo[];
  handleStop?: () => void;
  sendMessage?: (event: React.UIEvent, messageInput?: string) => void;
  handleInputChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  enhancePrompt?: () => void;
  importChat?: (description: string, messages: Message[]) => Promise<void>;
  exportChat?: () => void;
  uploadedFiles?: File[];
  setUploadedFiles?: (files: File[]) => void;
  imageDataList?: string[];
  setImageDataList?: (dataList: string[]) => void;
  actionAlert?: ActionAlert;
  clearAlert?: () => void;
  supabaseAlert?: SupabaseAlert;
  clearSupabaseAlert?: () => void;
  deployAlert?: DeployAlert;
  clearDeployAlert?: () => void;
  data?: JSONValue[] | undefined;
  actionRunner?: ActionRunner;
  setSignInOpen: (open: boolean) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  activeTab: string;
  setActiveTab: (messageId: string) => void;
  setActiveConnection: (messageId: string) => void;
  seletedDatabase?: string;
  list?:ChatHistoryItem[]
}

export const BaseChat = React.forwardRef<HTMLDivElement, BaseChatProps>(
  (
    {
      textareaRef,
      messageRef,
      scrollRef,
      showChat = true,
      menuOpen,
      chatStarted = false,
      isStreaming = false,
      onStreamingChange,
      model,
      setModel,
      provider,
      setProvider,
      providerList,
      input = '',
      enhancingPrompt,
      handleInputChange,
      list=[],

      // promptEnhanced,
      enhancePrompt,
      sendMessage,
      handleStop,
      importChat,
      exportChat,
      uploadedFiles = [],
      setUploadedFiles,
      imageDataList = [],
      setImageDataList,
      messages,
      actionAlert,
      clearAlert,
      deployAlert,
      clearDeployAlert,
      supabaseAlert,
      clearSupabaseAlert,
      data,
      actionRunner,
      setSignInOpen,
      isSettingsOpen,
      setIsSettingsOpen,
      activeTab,
      setActiveTab,
      setActiveConnection,
      seletedDatabase
    },
    ref,
  ) => {
    const TEXTAREA_MAX_HEIGHT = chatStarted ? 400 : 200;
    const [apiKeys, setApiKeys] = useState<Record<string, string>>(getApiKeysFromCookies());
    const [modelList, setModelList] = useState<ModelInfo[]>([]);
    const [isModelSettingsCollapsed, setIsModelSettingsCollapsed] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
    const [transcript, setTranscript] = useState('');
    const [isModelLoading, setIsModelLoading] = useState<string | undefined>('all');
    const [progressAnnotations, setProgressAnnotations] = useState<ProgressAnnotation[]>([]);
    const expoUrl = useStore(expoUrlAtom);
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const { getStoredToken } = useUser();
    const token = getStoredToken();
    const [anchorE2, setAnchorE2] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorE2);
    const [crawlerOpen, setCrawlerOpen] = useState(false);
    const [templateOpen, setTemplateOpen] = useState(false);
    const [openWhiteBoard, setOpenWhiteBoard] = useState<boolean>(false);
    const [crawlerLoading, setCrawlerLoading] = useState<boolean>(false);
    const selectedLanguageRef = useRef('en-US');
    const [currentLanguage, setCurrentLanguage] = useState('en-US');
    const [templateLoading, setTemplateLoading] = useState<boolean>(false);
    const [cumulativeTranscript, setCumulativeTranscript] = useState('');
    const [openGithubConnectionDialog, setOpenGithubConnectionDialog] = useState<boolean>(false);

    const [isGithubOpen, setIsGithubOpen] = useState(false);

    const [isPromptEnhanced, setIsPromptEnhanced] = useState(false);
    useEffect(() => {
      if (expoUrl) {
        setQrModalOpen(true);
      }
    }, [expoUrl]);

    useEffect(() => {
      if (data) {
        const progressList = data.filter(
          (x) => typeof x === 'object' && (x as any).type === 'progress',
        ) as ProgressAnnotation[];
        setProgressAnnotations(progressList);
      }
    }, [data]);
    useEffect(() => {
      console.log(transcript);
    }, [transcript]);

    useEffect(() => {
      onStreamingChange?.(isStreaming);
    }, [isStreaming, onStreamingChange]);

    useEffect(() => {
      if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = selectedLanguageRef.current;
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
          const currentTranscript = Array.from(event.results)
            .map((result) => result[0])
            .map((result) => result.transcript)
            .join('');

          const fullTranscript = cumulativeTranscript + ' ' + currentTranscript;
          setTranscript(fullTranscript.trim());

          if (handleInputChange) {
            const syntheticEvent = {
              target: { value: fullTranscript.trim() },
            } as React.ChangeEvent<HTMLTextAreaElement>;
            handleInputChange(syntheticEvent);
          }
        };

        recognition.onerror = (event) => {
          setIsListening(false);
        };

        setRecognition(recognition);
      }
    }, [cumulativeTranscript]);

    useEffect(() => {
      if (typeof window !== 'undefined') {
        let parsedApiKeys: Record<string, string> | undefined = {};

        try {
          parsedApiKeys = getApiKeysFromCookies();
          setApiKeys(parsedApiKeys);
        } catch (error) {
          console.error('Error loading API keys from cookies:', error);
          Cookies.remove('apiKeys');
        }

        setIsModelLoading('all');
        fetch('/api/models')
          .then((response) => response.json())
          .then((data) => {
            const typedData = data as { modelList: ModelInfo[] };
            setModelList(typedData.modelList);
          })
          .catch((error) => {
            console.error('Error fetching model list:', error);
          })
          .finally(() => {
            setIsModelLoading(undefined);
          });
      }
    }, [providerList, provider]);

    const onApiKeysChange = async (providerName: string, apiKey: string) => {
      const newApiKeys = { ...apiKeys, [providerName]: apiKey };
      setApiKeys(newApiKeys);
      Cookies.set('apiKeys', JSON.stringify(newApiKeys));

      setIsModelLoading(providerName);

      let providerModels: ModelInfo[] = [];

      try {
        const response = await fetch(`/api/models/${encodeURIComponent(providerName)}`);
        const data = await response.json();
        providerModels = (data as { modelList: ModelInfo[] }).modelList;
      } catch (error) {
        console.error('Error loading dynamic models for:', providerName, error);
      }

      // Only update models for the specific provider
      setModelList((prevModels) => {
        const otherModels = prevModels.filter((model) => model.provider !== providerName);
        return [...otherModels, ...providerModels];
      });
      setIsModelLoading(undefined);
    };

    const startListening = () => {
      if (token) {
        if (recognition) {
          recognition.start();
          setIsListening(true);
        }
      }
      else {
        setSignInOpen(true);
      }
    };

    const stopListening = () => {
      if (recognition) {
        recognition.stop();
        setIsListening(false);
        setCumulativeTranscript(transcript);
      }
    };
    const handleClose = () => {
      setAnchorE2(null);
    }

    const handleClickOpenWhiteBoard = () => {
      setOpenWhiteBoard(true);
      setAnchorE2(null);
    };

    const onCrawlerClose = () => {
      setCrawlerOpen(!crawlerOpen);
      setAnchorE2(null);
    }

    const handleGithubClose = () => {
      setIsGithubOpen(!isGithubOpen);
      setAnchorE2(null);
    }

    const handleWhiteBoardClose = () => {
      setOpenWhiteBoard(false);
      setAnchorE2(null);
    };
    const handleSelectClick = (event: React.MouseEvent<HTMLElement>) => {
      if (token) {
        setAnchorE2(event.currentTarget);
      }
      else {
        setSignInOpen(true)
      }
    };
    const handleTemplateClick = (event: React.MouseEvent<HTMLElement>) => {
      if (token) {
        setTemplateOpen(true);
      }
      else {
        setSignInOpen(true)
      }
    };
    const handleLanguageSelect = (value: string) => {
      // First, stop the microphone if it's listening
      if (isListening && recognition) {
        recognition.stop();
        setIsListening(false);

        // Preserve the current text
        const currentValue = textareaRef?.current?.value || '';
        setTranscript(currentValue);
        setCumulativeTranscript(currentValue);
      }

      // Then update the language
      selectedLanguageRef.current = value;
      setCurrentLanguage(value);

      if (recognition) {
        recognition.lang = value;
      }

      handleClose();
    };

    const handleSendMessage = (event: React.UIEvent, messageInput?: string) => {
      if (sendMessage) {
        setIsPromptEnhanced(false);
        sendMessage(event, messageInput);

        if (recognition) {
          recognition.abort(); // Stop current recognition
          setTranscript(''); // Clear transcript
          setCumulativeTranscript('');
          setIsListening(false);
          recognition.stop();

          // Clear the input by triggering handleInputChange with empty value
          if (handleInputChange) {
            const syntheticEvent = {
              target: { value: '' },
            } as React.ChangeEvent<HTMLTextAreaElement>;
            handleInputChange(syntheticEvent);
          }
        }
      }
    };

    const handleFileUpload = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';

      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];

        if (file) {
          const reader = new FileReader();

          reader.onload = (e) => {
            const base64Image = e.target?.result as string;
            setUploadedFiles?.([...uploadedFiles, file]);
            setImageDataList?.([...imageDataList, base64Image]);
          };
          reader.readAsDataURL(file);
        }
      };

      input.click();
    };
    const handleSubscription = () => {
      if (token) {
        window.open(`${PRICING_URL}/${token}`, '_blank');
      } else {
        setSignInOpen(true);
      }
    };

    const handlePaste = async (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;

      if (!items) {
        return;
      }

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();

          const file = item.getAsFile();

          if (file) {
            const reader = new FileReader();

            reader.onload = (e) => {
              const base64Image = e.target?.result as string;
              setUploadedFiles?.([...uploadedFiles, file]);
              setImageDataList?.([...imageDataList, base64Image]);
            };
            reader.readAsDataURL(file);
          }

          break;
        }
      }
    };
    const truncateText = (text: string) => {
      const words = text.split(' ');
      if (words.length > 12) {
        return words.slice(0, 6).join(' ') + '...';
      }
      return text;
    };
    const isSmallViewport = useViewport(1024);

    const baseChat = (
      <div
        ref={ref}
        className={classNames(styles.BaseChat, 'relative flex h-full w-full overflow-hidden')}
        data-chat-visible={showChat}
      >
        <div className='absolute top-0 flex justify-center w-full'>
          <div className="relative" style={{ width: '100%', height: '100%' }}>
            {/* Base logo with low opacity */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="735"
              height="707"
              viewBox="0 0 235 207"
              fill="none"
              className="absolute top-0 left-0 w-full flex justify-center base-logo"
            >
              <g>
                <path
                  className="base-path"
                  d="M138.266 57.3297L39.3216 38.7684C33.8196 37.7361 28.6259 44.3023 31.1578 49.0936L76.583 135.067C80.5739 142.621 87.6013 147.809 96.2307 149.572L194.443 169.643C199.914 170.762 205.191 164.258 202.738 159.416L158.645 72.3741C154.623 64.4335 147.293 59.0223 138.267 57.3289"
                />
                <path
                  className="base-path"
                  d="M76.5836 76.9724V180.814C76.5836 185.753 80.8866 189.135 84.8548 187.315L185.808 141.977C186.934 141.461 187.9 140.565 188.58 139.406C189.26 138.247 189.624 136.878 189.624 135.477V31.6344C189.624 26.6952 185.32 23.3142 181.352 25.1338L80.3986 70.4707C79.2728 70.9874 78.3071 71.8835 77.6267 73.0428C76.9463 74.2021 76.5826 75.5711 76.5826 76.9724"
                />
                <path
                  className="base-path"
                  d="M191.117 115.013L161.157 131.75L158.115 133.451L94.8692 168.512C90.8603 170.75 85.743 167.37 85.743 162.217V64.752C85.743 62.8875 86.5696 61.2779 87.678 60.0655C88.1321 59.5427 88.6471 59.096 89.2081 58.7383C90.7194 57.6889 92.8756 57.4088 94.7084 58.2481L190.613 102.213C195.489 104.45 195.872 112.354 191.117 115.012"
                />
              </g>
            </svg>

            {/* Drawing effect layer */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="735"
              height="707"
              viewBox="0 0 235 207"
              fill="none"
              className="absolute top-0 left-0 w-full flex justify-center"
            >
              <g>
                <path
                  className="draw-path path1"
                  d="M138.266 57.3297L39.3216 38.7684C33.8196 37.7361 28.6259 44.3023 31.1578 49.0936L76.583 135.067C80.5739 142.621 87.6013 147.809 96.2307 149.572L194.443 169.643C199.914 170.762 205.191 164.258 202.738 159.416L158.645 72.3741C154.623 64.4335 147.293 59.0223 138.267 57.3289"
                />
                <path
                  className="draw-path path2"
                  d="M76.5836 76.9724V180.814C76.5836 185.753 80.8866 189.135 84.8548 187.315L185.808 141.977C186.934 141.461 187.9 140.565 188.58 139.406C189.26 138.247 189.624 136.878 189.624 135.477V31.6344C189.624 26.6952 185.32 23.3142 181.352 25.1338L80.3986 70.4707C79.2728 70.9874 78.3071 71.8835 77.6267 73.0428C76.9463 74.2021 76.5826 75.5711 76.5826 76.9724"
                />
                <path
                  className="draw-path path3"
                  d="M191.117 115.013L161.157 131.75L158.115 133.451L94.8692 168.512C90.8603 170.75 85.743 167.37 85.743 162.217V64.752C85.743 62.8875 86.5696 61.2779 87.678 60.0655C88.1321 59.5427 88.6471 59.096 89.2081 58.7383C90.7194 57.6889 92.8756 57.4088 94.7084 58.2481L190.613 102.213C195.489 104.45 195.872 112.354 191.117 115.012"
                />
              </g>
            </svg>
          </div>
        </div>
        <ClientOnly>{() => <Menu list={list} chatStarted={chatStarted} menuOpen={menuOpen} isSettingsOpen={isSettingsOpen} setIsSettingsOpen={setIsSettingsOpen} activeTab={activeTab} setActiveTab={setActiveTab} setActiveConnection={setActiveConnection} />}</ClientOnly>
        <div className="flex flex-col lg:flex-row overflow-y-auto w-full h-full">
          <div className={classNames(styles.Chat, 'flex flex-col flex-grow lg:min-w-[var(--chat-min-width)] h-full')}>
            {!chatStarted && (
              <MediaFile handleFileUpload={handleFileUpload} setSignInOpen={setSignInOpen} handleClickOpenWhiteBoard={handleClickOpenWhiteBoard} onCrawlerClose={onCrawlerClose} />
            )}
            <StickToBottom
              className={classNames('pt-6 px-2 sm:px-6 relative', {
                'h-full flex flex-col modern-scrollbar': chatStarted,
              })}
              resize="smooth"
              initial="smooth"
            >
              <StickToBottom.Content className="flex flex-col gap-4">
                <ClientOnly>
                  {() => {
                    return chatStarted ? (
                      <Messages
                        className="flex flex-col w-full flex-1 max-w-chat pb-6 mx-auto z-1"
                        messages={messages}
                        isStreaming={isStreaming}
                      />
                    ) : null;
                  }}
                </ClientOnly>
              </StickToBottom.Content>
              <div
                className={classNames('my-auto flex flex-col gap-2 w-full max-w-chat mx-auto z-prompt mb-6', {
                  'sticky bottom-0': chatStarted,
                })}
                style={{
                  maxWidth: chatStarted ? 600 : 800
                }}
              >
                <div className="flex flex-col gap-2">
                  {deployAlert && (
                    <DeployChatAlert
                      alert={deployAlert}
                      clearAlert={() => clearDeployAlert?.()}
                      postMessage={(message: string | undefined) => {
                        sendMessage?.({} as any, message);
                        clearSupabaseAlert?.();
                      }}
                    />
                  )}
                  {supabaseAlert && (
                    <SupabaseChatAlert
                      alert={supabaseAlert}
                      clearAlert={() => clearSupabaseAlert?.()}
                      postMessage={(message) => {
                        sendMessage?.({} as any, message);
                        clearSupabaseAlert?.();
                      }}
                    />
                  )}
                  {actionAlert && (
                    <ChatAlert
                      alert={actionAlert}
                      clearAlert={() => clearAlert?.()}
                      postMessage={(message) => {
                        sendMessage?.({} as any, message);
                        clearAlert?.();
                      }}
                    />
                  )}
                </div>
                <ScrollToBottom />
                {!chatStarted && (
                <div id="examples" className="relative w-full max-w-[900px] mx-auto flex justify-center mb-4">
                  <div className="flex flex-wrap gap-1 justify-center">
                    {EXAMPLE_PROMPTS.map((examplePrompt, index) => (
                      index === 0 ? (
                        <div key={index} className="relative group text-xs" onClick={(event) => sendMessage?.(event, examplePrompt.text)}>
                          <div className="absolute -inset-[1px] rounded-full bg-gradient-to-r from-accent-600 to-websparks-elements-borderColor"></div>
                          <button className="relative flex gap-2 items-center h-full px-3 py-1 rounded-full bg-gradient-to-r from-accent-600/30 bg-gray-950 text-[#FFFFFF4F]">
                            <span className="transition-theme">{truncateText(examplePrompt.text)}</span>
                          </button>
                        </div>
                      ) : index === 3 ? (
                        <div key={index} className="relative group text-xs" onClick={(event) => sendMessage?.(event, examplePrompt.text)}>
                          <div className="absolute -inset-[1px] rounded-full bg-gradient-to-l from-accent-600 accent-400"></div>
                          <button className="relative flex gap-2 items-center h-full px-3 py-1 rounded-full bg-gradient-to-l from-accent-600/30 bg-gray-950 text-[#FFFFFF4F]">
                            <span className="transition-theme">{truncateText(examplePrompt.text)}</span>
                          </button>
                        </div>
                      ) : (
                        <div
                          key={index}
                          className="border cursor-pointer border-[#FFFFFF4F] rounded-full bg-gray-950 hover:bg-gray-900 text-[#FFFFFF4F] hover:text-[#FFFFFF4F] px-3 py-1 text-xs transition-theme"
                          data-discover="true"
                          onClick={(event) => sendMessage?.(event, examplePrompt.text)}
                        >
                          {truncateText(examplePrompt.text)}
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}
                {/* {progressAnnotations && <ProgressCompilation data={progressAnnotations} />} */}
                <div className={`bg-black ${chatStarted ? 'rounded-t-lg pb-2' : 'rounded-lg'} relative `}>
                  <div className="absolute top-0 left-0 w-full bg-transparent opacity-50 p-2">
                    <div className="flex justify-between items-center text-white text-xs">
                      <span style={{ fontSize: isSmallViewport ? '11px' : '12px' }}>Need more messages? Get higher limits with Premium.</span>
                      <div className="flex gap-2 items-center">
                        <p
                          href={`${PRICING_URL}/${token}`}
                          onClick={handleSubscription}
                          className={`${isSmallViewport ? 'text-xs' : 'text-xs'} cursor-pointer text-emerald-400 hover:text-emerald-300 bg-transparent`}
                        >
                          Upgrade Plan
                        </p>
                      </div>
                    </div>
                  </div>
                  <div
                    className={classNames(
                      'bg-white/10 backdrop-blur-md p-3 rounded-lg border border-[#FFFFFF1A] relative max-w-chat w-full mx-auto z-prompt mt-7',
                      {
                        'sticky bottom-6': chatStarted,
                      },
                    )}
                    style={{
                      maxWidth: chatStarted ? 600 : 800
                    }}
                  >
                  
                  <FilePreview
                      files={uploadedFiles}
                      imageDataList={imageDataList}
                      onRemove={(index) => {
                        setUploadedFiles?.(uploadedFiles.filter((_, i) => i !== index));
                        setImageDataList?.(imageDataList.filter((_, i) => i !== index));
                      }}
                    />
                  <ClientOnly>
                      {() => (
                        <ScreenshotStateManager
                          setUploadedFiles={setUploadedFiles}
                          setImageDataList={setImageDataList}
                          uploadedFiles={uploadedFiles}
                          imageDataList={imageDataList}
                        />
                      )}
                    </ClientOnly>
                  
                    <textarea
                      ref={textareaRef}
                      className={classNames(
                        'w-full pr-16 outline-none resize-none text-[#FFF] placeholder-[#FFFFFF4F] bg-transparent text-sm',
                        'transition-all duration-200',
                        'hover:border-websparks-elements-focus',
                      )}
                      onFocus={() => {
                        // When the user clicks in the textarea, stop listening
                        if (isListening && recognition) {
                          recognition.stop();
                          setIsListening(false);

                          // Preserve the current text
                          const currentValue = textareaRef?.current?.value || '';
                          setTranscript(currentValue);
                          setCumulativeTranscript(currentValue);
                        }
                      }}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        e.currentTarget.style.border = '2px solid #1488fc';
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.style.border = '2px solid #1488fc';
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.currentTarget.style.border = '1px solid var(--websparks-elements-borderColor)';
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.style.border = '1px solid var(--websparks-elements-borderColor)';

                        const files = Array.from(e.dataTransfer.files);
                        files.forEach((file) => {
                          if (file.type.startsWith('image/')) {
                            const reader = new FileReader();

                            reader.onload = (e) => {
                              const base64Image = e.target?.result as string;
                              setUploadedFiles?.([...uploadedFiles, file]);
                              setImageDataList?.([...imageDataList, base64Image]);
                            };
                            reader.readAsDataURL(file);
                          }
                        });
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          if (event.shiftKey) {
                            return;
                          }

                          event.preventDefault();

                          if (isStreaming) {
                            handleStop?.();
                            return;
                          }

                          // ignore if using input method engine
                          if (event.nativeEvent.isComposing) {
                            return;
                          }

                          handleSendMessage?.(event);
                        }
                      }}
                      value={input}
                      onChange={(event) => {
                        const newValue = event.target.value;

                        // If the user has manually deleted text while the microphone is active
                        if (isListening && recognition && newValue.length < transcript.length) {
                          // Stop the recognition
                          recognition.stop();
                          setIsListening(false);

                          // Reset all transcript states
                          setTranscript(newValue);
                          setCumulativeTranscript(newValue);
                        } else {
                          // Normal case - just update the states
                          setTranscript(newValue);
                          setCumulativeTranscript(newValue);
                        }

                        // Pass the event to the parent handler
                        handleInputChange?.(event);
                      }}
                      onPaste={handlePaste}
                      style={{
                        minHeight: TEXTAREA_MIN_HEIGHT,
                        maxHeight: TEXTAREA_MAX_HEIGHT,
                      }}
                      placeholder="What you want to build?"
                      translate="no"
                    />
                    <ClientOnly>
                      {() => (
                        <SendButton
                          show={input.length > 0 || isStreaming || uploadedFiles.length > 0}
                          isStreaming={isStreaming}
                          disabled={!providerList || providerList.length === 0}
                          onClick={(event) => {
                            if (isStreaming) {
                              handleStop?.();
                              return;
                            }

                            if (input.length > 0 || uploadedFiles.length > 0) {
                              handleSendMessage?.(event);
                            }
                          }}
                        />
                      )}
                    </ClientOnly>
                    <div className="flex justify-between items-center text-sm p-4 pt-2">
                      <div className="flex gap-1 items-center">
                        <IconButton title="Upload file" className="transition-all" onClick={handleSelectClick}>
                          <div className="i-ph:plus text-accent-500 text-xl"></div>
                        </IconButton>
                        <IconButton
                          title="Enhance prompt"
                          disabled={input.length === 0 || enhancingPrompt}
                          className={classNames('transition-all', enhancingPrompt ? 'opacity-100' : '')}
                          onClick={() => {
                            if (token) {
                              enhancePrompt?.();
                              setIsPromptEnhanced(true);

                            } else {
                              setSignInOpen(true);
                            }
                          }}
                        >
                          {enhancingPrompt ? (
                            <div className="i-svg-spinners:90-ring-with-bg text-accent-500 text-xl animate-spin"></div>
                          ) : isPromptEnhanced ? (
                            <div className="i-ph:shooting-star text-xl text-yellow-400"></div>
                          ) : (
                            <div className="i-ph:shooting-star text-xl bg-gradient-to-r from-blue-400 to-purple-500"></div>

                          )}
                        </IconButton>

                        <SpeechRecognitionButton
                          isListening={isListening}
                          onStart={startListening}
                          onStop={stopListening}
                          disabled={isStreaming}
                          selectedLanguage={currentLanguage}
                          onLanguageChange={handleLanguageSelect}
                          setSignInOpen={setSignInOpen}
                        />
                        <IconButton
                          title="Website Templates"
                          className="transition-all bg-transparent"
                          onClick={handleTemplateClick}
                        >
                          <div className="i-iconoir:window-tabs text-accent-500 text-xl"></div>
                        </IconButton>
                        <IconButton title="Upload file" className="transition-all">
                          <div className="i-material-icon-theme:database text-xl"></div>
                          <span>{seletedDatabase}</span>
                        </IconButton>
                        {/* {chatStarted && <ClientOnly>{() => <ExportChatButton exportChat={exportChat} />}</ClientOnly>} */}
                        {/* <IconButton
                          title="Model Settings"
                          className={classNames('transition-all flex items-center gap-1', {
                            'bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent':
                              isModelSettingsCollapsed,
                            'bg-bolt-elements-item-backgroundDefault text-bolt-elements-item-contentDefault':
                              !isModelSettingsCollapsed,
                          })}
                          onClick={() => setIsModelSettingsCollapsed(!isModelSettingsCollapsed)}
                          disabled={!providerList || providerList.length === 0}
                        >
                          <div className={`i-ph:caret-${isModelSettingsCollapsed ? 'right' : 'down'} text-lg`} />
                          {isModelSettingsCollapsed ? <span className="text-xs">{model}</span> : <span />}
                        </IconButton> */}
                      </div>
                      {/* <SupabaseConnection /> */}
                      {/* <div
                        onClick={() => setOpenConnectionApps(true)}
                        title="Connect Apps"
                        className='transition-all cursor-pointer hover:opacity-80'
                      // disabled={!ready || loading}
                      >
                        <GitHubSVG />
                      </div> */}
                      {/* <div
                        onClick={() => {
                          if (token) {
                            setIsGithubOpen(true);
                          } else {
                            setSignInOpen(true);
                          }
                        }}
                        title="Connect Apps"
                        className='transition-all cursor-pointer hover:opacity-80'
                      >
                        <GradientIconBox iconClassName="i-codicon:github-inverted text-white text-xl" />
                      </div> */}
                      <GitCloneButton importChat={importChat} />
                    </div>
                  
                </div>
              </div>
              </div>
          
            </StickToBottom>
            
          </div>
          <ClientOnly>
            {() => (
              <Workbench
                actionRunner={actionRunner ?? ({} as ActionRunner)}
                chatStarted={chatStarted}
                isStreaming={isStreaming}
              />
            )}
          </ClientOnly>
        </div>
        <Crawler
          crawlerOpen={crawlerOpen}
          onCrawlerClose={onCrawlerClose}
          setUploadedFiles={setUploadedFiles}
          setImageDataList={setImageDataList}
          uploadedFiles={uploadedFiles}
          imageDataList={imageDataList}
          setCrawlerLoading={setCrawlerLoading}
        />
        <Templates
          templateOpen={templateOpen}
          onTemplatesClose={() => setTemplateOpen(false)}
          importChat={importChat}
          setTemplateLoading={setTemplateLoading}
        />
        <WhiteBoardDialog
          openWhiteBoard={openWhiteBoard}
          handleWhiteBoardClose={handleWhiteBoardClose}
          setUploadedFiles={setUploadedFiles}
          setImageDataList={setImageDataList}
          uploadedFiles={uploadedFiles}
          imageDataList={imageDataList}
        />

        <FileUploadMenu open={open} anchorE2={anchorE2} handleClose={handleClose} handleFileUpload={handleFileUpload} handleClickOpenWhiteBoard={handleClickOpenWhiteBoard} onCrawlerClose={onCrawlerClose} handleGithubClose={handleGithubClose} />
      </div>
    );

    return <Tooltip.Provider delayDuration={200}>{baseChat}</Tooltip.Provider>;
  },
);

function ScrollToBottom() {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  return (
    !isAtBottom && (
      <button
        className="absolute z-50 top-[0%] translate-y-[-100%] text-4xl rounded-lg left-[50%] translate-x-[-50%] px-1.5 py-0.5 flex items-center gap-2 bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor text-bolt-elements-textPrimary text-sm"
        onClick={() => scrollToBottom()}
      >
        Go to last message
        <span className="i-ph:arrow-down animate-bounce" />
      </button>
    )
  );
}
