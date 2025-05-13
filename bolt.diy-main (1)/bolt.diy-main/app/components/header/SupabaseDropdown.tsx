//@ts-nocheck
import { useRef, memo, useState, useEffect } from 'react';
import { fetchProjectApiKeys, supabaseConnection, updateSupabaseConnection } from '~/lib/stores/supabase';
import { toast } from 'react-toastify';

interface Project {
  id: string;
  name: string;
  organization_id: string;
  region?: string;
  status?: string;
  apiKeys?: any[];
  database?: {
    host: string;
    version: string;
    postgres_engine: string;
    release_channel: string;
  };
  created_at?: string;
}

interface SupabaseDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  projects?: Project[];
  selectedProjectID?: string;
  isStreaming: boolean;
  setIsSupabaseConnectionDialogOpen?: (value: boolean) => void;
}

export const SupabaseDropdown = memo(({ isOpen, onClose, projects = [], selectedProjectID, isStreaming, setIsSupabaseConnectionDialogOpen }: SupabaseDropdownProps) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [projectsView, setProjectsView] = useState<boolean>(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectDetailsView, setProjectDetailsView] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(projects.length > 0);

  useEffect(() => {
    setIsConnected(projects.length > 0);
  }, [projects]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup function
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConnect = () => {
    setIsSupabaseConnectionDialogOpen(true);
    setProjectsView(false);
  };

  const handleViewProjects = () => {
    setProjectsView(true);
  };

  const handleBackToMain = () => {
    setProjectsView(false);
    setProjectDetailsView(false);
    setSelectedProject(null);
  };

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setProjectDetailsView(true);
  };

  const handleBackToProjects = () => {
    setProjectDetailsView(false);
    setSelectedProject(null);
  };

  const handleClickProject = async (project: Project) => {
    if (isStreaming) {
      toast.error('Please Wait for Finish Streaming...');
      return;
    }

    if (project.id) {
      fetchProjectApiKeys(project.id, supabaseConnection.get().token);
      updateSupabaseConnection({
        selectedProjectId: project.id,
      });
      onClose();
    }

    // const projectDetails = `I want to connect my Supabase project. Please help me connect this Supabase project to my application and provide guidance on setting up authentication, database, and storage.`;

    // if (chat.sendMessage) {
    //   const fakeEvent = {} as React.UIEvent;
    //   chat.sendMessage(fakeEvent, projectDetails);
    //   onClose();
    // }
  };

  const getAnonKey = (project: any, keyType: "anon" | "service_role" = "anon") => {
    if (!project.apiKeys || !Array.isArray(project.apiKeys)) {
      return "No API Keys found";
    }

    const key = project.apiKeys.find(key => key.name === keyType);
    if (!key) return "No key found";

    return key.api_key;
  };

  const getDisplayAnonKey = (project: any) => {
    if (!project.apiKeys || !Array.isArray(project.apiKeys)) {
      return "No API Keys found";
    }

    const anonKey = project.apiKeys.find(key => key.name === "anon");
    if (!anonKey) return "No anon key found";

    const key = anonKey.api_key;
    // Show first 5 characters, then dots, then last 5 characters
    return key.substring(0, 5) + "••••••••••••••••••••" + key.substring(key.length - 5);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };
  const isProjectConnected = (projectId: string) => {
    return selectedProjectID === projectId;
  };

  return (
    <div
      ref={menuRef}
      className="absolute right-36 top-10 mt-1 p-0 w-80 bg-gray-900 border border-[#FFFFFF1A] rounded-lg shadow-lg z-10 max-h-[80vh] overflow-y-auto"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#FFFFFF1A] sticky top-0 bg-gray-900">
        <div className="flex items-center gap-2">
          {(projectsView || projectDetailsView) && (
            <div
              className="i-ph:arrow-left text-xl text-green-600 cursor-pointer"
              onClick={projectDetailsView
                ? handleBackToProjects
                : (projectsView
                  ? handleBackToMain
                  : null)}
            ></div>
          )}

          <div className="i-material-icon-theme:supabase text-xl text-green-500"></div>
          <h3 className="text-white font-medium">
            {projectDetailsView && selectedProject
              ? `${selectedProject.name.length > 20 ? `${selectedProject.name.slice(0, 20)}...` : selectedProject.name}`
              : (projectsView
                ? 'Projects'
                : 'Supabase')}
          </h3>
          <span className="inline-flex items-center">
            <span
              className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}
              title={isConnected ? 'Active' : 'Inactive'}
            ></span>
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white bg-transparent p-1 rounded-full transition-colors"
        >
          <div className="i-ph:x"></div>
        </button>
      </div>
      <div className='p-4'>
        {projectDetailsView && selectedProject ? (
          <>
            <div className="flex items-center mb-4">
              <h4 className="text-white text-sm font-medium">Project Details</h4>
            </div>
            {isProjectConnected(selectedProject.id) && (
              <span className="ml-2 px-2 py-1 text-xs font-semibold bg-green-600 text-white rounded-full">
                Connected
              </span>
            )}
            <div className="p-3 rounded-md border border-alpha-white-10 mb-4">
              <div className="text-white text-sm font-medium">
                {selectedProject.name.length > 20 ? `${selectedProject.name.slice(0, 20)}...` : selectedProject.name}
              </div>
              <div className="text-gray-400 text-xs mt-1 break-all">
                Project ID: {selectedProject.id || 'N/A'}
              </div>
              <div className="text-gray-400 text-xs mt-1 break-all">
                Organization ID: {selectedProject.organization_id || 'N/A'}
              </div>
              {selectedProject.region && (
                <div className="text-gray-400 text-xs mt-1">
                  Region: {selectedProject.region}
                </div>
              )}
              {selectedProject.status && (
                <div className="text-gray-400 text-xs mt-1">
                  Status: <span className={`${selectedProject.status.includes('ACTIVE_HEALTHY') ? 'text-green-400' : 'text-red-400'}`}>
                    {selectedProject.status}
                  </span>
                </div>
              )}
              {selectedProject.created_at && (
                <div className="text-gray-400 text-xs mt-1">
                  Created: {formatDate(selectedProject.created_at)}
                </div>
              )}
              {selectedProject.database && (
                <div className="text-gray-400 text-xs mt-1">
                  Postgres: {selectedProject.database.postgres_engine} ({selectedProject.database.version})
                </div>
              )}
            </div>

            <div className="space-y-2 mb-4">
              <h4 className="text-white text-sm mb-2 font-medium">Project Settings</h4>

              <div className="p-3 rounded-md border border-alpha-white-10 cursor-pointer hover:bg-gray-800 transition-colors">
                <div className="flex items-center">
                  <div className="i-ph:lock-key text-green-500 mr-2"></div>
                  <div>
                    <div className="text-white text-sm font-medium">Authentication</div>
                    <div className="text-gray-400 text-xs">Manage sign-in methods and users</div>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-md border border-alpha-white-10 cursor-pointer hover:bg-gray-800 transition-colors">
                <div className="flex items-center">
                  <div className="i-ph:database text-green-500 mr-2"></div>
                  <div>
                    <div className="text-white text-sm font-medium">Database</div>
                    <div className="text-gray-400 text-xs">Configure tables and manage data</div>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-md border border-alpha-white-10 cursor-pointer hover:bg-gray-800 transition-colors">
                <div className="flex items-center">
                  <div className="i-ph:cloud-arrow-up text-green-500 mr-2"></div>
                  <div>
                    <div className="text-white text-sm font-medium">Storage</div>
                    <div className="text-gray-400 text-xs">Manage file uploads and storage</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={handleBackToProjects}
                className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-transparent border border-alpha-white-10 rounded-md transition-colors hover:bg-gray-800"
              >
                Back to Projects
              </button>

              <button
                disabled={selectedProject.status === 'INACTIVE' || selectedProjectID !== undefined}
                onClick={() => handleClickProject(selectedProject)}
                className={`flex-1 px-3 py-1.5 text-xs font-medium text-white ${(selectedProject.status === "INACTIVE"|| selectedProjectID !== undefined) ? 'bg-gray-600 hover:bg-gray-700' : 'bg-green-600 hover:bg-green-700'} rounded-md transition-colors`}
              >
                Connect Project
              </button> 
            </div>
          </>
        ) : projectsView ? (
          <>
            <h4 className="text-white text-sm mb-2 font-medium">Your Projects</h4>
            {projects.length > 0 ? (
              <div className="space-y-2 mt-3">
                {projects.map(project => (
                  <div
                    key={project.id}
                    className="relative p-3 rounded-md border border-alpha-white-10 cursor-pointer transition-colors hover:bg-gray-800"
                    onClick={() => handleSelectProject(project)}
                  >
                    {isProjectConnected(project.id) && (
                      <span className="absolute right-2 top-2 ml-2 px-2 py-0.5 text-xs font-semibold bg-green-600 text-white rounded-full flex items-center">
                        <div className="i-ph:check-circle-fill mr-1 text-xs"></div>
                        Connected
                      </span>
                    )}
                    <div className="text-white text-sm font-medium">
                      {(project.name || 'Unnamed Project').length > 30
                        ? `${(project.name || 'Unnamed Project').slice(0, 30)}...`
                        : (project.name || 'Unnamed Project')}
                    </div>
                    <div className="text-gray-400 text-xs mt-1 break-all">ID: {project.id}</div>
                    {project.apiKeys && (
                      <div className="text-gray-400 text-xs mt-1 break-all">
                        <span className="font-medium">Anon Key:</span> {getDisplayAnonKey(project)}
                      </div>
                    )}
                    {project.region && (
                      <div className="text-gray-400 text-xs mt-1">Region: {project.region}</div>
                    )}
                    {project.status && (
                      <div className="text-gray-400 text-xs mt-1">
                        Status: <span className={`${project.status.includes('ACTIVE_HEALTHY') ? 'text-green-400' : 'text-red-400'}`}>
                          {project.status}
                        </span>
                      </div>
                    )}
                    {project.created_at && (
                      <div className="text-gray-400 text-xs mt-1">
                        Created: {formatDate(project.created_at)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-red-400 text-sm p-3 text-center rounded-md">
                No projects found
              </div>
            )}
          </>
        ) : (
          // Main Menu
          <>
            <div className="mb-3">
              <p className="text-sm text-gray-400">Connect to add authentication, store data, or call third party APIs.</p>
            </div>

            {projects.length > 0 && (
              <button
                onClick={handleViewProjects}
                className="w-full mb-3 px-3 py-1.5 text-sm font-medium text-white bg-transparent border border-alpha-white-10 rounded-md transition-colors hover:bg-gray-800"
              >
                View Projects ({projects.length})
              </button>
            )}

            <button
              onClick={handleConnect}
              className={`w-full px-3 py-1.5 text-sm font-medium text-white ${isConnected
                ? 'bg-transparent border border-alpha-white-10 hover:bg-gray-800'
                : 'bg-green-600 hover:bg-green-700'
                } disabled:bg-gray-600 disabled:cursor-not-allowed rounded-md transition-colors`}
            >
              {isConnected ? 'Reconnect to Supabase' : 'Connect to Supabase'}
            </button>
          </>
        )}
        <p className="mt-3 text-xs text-center text-gray-400">
          Need help?{' '}
          <a
            href="https://supabase.com/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-500 hover:underline"
          >
            Check the Supabase docs →
          </a>
        </p>
      </div>
    </div>
  );
});

export default SupabaseDropdown;