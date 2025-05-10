import React from 'react';
import type { Template } from '~/types/template';
import { STARTER_TEMPLATES } from '~/utils/constants';

interface FrameworkLinkProps {
  template: Template;
}

const FrameworkLink: React.FC<FrameworkLinkProps> = ({ template }) => (
  <div className="group relative">
    <a
      href={`/git?url=https://github.com/${encodeURIComponent(template.githubRepo)}`}
      data-state="closed"
      data-discover="true"
      className="block relative"
    >
      {/* Icon container with cool hover effects */}
      <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-gray-800/40 to-gray-900/80 backdrop-blur-sm border border-gray-700/30 group-hover:border-blue-500/50 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-blue-500/20 overflow-hidden">
        {/* Background glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* Animated background pulse */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/20 to-pink-500/0 opacity-0 group-hover:opacity-100"
          style={{
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
          }}
        ></div>

        {/* Icon image */}
        <img
          src={template.icon}
          alt={template.label}
          className="w-8 h-8 opacity-70 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110 z-10"
        />

        {/* Animated border glow */}
        <div
          className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur opacity-0 group-hover:opacity-30 transition-opacity duration-300 -z-10"
          style={{
            animation: 'spin 6s linear infinite'
          }}
        ></div>
      </div>

      {/* Tooltip */}
      <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-gradient-to-br from-gray-800/90 to-gray-900/90 px-3 py-2 rounded-lg text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none w-max shadow-lg border border-purple-500/20 z-20 backdrop-blur-sm">
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 border-8 border-transparent border-b-gray-800/90"></div>
        {template.label}
      </div>
    </a>
  </div>
);

const StarterTemplates: React.FC<{
  importChat?: any;
  setTemplateLoading?: any;
  onTemplatesClose?: any;
}> = ({ importChat, setTemplateLoading, onTemplatesClose }) => {
  return (
    <div className="flex flex-col items-center gap-6">
      <h3
        className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"
        style={{
          animation: 'fadeInUp 0.3s ease-out 0.2s forwards',
          animationFillMode: 'backwards'
        }}
      >
        Choose a Template
      </h3>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-6 w-full max-w-3xl px-2 place-items-center">
        {STARTER_TEMPLATES.map((template, index) => (
          <div
            key={template.name}
            style={{
              animation: `fadeInUp 0.3s ease-out ${0.3 + index * 0.1}s forwards`,
              animationFillMode: `backwards`
            }}
          >
            <FrameworkLink template={template} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default StarterTemplates;