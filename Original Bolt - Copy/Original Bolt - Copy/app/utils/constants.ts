import { LLMManager } from '~/lib/modules/llm/manager';
import type { Template } from '~/types/template';
import Astro from '~/styles/icons/dev/file-type-astro.svg'
import Next from '~/styles/icons/dev/file-type-next.svg'
import Qwik from '~/styles/icons/dev/qwik-icon-seeklogo.svg'
import Remix from '~/styles/icons/dev/remix-letter-dark.svg'
import ReactLogo from '~/styles/icons/dev/file-type-reactjs.svg'
import Vite from '~/styles/icons/dev/file-type-vite.svg'
import Slidev from '~/styles/icons/dev/file-type-svelte.svg'
import SvelteKit from '~/styles/icons/dev/file-type-svelte.svg'
import TypeScript from '~/styles/icons/dev/file-type-typescript-official.svg'
import Vue from '~/styles/icons/dev//file-type-vue.svg'
import Angular from '~/styles/icons/dev/file-type-angular.svg'
import Svelte from '~/styles/icons/dev/file-type-svelte.svg'
export const WORK_DIR_NAME = 'project';
export const WORK_DIR = `/home/${WORK_DIR_NAME}`;
export const MODIFICATIONS_TAG_NAME = 'bolt_file_modifications';
export const MODEL_REGEX = /^\[Model: (.*?)\]\n\n/;
export const PROVIDER_REGEX = /\[Provider: (.*?)\]\n\n/;
export const DEFAULT_MODEL = 'claude-3-5-sonnet-latest';
export const PROMPT_COOKIE_KEY = 'cachedPrompt';

const llmManager = LLMManager.getInstance(import.meta.env);

export const PROVIDER_LIST = llmManager.getAllProviders();
export const DEFAULT_PROVIDER = llmManager.getDefaultProvider();

export const providerBaseUrlEnvKeys: Record<string, { baseUrlKey?: string; apiTokenKey?: string }> = {};
PROVIDER_LIST.forEach((provider) => {
  providerBaseUrlEnvKeys[provider.name] = {
    baseUrlKey: provider.config.baseUrlKey,
    apiTokenKey: provider.config.apiTokenKey,
  };
});

// starter Templates

