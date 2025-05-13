import * as Dialog from '@radix-ui/react-dialog';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { classNames } from '~/utils/classNames';
import Logo from '../../../../../icons/roundedlogo.svg';
import Github from '../../../../../icons/github.svg';
import PartneringIcon from '../../../../../icons/partnericon.svg';
import { workbenchStore } from '~/lib/stores/workbench';
// import { url_id as urlId } from '~/lib/persistence';
import { extractRelativePath } from '~/utils/diff';
import { formatSize } from '~/utils/formatSize';
import type { FileMap, File } from '~/lib/stores/files';
import { Octokit } from '@octokit/rest';
import useGithub from '~/lib/hooks/useGithub';
import { Input } from '~/components/ui/Input';
import useUser from '~/types/user';
import { API_BASE_URL } from '~/config';
import { useParams } from '@remix-run/react';
import { useStore } from '@nanostores/react';

interface githubDatabase{
  id:number;
  github_user_id:number;
  urlId:string;
  repo_name:string;
  repo_url:string;
  updated_at:string;
  uploaded_at:string;
}

interface PushToGitHubDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPush: (repoName: string, githubUsername?: string, token?: string, isPrivate?: boolean) => Promise<string>;
}

export function PushToGitHubDialog({ isOpen, onClose, onPush }: PushToGitHubDialogProps) {
  const params = useParams();
  const params_id = params.id;
  // const chat_url_id = useStore(urlId)!;
  const [repoName, setRepoName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdRepoUrl, setCreatedRepoUrl] = useState('');
  const [pushedFiles, setPushedFiles] = useState<{ path: string; size: number }[]>([]);
  const [commitMessage, setCommitMessage] = useState('Initial commit');
  const [dialogStep, setDialogStep] = useState<'form' | 'confirm' | 'success'>('form');
  const { user: githubUser, token } = useGithub();
  const { user, getStoredToken } = useUser();
  const user_token = getStoredToken();

  const getGithubPushinDatabase = async (url_id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/github-projects-get-by-urlid/?urlId=${url_id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user_token}`
        },
      });
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      return data;
    }
    catch (error) {
      throw error;
    }
  }

  useEffect(() => {
    const intial =async()=>{
      if (isOpen) {
        setDialogStep('form');
        setCommitMessage('Initial commit');
        setShowSuccessDialog(false);
        // console.log("params_id", params_id)
        // console.log("chat_url_id", chat_url_id)
        const uri_id = params_id;
        if (uri_id) {
          const data = await getGithubPushinDatabase(uri_id) as githubDatabase[];
          if(data.length > 0){
            setRepoName(data[0].repo_name)
          }
          else{
            setRepoName(uri_id)
          }
        }
      }
    }
    intial();
  }, [isOpen, params_id]);

  const checkRepositoryExists = async () => {
    if (!token || !githubUser || !repoName.trim()) return false;

    try {
      const octokit = new Octokit({ auth: token });
      await octokit.repos.get({
        owner: githubUser.login,
        repo: repoName,
      });
      return true; // Repository exists
    } catch (error) {
      if (error instanceof Error && 'status' in error && error.status === 404) {
        return false; // Repository doesn't exist
      }
      throw error; // Other errors
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token || !githubUser) {
      toast.error('Please connect your GitHub account in Settings > Connections first');
      return;
    }

    if (!repoName.trim()) {
      toast.error('Repository name is required');
      return;
    }

    setIsLoading(true);

    try {
      // Check if repository exists
      const repoExists = await checkRepositoryExists();

      if (repoExists) {
        // Show confirmation dialog
        setDialogStep('confirm');
        setIsLoading(false);
        return;
      }

      // Proceed with push for new repository
      await executePush();
    } catch (error) {
      console.error('Error checking repository:', error);
      toast.error('Failed to check repository status. Please try again.');
      setIsLoading(false);
    }
  };

  const githubPushinDatabasePost = async (url_id: string, gitRepoName: string, gitRepoUrl: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/github-projects-post/`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user_token}`
        },
        body: JSON.stringify({
          repo_name: gitRepoName,
          urlId: url_id,
          repo_url: gitRepoUrl
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create repository details');
      }
      const data = await response.json();
      return data;
    }
    catch (error) {
      throw error;
    }
  }

  const githubPushinDatabasePatch = async (url_id: string, gitRepoUrl: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/github-projects-update-by-urlid/?urlId=${url_id}`, {
        method: 'PATCH',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user_token}`
        },
        body: JSON.stringify({
          repo_url: gitRepoUrl
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create repository details');
      }
      const data = await response.json();
      return data;
    }
    catch (error) {
      throw error;
    }
  }

  const executePush = async () => {
    setIsLoading(true);
    try {
      // Push to GitHub using the workbenchStore
      await workbenchStore.pushToGitHub(
        repoName,
        commitMessage,
        githubUser?.login,
        token,
        isPrivate
      );

      // // Get the repository URL
      const repoUrl = await onPush(repoName, githubUser?.login, token, isPrivate);

      // Try to update database but continue even if it fails
      try {
        const result = await getGithubPushinDatabase('') as githubDatabase[];
        // if (result.length > 0) {
        //   await githubPushinDatabasePatch(chat_url_id || '', repoUrl);
        // } else {
        //   await githubPushinDatabasePost(chat_url_id || '', repoName, repoUrl);
        // }
        // Continue with success flow regardless of database result
        setCreatedRepoUrl(repoUrl);
        const files = workbenchStore.files.get();
        const filesList = Object.entries(files as FileMap)
          .filter(([, dirent]) => dirent?.type === 'file' && !dirent.isBinary)
          .map(([path, dirent]) => ({
            path: extractRelativePath(path),
            size: new TextEncoder().encode((dirent as File).content || '').length,
          }));
        setPushedFiles(filesList);
        setDialogStep('success');
      } catch (dbError) {
        console.error('Database operation failed:', dbError);
        // Still continue with success flow even if database operation fails
        setCreatedRepoUrl(repoUrl);
        const files = workbenchStore.files.get();
        const filesList = Object.entries(files as FileMap)
          .filter(([, dirent]) => dirent?.type === 'file' && !dirent.isBinary)
          .map(([path, dirent]) => ({
            path: extractRelativePath(path),
            size: new TextEncoder().encode((dirent as File).content || '').length,
          }));
        setPushedFiles(filesList);
        setDialogStep('success');

        toast.warning('Repository pushed to GitHub, but couldn\'t be saved in your history');
      }
    } catch (error) {
      console.error('Error pushing to GitHub:', error);
      toast.error('Failed to push to GitHub. Please check your repository name and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmYes = () => {
    executePush();
  };

  const handleConfirmNo = () => {
    setDialogStep('form');
  };

  const handleClose = () => {
    setRepoName('');
    setIsPrivate(false);
    setCommitMessage('Initial commit');
    setDialogStep('form');
    onClose();
  };

  // Render confirmation dialog
  const renderConfirmationDialog = () => {
    return (
      <div className="p-6 relative">
        <div className="flex items-center justify-between">
          <div
            className="mb-6 w-full"
            style={{
              animation: 'fadeInUp 0.3s ease-out 0.1s forwards',
              animationFillMode: 'backwards'
            }}
          >
            <div className="flex justify-center items-center w-full mb-2 relative">
              <img src={Logo} alt="Logo" className="h-12 w-auto relative z-10" />
              <img
                src={PartneringIcon}
                alt="Partnership Connection"
                className="h-6 w-auto mx-2 relative z-10"
              />
              <img src={Github} alt="GitHub" className="h-12 w-auto relative z-10" />
            </div>
            <h2 className="text-lg font-bold text-center font-montserrat bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 tracking-wide">
              Push to GitHub
            </h2>
            <p className="text-sm text-center font-montserrat text-gray-300 mt-1">
              Push your code to a new or existing GitHub repository
            </p>
          </div>
          <Dialog.Close
            className="absolute right-2 top-2 bg-transparent ml-auto p-2 text-gray-500 hover:text-gray-400"
            onClick={handleClose}
          >
            <div className="i-ph:x w-5 h-5" />
          </Dialog.Close>
        </div>

        <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-700/30 rounded-lg"
          style={{
            animation: 'fadeInUp 0.3s ease-out 0.2s forwards',
            animationFillMode: 'backwards'
          }}
        >
          <div className="flex items-start gap-3">
            <div className="text-yellow-400 i-ph:warning-circle w-6 h-6 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-200">
                Repository <span className="font-medium">{repoName}</span> already exists. This will add or modify files in the repository.
              </p>
              <p className="text-xs text-yellow-300 mt-1">
                Do you want to continue with the update?
              </p>
            </div>
          </div>
        </div>

        <div className="mb-4"
          style={{
            animation: 'fadeInUp 0.3s ease-out 0.3s forwards',
            animationFillMode: 'backwards'
          }}
        >
          <label className="block text-sm text-gray-400 mb-1">
            Commit Message
          </label>
          <Input
            type="text"
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-transparent border border-[#1A1A1A] text-white"
            placeholder="Update repository files"
          />
        </div>

        <div className="w-full flex gap-3 mt-6"
          style={{
            animation: 'fadeInUp 0.3s ease-out 0.4s forwards',
            animationFillMode: 'backwards'
          }}
        >
          <motion.button
            onClick={handleConfirmNo}
            className="w-full px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-gray-200 text-sm"
          >
            Cancel
          </motion.button>
          <motion.button
            onClick={handleConfirmYes}
            className="w-full px-4 py-2 rounded-lg bg-gradient-to-l from-blue-600 to-purple-600 hover:bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:bg-purple-600 text-sm flex justify-center items-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="i-ph:spinner-gap-bold animate-spin w-4 h-4" />
                Updating...
              </>
            ) : (
              <>
                <div className="i-ph:git-branch w-4 h-4" />
                Update Repository
              </>
            )}
          </motion.button>
        </div>
      </div>
    );
  };

  // Render success dialog
  const renderSuccessDialog = () => {
    return (
      <div className="p-6 relative">
        <div className="flex items-center justify-between">
          <div className='w-full '>
            <div
              className="mb-6"
              style={{
                animation: 'fadeInUp 0.3s ease-out 0.1s forwards',
                animationFillMode: 'backwards'
              }}
            >
              <div className="flex justify-center items-center w-full mb-2 relative">
                <img src={Logo} alt="Logo" className="h-12 w-auto relative z-10" />
                <img
                  src={PartneringIcon}
                  alt="Partnership Connection"
                  className="h-6 w-auto mx-2 relative z-10"
                />
                <img src={Github} alt="GitHub" className="h-12 w-auto relative z-10" />
              </div>
              <h2 className="text-lg font-bold text-center font-montserrat bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 tracking-wide">
                Push to GitHub
              </h2>
              <p className="text-sm text-center font-montserrat text-gray-300 mt-1">
                Push your code to a new or existing GitHub repository
              </p>
            </div>
            <div className="gap-2 text-green-500 w-full mt-5">
              <div className="w-full flex justify-center i-ph:check-circle w-5 h-5" />
              <h3 className="text-lg font-medium text-center">Successfully pushed to GitHub</h3>
            </div>
          </div>
          <Dialog.Close
            onClick={handleClose}
            className="absolute right-2 top-2 p-2 bg-transparent text-gray-500 hover:text-gray-400"
          >
            <div className="i-ph:x w-5 h-5" />
          </Dialog.Close>
        </div>

        <div className="bg-transparent rounded-lg p-3 text-left">
          <p className="text-xs text-gray-600-dark mb-2">
            Repository URL
          </p>
          <div className="relative flex items-center gap-2">
            <code className="w-full text-sm bg-transparent px-3 py-2 rounded border border-alpha-white-10 text-white font-mono">
              {createdRepoUrl}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(createdRepoUrl);
                toast.success('URL copied to clipboard');
              }}
              className="absolute right-0 p-2 px-4 bg-transparent border-l border-alpha-white-10 text-gray-600 hover:text-white"
            >
              <div className="i-ph:copy w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="bg-transparent rounded-lg p-3">
          <p className="text-xs text-gray-600-dark mb-2">
            Pushed Files ({pushedFiles.length})
          </p>
          <div className="max-h-[200px] border border-alpha-white-10 px-2 rounded-lg overflow-y-auto custom-scrollbar">
            {pushedFiles.map((file) => (
              <div
                key={file.path}
                className="flex items-center justify-between py-1 text-sm text-white"
              >
                <span className="font-mono truncate flex-1">{file.path}</span>
                <span className="text-xs text-gray-600-dark ml-2">
                  {formatSize(file.size)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <motion.a
            href={createdRepoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:bg-purple-600 text-sm flex justify-center items-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="i-ph:github-logo w-4 h-4" />
            View Repository
          </motion.a>
          {/* <motion.button
            onClick={() => {
              navigator.clipboard.writeText(createdRepoUrl);
              toast.success('URL copied to clipboard');
            }}
            className="px-4 py-2 rounded-lg bg-[#F5F5F5] dark:bg-[#1A1A1A] text-gray-400 hover:bg-[#E5E5E5] dark:hover:bg-[#252525] text-sm inline-flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="i-ph:copy w-4 h-4" />
            Copy URL
          </motion.button>
          <motion.button
            onClick={handleClose}
            className="px-4 py-2 rounded-lg bg-[#F5F5F5] dark:bg-[#1A1A1A] text-gray-400 hover:bg-[#E5E5E5] dark:hover:bg-[#252525] text-sm inline-flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="i-ph:x-circle w-4 h-4" />
            Close
          </motion.button> */}
        </div>
      </div>
    );
  };

  // Render main form
  const renderMainForm = () => {
    return (
      <div className="p-6 relative">
        <div className="flex items-center gap-4 mb-6">
          <div
            className="mb-6 w-full"
            style={{
              animation: 'fadeInUp 0.3s ease-out 0.1s forwards',
              animationFillMode: 'backwards'
            }}
          >
            <div className="flex justify-center items-center w-full mb-2 relative">
              <img src={Logo} alt="Logo" className="h-12 w-auto relative z-10" />
              <img
                src={PartneringIcon}
                alt="Partnership Connection"
                className="h-6 w-auto mx-2 relative z-10"
              />
              <img src={Github} alt="GitHub" className="h-12 w-auto relative z-10" />
            </div>
            <h2 className="text-lg font-bold text-center font-montserrat bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 tracking-wide">
              Push to GitHub
            </h2>
            <p className="text-sm text-center font-montserrat text-gray-300 mt-1">
              Push your code to a new or existing GitHub repository
            </p>
          </div>
          <Dialog.Close
            className="absolute right-2 top-2 bg-transparent ml-auto p-2 text-gray-500 hover:text-gray-400"
            onClick={handleClose}
          >
            <div className="i-ph:x w-5 h-5" />
          </Dialog.Close>
        </div>

        {githubUser && (
          <div className="flex items-center gap-3 mb-6 p-3 bg-transparent border border-alpha-white-10 rounded-lg"
            style={{
              animation: 'fadeInUp 0.3s ease-out 0.2s forwards',
              animationFillMode: 'backwards'
            }}
          >
            <img src={githubUser.avatar_url} alt={githubUser.login} className="w-10 h-10 rounded-full" />
            <div>
              <p className="text-sm font-medium text-white">{githubUser.name || githubUser.login}</p>
              <p className="text-sm text-gray-400">@{githubUser.login}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2"
            style={{
              animation: 'fadeInUp 0.3s ease-out 0.3s forwards',
              animationFillMode: 'backwards'
            }}
          >
            <label htmlFor="repoName" className="text-sm text-gray-400">
              Repository Name
            </label>
            <Input
              id="repoName"
              type="text"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              placeholder="my-awesome-project"
              className="w-full px-4 py-2 rounded-lg bg-transparent border border-[#1A1A1A] text-white placeholder-gray-400"
              required
            />
          </div>

          <div className="space-y-2"
            style={{
              animation: 'fadeInUp 0.3s ease-out 0.4s forwards',
              animationFillMode: 'backwards'
            }}
          >
            <label htmlFor="commitMessage" className="text-sm text-gray-400">
              Commit Message
            </label>
            <Input
              id="commitMessage"
              type="text"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Initial commit"
              className="w-full px-4 py-2 rounded-lg bg-transparent border border-[#1A1A1A] text-white placeholder-gray-400"
            />
          </div>

          <div className="flex items-center gap-2"
            style={{
              animation: 'fadeInUp 0.3s ease-out 0.5s forwards',
              animationFillMode: 'backwards'
            }}
          >
            <input
              type="checkbox"
              id="private"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="rounded border-[#1A1A1A] text-purple-500 focus:ring-purple-500 bg-[#0A0A0A]"
            />
            <label htmlFor="private" className="text-sm text-gray-400">
              Make repository private
            </label>
          </div>

          <div className="pt-4 flex gap-2"
            style={{
              animation: 'fadeInUp 0.3s ease-out 0.6s forwards',
              animationFillMode: 'backwards'
            }}
          >
            <motion.button
              type="submit"
              disabled={isLoading}
              className={classNames(
                'flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:bg-gradient-to-l from-blue-600 to-purple-600 text-white rounded-lg hover:bg-purple-600 text-sm inline-flex items-center justify-center gap-2 transition-all',
                isLoading ? 'opacity-50 cursor-not-allowed' : '',
              )}
            >
              {isLoading ? (
                <>
                  <div className="i-ph:spinner-gap-bold animate-spin w-4 h-4" />
                  Pushing...
                </>
              ) : (
                <>
                  <div className="i-ph:git-branch w-4 h-4" />
                  Push to GitHub
                </>
              )}
            </motion.button>
          </div>
        </form>
      </div>
    );
  };

  // No githubUser connected
  if (!githubUser) {
    return (
      <Dialog.Root open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]" />
          <div className="fixed inset-0 flex items-center justify-center z-[9999]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-[90vw] md:w-[500px]"
            >
              <Dialog.Content className="bg-[#0A0A0A] rounded-lg p-6 border border-[#1A1A1A] shadow-xl">
                <div className="text-center space-y-4">
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="mx-auto w-12 h-12 rounded-xl bg-transparent flex items-center justify-center text-purple-500"
                  >
                    <div className="i-ph:github-logo w-6 h-6" />
                  </motion.div>
                  <h3 className="text-lg font-medium text-white">GitHub Connection Required</h3>
                  <p className="text-sm text-gray-400">
                    Please connect your GitHub account in Settings {'>'} Connections to push your code to GitHub.
                  </p>
                  <motion.button
                    className="bg-transparent px-4 py-2 rounded-lg bg-purple-500 text-white text-sm hover:bg-purple-600 inline-flex items-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleClose}
                  >
                    <div className="i-ph:x-circle" />
                    Close
                  </motion.button>
                </div>
              </Dialog.Content>
            </motion.div>
          </div>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]" />
        <div className="fixed inset-0 flex items-center justify-center z-[9999]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-[90vw] md:w-[500px]"
          >
            <Dialog.Content className="bg-[#0A0A0A] rounded-lg border border-[#1A1A1A] shadow-xl">
              {dialogStep === 'form' && renderMainForm()}
              {dialogStep === 'confirm' && renderConfirmationDialog()}
              {dialogStep === 'success' && renderSuccessDialog()}
            </Dialog.Content>
          </motion.div>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}