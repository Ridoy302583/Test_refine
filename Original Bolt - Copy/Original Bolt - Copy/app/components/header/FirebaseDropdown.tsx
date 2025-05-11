
import { useRef, memo, useState, useEffect, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { chatStore } from '~/lib/stores/chat';
import { firebaseConnection, findAppById } from '~/lib/stores/firebase';
import { useParams } from '@remix-run/react';
import { toast } from 'react-toastify';
import useUser from '~/types/user';
import Logo from '../../icons/roundedlogo.svg';
import { useFirebaseConnection } from '~/lib/hooks/useFirebase';
import { IconButton } from '../ui/IconButton';
import { API_BASE_URL } from '~/config';

interface FirebaseApp {
    appId: string;
    displayName?: string;
    projectId?: string;
    apiKey?: string;
    authDomain?: string;
    storageBucket?: string;
    messagingSenderId?: string;
}

interface FirebaseProject {
    id: string;
    name: string;
    project_id: string;
    auth_domain: string;
    api_key: string;
    database_url?: string;
    storage_bucket?: string;
    messaging_sender_id?: string;
    app_id?: string;
    measurement_id?: string;
    apps?: FirebaseApp[];
    created_at?: string;
    status?: string;
}

interface FirebaseDropdownProps {
    isOpen: boolean;
    onClose: () => void;
    initialFetch: (userToken: string) => void;
    selectedAppID?: string;
    projects?: FirebaseProject[];
    isStreaming: boolean;
    setIsFirebaseConnectionDialogOpen?: (value: boolean) => void;
}

export const FirebaseDropdown = memo(({
    isOpen,
    onClose,
    selectedAppID,
    initialFetch,
    projects = [],
    isStreaming,
    setIsFirebaseConnectionDialogOpen
}: FirebaseDropdownProps) => {

    const menuRef = useRef<HTMLDivElement>(null);
    const modalmenuRef = useRef<HTMLDivElement>(null);
    const [deleteableProject, setDeleteableProject] = useState<FirebaseProject | null>(null);
    const [projectsView, setProjectsView] = useState<boolean>(false);
    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [selectedProject, setSelectedProject] = useState<FirebaseProject | null>(null);
    const [selectedApp, setSelectedApp] = useState<FirebaseApp | null>(null);
    const [appDetailsView, setAppDetailsView] = useState<boolean>(false);
    const [projectDetailsView, setProjectDetailsView] = useState<boolean>(false);
    const [isConnected, setIsConnected] = useState<boolean>(projects.length > 0);
    const [refreshingApps, setRefreshingApps] = useState<boolean>(false);
    const chat = useStore(chatStore);
    const fbConnectionStore = useStore(firebaseConnection);
    const { selectApp, clearAppSelection, refreshApps } = useFirebaseConnection();

    const { user, getStoredToken } = useUser();
    const user_token = getStoredToken();

    useEffect(() => {
        setIsConnected(projects.length > 0);
    }, [projects]);

    // When the dropdown opens, check if an app is already selected in the store
    useEffect(() => {
        if (isOpen && fbConnectionStore.selectedAppId) {
            // Find the app and its project
            const { app, project } = findAppById(fbConnectionStore.selectedAppId);
            if (app && project) {
                setSelectedProject(project);
                setSelectedApp(app);
                setProjectDetailsView(true);
                setAppDetailsView(true);
            }
        }
    }, [isOpen, fbConnectionStore.selectedAppId]);

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

    // Function to refresh apps for the selected project
    const handleRefreshApps = useCallback(async () => {
        if (!selectedProject || !user_token) return;

        setRefreshingApps(true);
        try {
            await refreshApps(selectedProject.project_id);
            // Get the updated project
            const updatedProjects = fbConnectionStore.stats?.projects || [];
            const updatedProject = updatedProjects.find(p => p.project_id === selectedProject.project_id);

            if (updatedProject) {
                setSelectedProject(updatedProject);
                toast.success('Apps refreshed successfully');
            }
        } catch (error) {
            console.error('Failed to refresh apps:', error);
            toast.error('Failed to refresh apps');
        } finally {
            setRefreshingApps(false);
        }
    }, [selectedProject, user_token, refreshApps, fbConnectionStore.stats?.projects]);

    if (!isOpen) return null;

    const handleConnect = () => {
        if (setIsFirebaseConnectionDialogOpen) {
            setIsFirebaseConnectionDialogOpen(true);
        }
        setProjectsView(false);
    };

    const handleViewProjects = () => {
        setProjectsView(true);
    };

    const handleBackToMain = () => {
        setProjectsView(false);
        setProjectDetailsView(false);
        setAppDetailsView(false);
        setSelectedProject(null);
        setSelectedApp(null);
    };

    const handleSelectProject = (project: FirebaseProject) => {
        setSelectedProject(project);
        setProjectDetailsView(true);
        setAppDetailsView(false);
        setSelectedApp(null);
    };

    const handleSelectApp = (app: FirebaseApp) => {
        setSelectedApp(app);
        setAppDetailsView(true);
    };

    const handleBackToProjects = () => {
        setProjectDetailsView(false);
        setAppDetailsView(false);
        setSelectedProject(null);
        setSelectedApp(null);
    };

    const handleBackToProject = () => {
        setAppDetailsView(false);
        setSelectedApp(null);
    };

    const handleClickApp = async (app: FirebaseApp) => {
        if (isStreaming) {
            toast.error('Please Wait for Finish Streaming...');
            return;
        }

        if (app.appId) {
            try {
                // Select the app in the store
                await selectApp(app.appId);
                toast.success(`Firebase app "${app.displayName || app.appId}" connected`);
                onClose();
            } catch (error) {
                toast.error('Failed to connect Firebase app');
                console.error('Error connecting Firebase app:', error);
            }
        }
    };

    const handleClickAppConnect = (project: FirebaseProject, app: FirebaseApp) => {
        if (isStreaming) {
            toast.error('Please Wait for Finish Streaming...');
            return;
        }

        // First select the app in the store
        handleClickApp(app).then(() => {
            // Then send the message to the chat
            const appDetails = `I want to configure my Firebase app`;

            // if (chat.sendMessage) {
            //     const fakeEvent = new Event('click') as unknown as React.UIEvent;
            //     chat.sendMessage(fakeEvent, appDetails);
            onClose();
            // }
        }).catch(error => {
            console.error('Error in app connection flow:', error);
        });
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    // Get project apps count
    const getProjectAppsCount = (project: FirebaseProject) => {
        return project.apps && Array.isArray(project.apps) ? project.apps.length : 0;
    };

    // Check if this app is currently selected in the store
    const isAppSelected = (appId: string) => {
        return selectedAppID === appId;
    };

    const handleOverlayClick = (e: React.MouseEvent) => {
        // Only close if the click is directly on the overlay (not its children)
        if (e.target === e.currentTarget) {
            setModalOpen(false);
        }
    };

    const deleteModalClicked = (project: FirebaseProject) => {
        setModalOpen(true);
        setDeleteableProject(project || null);
    };

    const deleteProjects = async () => {
        if (!deleteableProject) return;
        
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/firebase/firebase-projects-by-id/${parseInt(deleteableProject.id)}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user_token}`
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Server error');
            }
            
            const data = await response.json();
            if (data) {
                initialFetch(user_token || '');
                setModalOpen(false);
                toast.success('Firebase project deleted successfully.');
            }
        } catch (error) {
            console.error('Error deleting project:', error);
            toast.error('Failed to delete project');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {modalOpen ? (
                <div
                    className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-md"
                    style={{
                        animation: 'fadeIn 0.3s ease-out forwards'
                    }}
                    onClick={handleOverlayClick}
                >
                    <div
                        ref={modalmenuRef}
                        className="relative w-full max-w-md p-6 bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-lg rounded-2xl border border-purple-500/20 text-white shadow-2xl overflow-hidden z-[1001]"
                        style={{
                            animation: 'scaleIn 0.3s ease-out forwards'
                        }}
                    >
                        {/* Background decorative elements */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-purple-600/20 blur-3xl"></div>
                        <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-blue-600/20 blur-3xl"></div>

                        {/* Close button */}
                        <button
                            onClick={() => setModalOpen(false)}
                            className="absolute top-4 right-4 text-white text-opacity-70 hover:text-opacity-100 transition-opacity bg-transparent p-1 rounded-full"
                            aria-label="Close"
                            style={{ background: 'transparent' }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Logo with glow effect */}
                        <div className="flex justify-center w-full mb-2 relative">
                            <div className="absolute inset-0 bg-blue-500/20 filter blur-xl rounded-full scale-75 opacity-70"></div>
                            <img src={Logo} alt="Logo" className="h-12 w-auto relative z-10" />
                        </div>

                        {/* Title with enhanced styling */}
                        <div className="my-6">
                            <h2 className="text-xl font-bold text-center font-montserrat bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 tracking-wide">
                                Confirm Deletion
                            </h2>
                            <p className="text-sm text-center font-montserrat text-gray-300 mt-1">
                                Are you sure you want to delete this project?
                            </p>
                        </div>

                        {/* Divider with shine effect */}
                        <div className="my-6 flex items-center">
                            <div className="flex-grow h-px bg-gradient-to-r from-transparent via-gray-400/20 to-transparent"></div>
                            <span className="px-3 text-sm font-montserrat text-gray-300">Project Details</span>
                            <div className="flex-grow h-px bg-gradient-to-r from-transparent via-gray-400/20 to-transparent"></div>
                        </div>

                        {/* Project name */}
                        <div className="mb-6 p-3 rounded-md border border-alpha-white-10 bg-gray-800/30">
                            <div className="text-white text-sm font-medium">
                                {deleteableProject?.name || 'Unnamed Project'}
                            </div>
                            <div className="text-gray-400 text-xs mt-1">
                                This project has {deleteableProject?.apps?.length || 0} apps
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex space-x-3 mt-6">
                            <button
                                onClick={() => setModalOpen(false)}
                                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-transparent border border-alpha-white-10 rounded-md transition-colors hover:bg-gray-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={deleteProjects}
                                disabled={loading}
                                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:opacity-70 rounded-md transition-colors flex items-center justify-center"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Deleting...
                                    </>
                                ) : "Delete Project"}
                            </button>
                        </div>

                        {/* Divider with glow effect */}
                        <div className="my-6 h-px bg-gradient-to-r from-transparent via-red-500/20 to-transparent"></div>

                        {/* Footer with enhanced styling */}
                        <div className="flex justify-center items-center">
                            <span className="text-sm text-gray-400">
                                This action will permanently delete the project
                            </span>
                        </div>
                    </div>
                </div>
            ) : (
                <div
                    ref={menuRef}
                    className="absolute right-5 top-10 mt-1 p-0 w-80 bg-gray-900 border border-[#FFFFFF1A] rounded-lg shadow-lg z-10 max-h-[80vh] overflow-y-auto"
                >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[#FFFFFF1A] sticky top-0 bg-gray-900">
                        <div className="flex items-center gap-2">
                            {(projectsView || projectDetailsView || appDetailsView) && (
                                <div
                                    className="i-ph:arrow-left text-xl text-orange-600 cursor-pointer"
                                    onClick={appDetailsView
                                        ? handleBackToProject
                                        : (projectDetailsView
                                            ? handleBackToProjects
                                            : (projectsView
                                                ? handleBackToMain
                                                : null))}
                                ></div>
                            )}

                            <div className="i-vscode-icons:file-type-firebase text-xl text-orange-500"></div>
                            <h3 className="text-white font-medium">
                                {appDetailsView && selectedApp
                                    ? `${(selectedApp.displayName || `App ${selectedApp.appId?.substring(0, 8) || 'Unknown'}`).length > 20
                                        ? `${(selectedApp.displayName || `App ${selectedApp.appId?.substring(0, 8) || 'Unknown'}`).slice(0, 20)}...`
                                        : (selectedApp.displayName || `App ${selectedApp.appId?.substring(0, 8) || 'Unknown'}`)}`
                                    : (projectDetailsView && selectedProject
                                        ? `${(selectedProject.name || selectedProject.project_id).length > 20
                                            ? `${(selectedProject.name || selectedProject.project_id).slice(0, 20)}...`
                                            : (selectedProject.name || selectedProject.project_id)}`
                                        : (projectsView
                                            ? 'Projects'
                                            : 'Firebase'))}
                            </h3>
                            <span className="inline-flex items-center">
                                <span
                                    className={`w-3 h-3 rounded-full ${isConnected ? 'bg-orange-500 animate-pulse' : 'bg-gray-400'}`}
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
                        {appDetailsView && selectedApp && selectedProject ? (
                            <>
                                <div className="flex items-center mb-4">
                                    <h4 className="text-white text-sm font-medium">App Details</h4>
                                </div>
                                <div className="relative p-3 rounded-md border border-alpha-white-10 mb-4">
                                    <div className="text-white text-sm font-medium">
                                        {(selectedApp.displayName || `App ${selectedApp.appId?.substring(0, 8) || 'Unknown'}`).length > 20
                                            ? `${(selectedApp.displayName || `App ${selectedApp.appId?.substring(0, 8) || 'Unknown'}`).slice(0, 20)}...`
                                            : (selectedApp.displayName || `App ${selectedApp.appId?.substring(0, 8) || 'Unknown'}`)}
                                    </div>
                                    <div className="text-gray-400 text-xs mt-1 break-all">
                                        App ID: {selectedApp.appId || 'N/A'}
                                    </div>
                                    <div className="text-gray-400 text-xs mt-1 break-all">
                                        Project: {selectedProject.name || selectedProject.project_id}
                                    </div>
                                    {selectedApp.apiKey && (
                                        <div className="text-gray-400 text-xs mt-1 break-all">
                                            API Key: {selectedApp.apiKey.substring(0, 5) + "••••••••••••••••••••" +
                                                (selectedApp.apiKey.length > 10 ? selectedApp.apiKey.substring(selectedApp.apiKey.length - 5) : "")}
                                        </div>
                                    )}

                                    {/* Show selected status */}
                                    {isAppSelected(selectedApp.appId) && (
                                        <span className="absolute right-2 top-2 ml-2 px-2 py-0.5 text-xs font-semibold bg-green-600 text-white rounded-full flex items-center">
                                            <div className="i-ph:check-circle-fill mr-1 text-xs"></div>
                                            Connected
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-2 mb-4">
                                    <h4 className="text-white text-sm mb-2 font-medium">App Settings</h4>

                                    <div className="p-3 rounded-md border border-alpha-white-10 cursor-pointer hover:bg-gray-800 transition-colors">
                                        <div className="flex items-center">
                                            <div className="i-ph:lock-key text-orange-500 mr-2"></div>
                                            <div>
                                                <div className="text-white text-sm font-medium">Authentication</div>
                                                <div className="text-gray-400 text-xs">Manage sign-in methods and users</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-3 rounded-md border border-alpha-white-10 cursor-pointer hover:bg-gray-800 transition-colors">
                                        <div className="flex items-center">
                                            <div className="i-ph:database text-orange-500 mr-2"></div>
                                            <div>
                                                <div className="text-white text-sm font-medium">Database</div>
                                                <div className="text-gray-400 text-xs">Configure Firestore or Realtime Database</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-3 rounded-md border border-alpha-white-10 cursor-pointer hover:bg-gray-800 transition-colors">
                                        <div className="flex items-center">
                                            <div className="i-ph:cloud-arrow-up text-orange-500 mr-2"></div>
                                            <div>
                                                <div className="text-white text-sm font-medium">Storage</div>
                                                <div className="text-gray-400 text-xs">Manage file uploads and storage</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex space-x-2">
                                    <button
                                        onClick={handleBackToProject}
                                        className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-transparent border border-alpha-white-10 rounded-md transition-colors hover:bg-gray-800"
                                    >
                                        Back to Project
                                    </button>

                                    <button
                                        onClick={() => handleClickAppConnect(selectedProject, selectedApp)}
                                        disabled={isAppSelected(selectedApp.appId) || (selectedAppID !== undefined && selectedAppID === selectedApp.appId)}
                                        className={`flex-1 px-3 py-1.5 text-xs font-medium text-white ${(isAppSelected(selectedApp.appId) || (selectedAppID !== undefined && selectedAppID === selectedApp.appId))
                                            ? 'bg-gray-700 cursor-not-allowed'
                                            : 'bg-orange-600 hover:bg-orange-700'
                                            } rounded-md transition-colors`}
                                    >
                                        {isAppSelected(selectedApp.appId) ? 'Already Selected' : 'Configure App'}
                                    </button>
                                </div>
                            </>
                        ) : projectDetailsView && selectedProject ? (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-white text-sm font-medium">Project Details</h4>
                                    <button
                                        onClick={handleRefreshApps}
                                        disabled={refreshingApps}
                                        className="bg-transparent text-orange-500 hover:text-orange-400 text-xs flex items-center gap-1"
                                    >
                                        <div className={`${refreshingApps ? 'i-ph:spinner-gap animate-spin' : 'i-ph:arrows-clockwise'} w-4 h-4`} />
                                        {refreshingApps ? 'Refreshing...' : 'Refresh Apps'}
                                    </button>
                                </div>

                                <div className="p-3 rounded-md border border-alpha-white-10 mb-4">
                                    <div className="text-white text-sm font-medium">
                                        {(selectedProject.name || selectedProject.project_id).length > 20
                                            ? `${(selectedProject.name || selectedProject.project_id).slice(0, 20)}...`
                                            : (selectedProject.name || selectedProject.project_id)}
                                    </div>
                                    <div className="text-gray-400 text-xs mt-1 break-all">
                                        Project ID: {selectedProject.project_id || 'N/A'}
                                    </div>
                                    {selectedProject.status && (
                                        <div className="text-gray-400 text-xs mt-1">
                                            Status: <span className={`${selectedProject.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                                                {selectedProject.status}
                                            </span>
                                        </div>
                                    )}
                                    {selectedProject.created_at && (
                                        <div className="text-gray-400 text-xs mt-1">
                                            Created: {formatDate(selectedProject.created_at)}
                                        </div>
                                    )}
                                </div>

                                {selectedProject.apps && selectedProject.apps.length > 0 ? (
                                    <>
                                        <h4 className="text-white text-sm mb-2 font-medium">Apps ({selectedProject.apps.length})</h4>
                                        <div className="space-y-2 mb-4">
                                            {selectedProject.apps.map((app, index) => (
                                                <div
                                                    key={app.appId || index}
                                                    className={`relative p-3 rounded-md border ${isAppSelected(app.appId) ? 'border-orange-500' : 'border-alpha-white-10'
                                                        } cursor-pointer hover:bg-gray-800 transition-colors`}
                                                    onClick={() => handleSelectApp(app)}
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <div className="text-white text-sm font-medium">
                                                            {(app.displayName || `App ${index + 1}`).length > 30
                                                                ? `${(app.displayName || `App ${index + 1}`).slice(0, 30)}...`
                                                                : (app.displayName || `App ${index + 1}`)}
                                                        </div>
                                                        {isAppSelected(app.appId) && (
                                                            <span className="absolute right-2 top-2 ml-2 px-2 py-0.5 text-xs font-semibold bg-green-600 text-white rounded-full flex items-center">
                                                                <div className="i-ph:check-circle-fill mr-1 text-xs"></div>
                                                                Connected
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-gray-400 text-xs mt-1 break-all">
                                                        App ID: {app.appId || 'N/A'}
                                                    </div>
                                                    {app.apiKey && (
                                                        <div className="text-gray-400 text-xs mt-1">
                                                            Has Config: <span className="text-green-400">Yes</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="bg-transparent text-gray-400 text-sm p-3 mb-4 text-center rounded-md border border-alpha-white-10">
                                        {refreshingApps ? 'Loading apps...' : 'No apps found for this project'}
                                        {!refreshingApps && (
                                            <button
                                                onClick={handleRefreshApps}
                                                className="bg-transparent block mx-auto mt-2 text-orange-500 hover:text-orange-400 text-xs"
                                            >
                                                Click to refresh apps
                                            </button>
                                        )}
                                    </div>
                                )}
                            </>
                        ) : projectsView ? (
                            <>
                                <h4 className="text-white text-sm mb-2 font-medium">Your Firebase Projects</h4>
                                {projects.length > 0 ? (
                                    <div className="space-y-2 mt-3">
                                        {projects.map(project => (
                                            <div
                                                key={project.id}
                                                className="p-3 rounded-md border border-alpha-white-10 transition-colors hover:bg-gray-800"
                                            >
                                                <div className="flex justify-between">
                                                    <div 
                                                        className="flex-grow cursor-pointer" 
                                                        onClick={() => handleSelectProject(project)}
                                                    >
                                                        <div className="flex justify-between items-center">
                                                            <div className="flex flex-col">
                                                                <span className="text-white text-sm font-medium">
                                                                    {(project.name || project.project_id).length >30
                                                                    ? `${(project.name || project.project_id).slice(0, 30)}...`
                                                                    : (project.name || project.project_id)}
                                                                </span>
                                                                <span className="text-gray-400 text-xs">
                                                                    {project.project_id}
                                                                </span>
                                                            </div>
                                                            <span className="text-white text-xs bg-orange-600 px-3 py-1 rounded-full">
                                                                {getProjectAppsCount(project)} apps
                                                            </span>
                                                        </div>
                                                        {project.status && (
                                                            <div className="text-gray-400 text-xs mt-1">
                                                                Status: <span className={`${project.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>
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
                                                    <div className="flex-none ml-2">
                                                        <IconButton
                                                            title="Delete Project"
                                                            className="transition-all bg-transparent"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                deleteModalClicked(project);
                                                            }}
                                                        >
                                                            <div className='i-ph:trash text-white' />
                                                        </IconButton>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-red-400 text-sm p-3 text-center rounded-md">
                                        No Firebase projects found
                                    </div>
                                )}
                            </>
                        ) : (
                            // Main Menu
                            <>
                                <div className="mb-3">
                                    <p className="text-sm text-gray-400">
                                        Connect to Firebase to add authentication, store data, or create real-time applications.
                                    </p>
                                </div>

                                {projects.length > 0 && (
                                    <button
                                        onClick={handleViewProjects}
                                        className="w-full mb-3 px-3 py-1.5 text-sm font-medium text-white bg-transparent border border-alpha-white-10 rounded-md transition-colors hover:bg-gray-800"
                                    >
                                        View Projects ({projects.length})
                                    </button>
                                )}

                                {fbConnectionStore.selectedAppId && (
                                    <div className="mb-3 p-3 bg-gray-800/50 rounded-md">
                                        <h5 className="text-sm font-medium text-white flex items-center">
                                            <div className="i-ph:check-circle text-green-400 w-4 h-4 mr-1" />
                                            Selected App
                                        </h5>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {(() => {
                                                const { app, project } = findAppById(fbConnectionStore.selectedAppId);
                                                if (app) {
                                                    return `${app.displayName || app.appId} (${project?.name || project?.project_id || 'Unknown project'})`;
                                                }
                                                return fbConnectionStore.selectedAppId;
                                            })()}
                                        </p>
                                        <button
                                            onClick={clearAppSelection}
                                            className="mt-2 px-2 py-1 text-xs font-medium text-red-400 bg-transparent border border-red-900/30 rounded-md hover:bg-red-900/10 transition-colors"
                                        >
                                            Clear Selection
                                        </button>
                                    </div>
                                )}

                                <button
                                    onClick={handleConnect}
                                    className={`w-full px-3 py-1.5 text-sm font-medium text-white ${isConnected
                                        ? 'bg-transparent border border-alpha-white-10 hover:bg-gray-800'
                                        : 'bg-orange-600 hover:bg-orange-700'
                                        } disabled:bg-gray-600 disabled:cursor-not-allowed rounded-md transition-colors`}
                                >
                                    {isConnected ? 'Add Another Firebase Project' : 'Connect to Firebase'}
                                </button>
                            </>
                        )}

                        <p className="mt-3 text-xs text-center text-gray-400">
                            Need help?{' '}
                            <a
                                href="https://firebase.google.com/docs"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-orange-500 hover:underline"
                            >
                                Check the Firebase docs →
                            </a>
                        </p>
                    </div>
                </div>
            )}
        </>
    );
});