// export const STARTER_TEMPLATES: Template[] = [
//   {
//     name: 'Expo App',
//     label: 'Expo App',
//     description: 'Expo starter template for building cross-platform mobile apps',
//     githubRepo: 'xKevIsDev/bolt-expo-template',
//     tags: ['mobile', 'expo', 'mobile-app', 'android', 'iphone'],
//     icon: 'i-bolt:expo',
//   },
//   {
//     name: 'Basic Astro',
//     label: 'Astro Basic',
//     description: 'Lightweight Astro starter template for building fast static websites',
//     githubRepo: 'xKevIsDev/bolt-astro-basic-template',
//     tags: ['astro', 'blog', 'performance'],
//     icon: 'i-bolt:astro',
//   },
//   {
//     name: 'NextJS Shadcn',
//     label: 'Next.js with shadcn/ui',
//     description: 'Next.js starter fullstack template integrated with shadcn/ui components and styling system',
//     githubRepo: 'xKevIsDev/bolt-nextjs-shadcn-template',
//     tags: ['nextjs', 'react', 'typescript', 'shadcn', 'tailwind'],
//     icon: 'i-bolt:nextjs',
//   },
//   {
//     name: 'Vite Shadcn',
//     label: 'Vite with shadcn/ui',
//     description: 'Vite starter fullstack template integrated with shadcn/ui components and styling system',
//     githubRepo: 'xKevIsDev/vite-shadcn',
//     tags: ['vite', 'react', 'typescript', 'shadcn', 'tailwind'],
//     icon: 'i-bolt:shadcn',
//   },
//   {
//     name: 'Qwik Typescript',
//     label: 'Qwik TypeScript',
//     description: 'Qwik framework starter with TypeScript for building resumable applications',
//     githubRepo: 'xKevIsDev/bolt-qwik-ts-template',
//     tags: ['qwik', 'typescript', 'performance', 'resumable'],
//     icon: 'i-bolt:qwik',
//   },
//   {
//     name: 'Remix Typescript',
//     label: 'Remix TypeScript',
//     description: 'Remix framework starter with TypeScript for full-stack web applications',
//     githubRepo: 'xKevIsDev/bolt-remix-ts-template',
//     tags: ['remix', 'typescript', 'fullstack', 'react'],
//     icon: 'i-bolt:remix',
//   },
//   {
//     name: 'Slidev',
//     label: 'Slidev Presentation',
//     description: 'Slidev starter template for creating developer-friendly presentations using Markdown',
//     githubRepo: 'xKevIsDev/bolt-slidev-template',
//     tags: ['slidev', 'presentation', 'markdown'],
//     icon: 'i-bolt:slidev',
//   },
//   {
//     name: 'Sveltekit',
//     label: 'SvelteKit',
//     description: 'SvelteKit starter template for building fast, efficient web applications',
//     githubRepo: 'bolt-sveltekit-template',
//     tags: ['svelte', 'sveltekit', 'typescript'],
//     icon: 'i-bolt:svelte',
//   },
//   {
//     name: 'Vanilla Vite',
//     label: 'Vanilla + Vite',
//     description: 'Minimal Vite starter template for vanilla JavaScript projects',
//     githubRepo: 'xKevIsDev/vanilla-vite-template',
//     tags: ['vite', 'vanilla-js', 'minimal'],
//     icon: 'i-bolt:vite',
//   },
//   {
//     name: 'Vite React',
//     label: 'React + Vite + typescript',
//     description: 'React starter template powered by Vite for fast development experience',
//     githubRepo: 'xKevIsDev/bolt-vite-react-ts-template',
//     tags: ['react', 'vite', 'frontend', 'website', 'app'],
//     icon: 'i-bolt:react',
//   },
//   {
//     name: 'Vite Typescript',
//     label: 'Vite + TypeScript',
//     description: 'Vite starter template with TypeScript configuration for type-safe development',
//     githubRepo: 'xKevIsDev/bolt-vite-ts-template',
//     tags: ['vite', 'typescript', 'minimal'],
//     icon: 'i-bolt:typescript',
//   },
//   {
//     name: 'Vue',
//     label: 'Vue.js',
//     description: 'Vue.js starter template with modern tooling and best practices',
//     githubRepo: 'xKevIsDev/bolt-vue-template',
//     tags: ['vue', 'typescript', 'frontend'],
//     icon: 'i-bolt:vue',
//   },
//   {
//     name: 'Angular',
//     label: 'Angular Starter',
//     description: 'A modern Angular starter template with TypeScript support and best practices configuration',
//     githubRepo: 'xKevIsDev/bolt-angular-template',
//     tags: ['angular', 'typescript', 'frontend', 'spa'],
//     icon: 'i-bolt:angular',
//   },
// ];
export const STARTER_TEMPLATES: Template[] = [
  {
    name: 'websparks-astro',
    label: 'Astro Basic',
    description: 'Lightweight Astro starter template for building fast static websites',
    githubRepo: 'websparks-ai/websparks-astro-template',
    tags: ['astro', 'blog', 'performance'],
    icon: Astro,
    // name: 'websparks-astro-basic',
    // {
      //     name: 'websparks-astro-basic',
      //     label: 'Astro Basic',
      //     description: 'Lightweight Astro starter template for building fast static websites',
      //     githubRepo: 'https://github.com/websparks-ai/websparks-astro-template.git',
      //     tags: ['astro', 'blog', 'performance'],
      //     icon: Astro,
      //   },
  },
  {
    name: 'websparks-nextjs-shadcn',
    label: 'Next.js with shadcn/ui',
    description: 'Next.js starter fullstack template integrated with shadcn/ui components and styling system',
    githubRepo: 'websparks-ai/websparks-next-template',
    tags: ['nextjs', 'react', 'typescript', 'shadcn', 'tailwind'],
    icon: Next,
    // {
      //     name: 'websparks-nextjs',
      //     label: 'Next.js with shadcn/ui',
      //     description: 'Next.js starter fullstack template integrated with shadcn/ui components and styling system',
      //     githubRepo: 'https://github.com/websparks-ai/websparks-next-template.git',
      //     tags: ['nextjs', 'react', 'typescript', 'shadcn', 'tailwind'],
      //     icon: Next,
      //   },
    
  },
  {
    name: 'websparks-qwik-ts',
    label: 'Qwik TypeScript',
    description: 'Qwik framework starter with TypeScript for building resumable applications',
    githubRepo: 'websparks-ai/websparks-qwik-ts-template',
    tags: ['qwik', 'typescript', 'performance', 'resumable'],
    icon: Qwik,
    // {
      //     name: 'websparks-qwik-ts',
      //     label: 'Qwik TypeScript',
      //     description: 'Qwik framework starter with TypeScript for building resumable applications',
      //     githubRepo: 'https://github.com/websparks-ai/websparks-qwik-ts-template.git',
      //     tags: ['qwik', 'typescript', 'performance', 'resumable'],
      //     icon: Qwik,
      //   },
  },
  {
    name: 'websparks-remix-ts',
    label: 'Remix TypeScript',
    description: 'Remix framework starter with TypeScript for full-stack web applications',
    githubRepo: 'websparks-ai/websparks-remix-ts-template',
    tags: ['remix', 'typescript', 'fullstack', 'react'],
    icon: Remix,
    // {
      //     name: 'websparks-remix-ts',
      //     label: 'Remix TypeScript',
      //     description: 'Remix framework starter with TypeScript for full-stack web applications',
      //     githubRepo: 'https://github.com/websparks-ai/websparks-remix-ts-template.git',
      //     tags: ['remix', 'typescript', 'fullstack', 'react'],
      //     icon: Remix,
      //   },
  },
  {
    name: 'websparks-slidev',
    label: 'Slidev Presentation',
    description: 'Slidev starter template for creating developer-friendly presentations using Markdown',
    githubRepo: 'websparks-ai/websparks-slidev-template',
    tags: ['slidev', 'presentation', 'markdown'],
    icon: Slidev,
    //   {
//     name: 'websparks-slidev',
//     label: 'Slidev Presentation',
//     description: 'Slidev starter template for creating developer-friendly presentations using Markdown',
//     githubRepo: 'https://github.com/websparks-ai/websparks-slidev-template.git',
//     tags: ['slidev', 'presentation', 'markdown'],
//     icon: Slidev,
//   },
  },
  {
    name: 'websparks-sveltekit',
    label: 'SvelteKit',
    description: 'SvelteKit starter template for building fast, efficient web applications',
    githubRepo: 'websparks-ai/websparks-slidev-template',
    tags: ['svelte', 'sveltekit', 'typescript'],
    icon: SvelteKit,
    //     name: 'websparks-sveltekit',
//     label: 'SvelteKit',
//     description: 'SvelteKit starter template for building fast, efficient web applications',
//     githubRepo: 'https://github.com/websparks-ai/websparks-slidev-template.git',
//     tags: ['svelte', 'sveltekit', 'typescript'],
//     icon: SvelteKit,
//   },
  },
  {
    name: 'Websparks-vanilla-vite',
    label: 'Vanilla + Vite',
    description: 'Minimal Vite starter template for vanilla JavaScript projects',
    githubRepo: 'websparks-ai/websparks-vanilla-vite-template',
    tags: ['vite', 'vanilla-js', 'minimal'],
    icon: Vite,
    //   {
//     name: 'vanilla-vite',
//     label: 'Vanilla + Vite',
//     description: 'Minimal Vite starter template for vanilla JavaScript projects',
//     githubRepo: 'https://github.com/websparks-ai/websparks-vanilla-vite-template.git',
//     tags: ['vite', 'vanilla-js', 'minimal'],
//     icon: Vite,
//   },
  },
  {
    name: 'websparks-vite-react',
    label: 'React + Vite + typescript',
    description: 'React starter template powered by Vite for fast development experience',
    githubRepo: 'websparks-ai/websparks-react-vite-ts-template',
    tags: ['react', 'vite', 'frontend'],
    icon: ReactLogo,
    //   {
//     name: 'websparks-vite-react',
//     label: 'React + Vite + typescript',
//     description: 'React starter template powered by Vite for fast development experience',
//     githubRepo: 'https://github.com/websparks-ai/websparks-react-vite-ts-template.git',
//     tags: ['react', 'vite', 'frontend'],
//     icon: ReactLogo,
//   },
  },
  {
    name: 'websparks-vite-ts',
    label: 'Vite + TypeScript',
    description: 'Vite starter template with TypeScript configuration for type-safe development',
    githubRepo: 'websparks-ai/websparks-vite-ts-template',
    tags: ['vite', 'typescript', 'minimal'],
    icon: TypeScript,
    //   {
//     name: 'websparks-vite-ts',
//     label: 'Vite + TypeScript',
//     description: 'Vite starter template with TypeScript configuration for type-safe development',
//     githubRepo: 'https://github.com/websparks-ai/websparks-vite-ts-template.git',
//     tags: ['vite', 'typescript', 'minimal'],
//     icon: TypeScript,
//   },
  },
  {
    name: 'websparks-vue',
    label: 'Vue.js',
    description: 'Vue.js starter template with modern tooling and best practices',
    githubRepo: 'websparks-ai/websparks-vue-template',
    tags: ['vue', 'typescript', 'frontend'],
    icon: Vue,
    //   {
//     name: 'websparks-vue',
//     label: 'Vue.js',
//     description: 'Vue.js starter template with modern tooling and best practices',
//     githubRepo: 'https://github.com/websparks-ai/websparks-vue-template.git',
//     tags: ['vue', 'typescript', 'frontend'],
//     icon: Vue,
//   },
  },
  {
    name: 'websparks-angular',
    label: 'Angular Starter',
    description: 'A modern Angular starter template with TypeScript support and best practices configuration',
    githubRepo: 'websparks-ai/websparks-angular-template',
    tags: ['angular', 'typescript', 'frontend', 'spa'],
    icon: Angular,
    //   {
//     name: 'websparks-angular',
//     label: 'Angular Starter',
//     description: 'A modern Angular starter template with TypeScript support and best practices configuration',
//     githubRepo: 'https://github.com/websparks-ai/websparks-angular-template.git',
//     tags: ['angular', 'typescript', 'frontend', 'spa'],
//     icon: Angular,
//   },
  },
];