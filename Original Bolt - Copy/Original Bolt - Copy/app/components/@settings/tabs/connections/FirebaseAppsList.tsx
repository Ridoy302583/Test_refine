import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { GradientIconBox } from '../../../ui/GradientIconBox';
import { Button } from '../../../ui/Button';

export interface FirebaseProject {
    id: number;
    user_id: number;
    api_key: string;
    app_id: string;
    auth_domain: string;
    database_url: string;
    measurement_id: string;
    messaging_sender_id: string;
    project_id: string;
    scope: string;
    status: string;
    storage_bucket: string;
    url_id: string;
}

interface FirebaseAppsListProps {
    projects?: FirebaseProject[];
}

export function FirebaseAppsList({ projects = [] }: FirebaseAppsListProps) {
    const [selectedProject, setSelectedProject] = useState<FirebaseProject | null>(null);
    const [showDetails, setShowDetails] = useState(false);

    // Select first project by default if available
    useEffect(() => {
        if (projects && projects.length > 0 && !selectedProject) {
            setSelectedProject(projects[0]);
        }
    }, [projects, selectedProject]);

    const handleViewDetails = (project: FirebaseProject) => {
        setSelectedProject(project);
        setShowDetails(true);
    };

    const handleBack = () => {
        setShowDetails(false);
    };

    // Format private key for display (show only beginning and end)
    const formatPrivateKey = (key: string) => {
        if (!key) return '';
        
        // Extract just the key part without the headers
        const keyPart = key.replace('-----BEGIN PRIVATE KEY-----\n', '')
            .replace('\n-----END PRIVATE KEY-----\n', '')
            .replace('\n-----END PRIVATE KEY-----', '');
            
        if (keyPart.length <= 40) return keyPart;
        return `${keyPart.substring(0, 20)}...${keyPart.substring(keyPart.length - 20)}`;
    };

    return (
        <motion.div
            className="bg-transparent border border-alpha-white-10 rounded-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
        >
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <GradientIconBox iconClassName="i-vscode-icons:file-type-firebase text-xl" />
                        <div>
                            <h3 className="text-lg font-medium text-white">Firebase Apps</h3>
                            <p className="text-sm text-gray-400">
                                {showDetails 
                                    ? `Details for project: ${selectedProject?.project_id}`
                                    : `You have ${projects.length} Firebase projects`
                                }
                            </p>
                        </div>
                    </div>
                    {showDetails && (
                        <Button 
                            onClick={handleBack}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                        >
                            <div className="i-ph:arrow-left w-4 h-4" />
                            Back to List
                        </Button>
                    )}
                </div>

                {!showDetails ? (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        {projects && projects.length > 0 ? (
                            projects.map((project, index) => (
                                <div 
                                    key={project.id || index} 
                                    className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-gray-600 transition-all cursor-pointer"
                                    onClick={() => handleViewDetails(project)}
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-md bg-orange-500/20 flex items-center justify-center">
                                                <div className="i-vscode-icons:file-type-firebase text-orange-500 text-xl"></div>
                                            </div>
                                            <div>
                                                <h4 className="text-white font-medium">{project.project_id}</h4>
                                                <p className="text-xs text-gray-400">
                                                    Scope: {project.scope} • Status: {project.status}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="i-ph:caret-right text-gray-400"></div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 text-gray-400">
                                <div className="i-ph:cloud-slash text-5xl mx-auto mb-3 opacity-50"></div>
                                <p>No Firebase projects found</p>
                            </div>
                        )}
                    </div>
                ) : selectedProject ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700/50">
                                <p className="text-sm text-gray-400 mb-1">Project ID</p>
                                <p className="text-white font-mono text-sm break-all">{selectedProject.project_id}</p>
                            </div>
                            <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700/50">
                                <p className="text-sm text-gray-400 mb-1">Auth Domain</p>
                                <p className="text-white font-mono text-sm break-all">{selectedProject.auth_domain}</p>
                            </div>
                            <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700/50">
                                <p className="text-sm text-gray-400 mb-1">API Key</p>
                                <p className="text-white font-mono text-sm break-all">{formatPrivateKey(selectedProject.api_key)}</p>
                            </div>
                        </div>
                        
                        <div className="flex gap-3 justify-end pt-4">
                            <Button
                                onClick={() => window.open('https://console.firebase.google.com', '_blank', 'noopener,noreferrer')}
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2"
                            >
                                <div className="i-hugeicons:dashboard-square-02 w-4 h-4" />
                                Firebase Console
                            </Button>
                        </div>
                    </div>
                ) : null}
            </div>
        </motion.div>
    );
}

export default FirebaseAppsList;