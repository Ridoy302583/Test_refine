// Remove unused imports
import React, { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Switch } from '~/components/ui/Switch';
import { useSettings } from '~/lib/hooks/useSettings';
import { classNames } from '~/utils/classNames';
import { toast } from 'react-toastify';
import { PromptLibrary } from '~/lib/common/prompt-library';

interface FeatureToggle {
  id: string;
  title: string;
  description: string;
  icon: string;
  enabled: boolean;
  beta?: boolean;
  experimental?: boolean;
  tooltip?: string;
}

const FeatureCard = memo(
  ({
    feature,
    index,
    onToggle,
  }: {
    feature: FeatureToggle;
    index: number;
    onToggle: (id: string, enabled: boolean) => void;
  }) => (
    <motion.div
      key={feature.id}
      layoutId={feature.id}
      className={classNames(
        'relative group cursor-pointer',
        'bg-gradient-to-br from-gray-900/90 to-black/90', // Brand background
        'hover:bg-gradient-to-br from-gray-800/90 to-black/90', // Hover state
        'border border-purple-500/20', // Brand border
        'transition-all duration-200',
        'rounded-lg overflow-hidden shadow-lg',
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      {/* Subtle gradient accent at the top */}
      <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-80"></div>
      
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Icon with glow effect */}
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center shadow-inner">
              <div className={classNames(feature.icon, 'w-5 h-5 text-blue-400')} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-white">{feature.title}</h4>
                {feature.beta && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-400 font-medium border border-blue-500/30">
                    Beta
                  </span>
                )}
                {feature.experimental && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-purple-500/20 text-purple-400 font-medium border border-purple-500/30">
                    Experimental
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-300 mt-1">{feature.description}</p>
            </div>
          </div>
          <Switch checked={feature.enabled} onCheckedChange={(checked) => onToggle(feature.id, checked)} />
        </div>
        
        {feature.tooltip && (
          <div className="mt-3 p-2 rounded-md bg-blue-900/10 border border-blue-500/10 text-xs text-gray-400">
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-blue-400 mr-1.5 mt-0.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
              {feature.tooltip}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  ),
);

const FeatureSection = memo(
  ({
    title,
    features,
    icon,
    description,
    onToggleFeature,
  }: {
    title: string;
    features: FeatureToggle[];
    icon: string;
    description: string;
    onToggleFeature: (id: string, enabled: boolean) => void;
  }) => (
    <motion.div
      layout
      className="flex flex-col gap-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-xl border border-purple-500/20">
        <div className="p-3 rounded-lg bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-purple-500/20">
          <div className={classNames(icon, 'text-2xl text-blue-400')} />
        </div>
        <div>
          <h3 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">{title}</h3>
          <p className="text-sm text-gray-300">{description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 gap-5">
        {features.map((feature, index) => (
          <FeatureCard key={feature.id} feature={feature} index={index} onToggle={onToggleFeature} />
        ))}
      </div>
    </motion.div>
  ),
);

export default function FeaturesTab() {
  const {
    autoSelectTemplate,
    isLatestBranch,
    contextOptimizationEnabled,
    eventLogs,
    setAutoSelectTemplate,
    enableLatestBranch,
    enableContextOptimization,
    setEventLogs,
    setPromptId,
    promptId,
  } = useSettings();

  // Enable features by default on first load
  React.useEffect(() => {
    // Only set defaults if values are undefined
    if (isLatestBranch === undefined) {
      enableLatestBranch(false); // Default: OFF - Don't auto-update from main branch
    }

    if (contextOptimizationEnabled === undefined) {
      enableContextOptimization(false); // Default: OFF - Disable context optimization
    }

    if (autoSelectTemplate === undefined) {
      setAutoSelectTemplate(false); // Default: OFF - Disable auto-select templates
    }

    if (promptId === undefined) {
      setPromptId('default'); // Default: 'default'
    }

    if (eventLogs === undefined) {
      setEventLogs(false); // Default: OFF - Disable event logging
    }
  }, []); // Only run once on component mount

  const handleToggleFeature = useCallback(
    (id: string, enabled: boolean) => {
      switch (id) {
        case 'latestBranch': {
          enableLatestBranch(enabled);
          toast.success(`Main branch updates ${enabled ? 'enabled' : 'disabled'}`);
          break;
        }

        case 'autoSelectTemplate': {
          setAutoSelectTemplate(enabled);
          toast.success(`Auto select template ${enabled ? 'enabled' : 'disabled'}`);
          break;
        }

        case 'contextOptimization': {
          enableContextOptimization(enabled);
          toast.success(`Context optimization ${enabled ? 'enabled' : 'disabled'}`);
          break;
        }

        case 'eventLogs': {
          setEventLogs(enabled);
          toast.success(`Event logging ${enabled ? 'enabled' : 'disabled'}`);
          break;
        }

        default:
          break;
      }
    },
    [enableLatestBranch, setAutoSelectTemplate, enableContextOptimization, setEventLogs],
  );

  const features = {
    stable: [
      // {
      //   id: 'latestBranch',
      //   title: 'Main Branch Updates',
      //   description: 'Get the latest updates from the main branch',
      //   icon: 'i-ph:git-branch',
      //   enabled: isLatestBranch,
      //   tooltip: 'Receive updates from the main development branch',
      // },
      {
        id: 'autoSelectTemplate',
        title: 'Auto Select Template',
        description: 'Automatically select starter template',
        icon: 'i-ph:selection',
        enabled: autoSelectTemplate,
        tooltip: 'Automatically select the most appropriate starter template',
      },
      {
        id: 'contextOptimization',
        title: 'Context Optimization',
        description: 'Optimize context for better responses',
        icon: 'i-ph:brain',
        enabled: contextOptimizationEnabled,
        tooltip: 'Enable improved AI responses through context optimization',
        experimental: true,
      },
      // {
      //   id: 'eventLogs',
      //   title: 'Event Logging',
      //   description: 'Enable detailed event logging and history',
      //   icon: 'i-ph:list-bullets',
      //   enabled: eventLogs,
      //   tooltip: 'Record detailed logs of system events and user actions',
      //   beta: true,
      // },
    ],
    beta: [],
  };

  return (
    <div className="flex flex-col gap-8">
      <FeatureSection
        title="Core Features"
        features={features.stable}
        icon="i-ph:check-circle"
        description="Essential features that can be enabled for optimal performance"
        onToggleFeature={handleToggleFeature}
      />

      {features.beta.length > 0 && (
        <FeatureSection
          title="Beta Features"
          features={features.beta}
          icon="i-ph:test-tube"
          description="New features that are ready for testing but may have some rough edges"
          onToggleFeature={handleToggleFeature}
        />
      )}

     
    </div>
  );
}