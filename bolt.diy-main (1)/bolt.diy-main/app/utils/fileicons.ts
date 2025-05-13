import Vite from '~/styles/icons/dev/file-type-vite.svg'
import Node from '~/styles/icons/dev/file-type-node.svg'
import Html from '~/styles/icons/dev/file-type-html.svg'
import Css from '~/styles/icons/dev/file-type-css2.svg'
import Scss from '~/styles/icons/dev/file-type-scss.svg'
import Sass from '~/styles/icons/dev/file-type-sass.svg'
import Postcss from '~/styles/icons/dev/file-type-postcss.svg'
import Less from '~/styles/icons/dev/file-type-less.svg'
import Routes from '~/styles/icons/dev/routing.svg'

import JS from '~/styles/icons/dev/file-type-js-official.svg'
import TS from '~/styles/icons/dev/file-type-typescript-official.svg'
import JSX from '~/styles/icons/dev/file-type-reactjs.svg'
import TSX from '~/styles/icons/dev/file-type-reactts.svg'
import tsdeff from '~/styles/icons/dev/typescript-def.svg'
import Vue from '~/styles/icons/dev/file-type-vue.svg'
import Angular from '~/styles/icons/dev/file-type-angular.svg'
import TsConfig from '~/styles/icons/dev/file-type-tsconfig.svg'

import Python from '~/styles/icons/dev/file-type-python.svg'
import Java from '~/styles/icons/dev/file-type-java.svg'
import Kotlin from '~/styles/icons/dev/file-type-kotlin.svg'
import Cpp from '~/styles/icons/dev/file-type-cpp3.svg'
import C from '~/styles/icons/dev/file-type-c3.svg'
import CS from '~/styles/icons/dev/file-type-csharp2.svg'
import Go from '~/styles/icons/dev/file-type-go.svg'
import RB from '~/styles/icons/dev/file-type-ruby.svg'
import PHP from '~/styles/icons/dev/file-type-php.svg'
import Swift from '~/styles/icons/dev/file-type-swift.svg'
import RS from '~/styles/icons/dev/file-type-rust.svg'
import DART from '~/styles/icons/dev/file-type-dartlang.svg'

import JSON from '~/styles/icons/dev/file-type-json.svg'
import TXT from '~/styles/icons/dev/file-type-text.svg'
import PDF from '~/styles/icons/dev/file-type-pdf2.svg'
import Word from '~/styles/icons/dev/file-type-word.svg'
import Excell from '~/styles/icons/dev/file-type-excel.svg'
import PowerPoint from '~/styles/icons/dev/file-type-powerpoint.svg'

import Prisma from '~/styles/icons/dev/file-type-prisma.svg'

import Image from '~/styles/icons/dev/file-type-image.svg'
import SVG from '~/styles/icons/dev/file-type-svg.svg'
import Favicon from '~/styles/icons/dev/file-type-favicon.svg'

import Ini from '~/styles/icons/dev/file-type-ini.svg'
import Yml from '~/styles/icons/dev/file-type-yaml-official.svg'
import Xml from '~/styles/icons/dev/file-type-xml.svg'
import Shell from '~/styles/icons/dev/file-type-shell.svg'
import Zip from '~/styles/icons/dev/file-type-zip.svg'

import Database from '~/styles/icons/dev/file-type-sql.svg'

import Jest from '~/styles/icons/dev/file-type-jest.svg'
import Tailwindcss from '~/styles/icons/dev/file-type-tailwind.svg'
import Eslint from '~/styles/icons/dev/file-type-eslint.svg'
import Prettier from '~/styles/icons/dev/file-type-prettier.svg'
import Next from '~/styles/icons/dev/file-type-next.svg'
import Nuxt from '~/styles/icons/dev/file-type-nuxt.svg'
import Astro from '~/styles/icons/dev/file-type-astro.svg'
import Svelte from '~/styles/icons/dev/file-type-svelte.svg'
import Webpack from '~/styles/icons/dev/file-type-webpack.svg'
import Rollup from '~/styles/icons/dev/file-type-rollup.svg'
import Dotenv from '~/styles/icons/dev/file-type-dotenv.svg'
import Git from '~/styles/icons/dev/file-type-git.svg'
import Docker from '~/styles/icons/dev/file-type-docker2.svg'
import Markdown from '~/styles/icons/dev/markdown-4.svg'

import License from '~/styles/icons/dev/certificate-39.svg'
import Font from '~/styles/icons/dev/file-type-font.svg'

interface FileIconConfig {
    icon: string;
    label?:string;
    programming?:boolean;
    framework?:boolean;
}

const getFileIconConfig = (filename: string): FileIconConfig => {
    // Check for specific config files first
    const filenameToCheck = filename.toLowerCase();

    // Config files
    if (filenameToCheck === '.d.ts') {
        return { icon: tsdeff };
    }

    if (filenameToCheck === 'routes.js' || filenameToCheck === 'routes.ts' || filenameToCheck === 'routes.jsx' || filenameToCheck === 'routes.tsx') {
        return { icon: Routes };
    }

    if (filenameToCheck === 'license' || filenameToCheck === 'License' || filenameToCheck === 'LICENSE') {
        return { icon: License };
    }

    if (filenameToCheck === 'vite.config.js' || filenameToCheck === 'vite.config.ts') {
        return { icon: Vite };
    }

    if (filenameToCheck === 'tailwind.config.js' || filenameToCheck === 'tailwind.config.ts') {
        return { icon: Tailwindcss };
    }

    if (filenameToCheck === 'eslint.config.mjs' || filenameToCheck === '.eslintrc.json' || filenameToCheck === 'eslint.config.js' || filenameToCheck === 'eslint.config.ts') {
        return { icon: Eslint };
    }

    if (filenameToCheck === 'tsconfig.json') {
        return { icon: TsConfig };
    }

    if (filenameToCheck === '.prettierrc' || filenameToCheck === '.prettierignore') {
        return { icon: Prettier };
    }

    if (filenameToCheck === 'angular.json') {
        return { icon: Angular };
    }

    if (filenameToCheck === 'tsconfig.json' || filenameToCheck === 'tsconfig.app.json' || filenameToCheck === 'tsconfig.node.json') {
        return { icon: TsConfig };
    }

    if (filenameToCheck === 'package.json' || filenameToCheck === 'package-lock.json') {
        return { icon: Node };
    }

    if (filenameToCheck === 'next.config.js' || filenameToCheck === 'next.config.ts') {
        return { icon: Next };
    }

    if (filenameToCheck === 'postcss.config.js' || filenameToCheck === 'postcss.config.ts') {
        return { icon: Postcss };
    }

    if (filenameToCheck === 'nuxt.config.js' || filenameToCheck === 'nuxt.config.ts') {
        return { icon: Nuxt };
    }

    if (filenameToCheck === 'astro.config.js' || filenameToCheck === 'astro.config.ts') {
        return { icon: Astro };
    }

    if (filenameToCheck === 'svelte.config.js' || filenameToCheck === 'svelte.config.ts') {
        return { icon: Svelte };
    }

    if (filenameToCheck === 'webpack.config.js' || filenameToCheck === 'webpack.config.ts') {
        return { icon: Webpack };
    }

    if (filenameToCheck === 'rollup.config.js' || filenameToCheck === 'rollup.config.ts') {
        return { icon: Rollup };
    }

    if (filenameToCheck === 'jest.config.js' || filenameToCheck === 'jest.config.ts') {
        return { icon: Jest };
    }

    if (filenameToCheck === '.env' || filenameToCheck.startsWith('.env.')) {
        return { icon: Dotenv };
    }

    if (filenameToCheck === '.github' || filenameToCheck === '.gitignore' || filenameToCheck === '.gitattributes') {
        return { icon: Git };
    }

    if (filenameToCheck === 'dockerfile' || filenameToCheck === 'docker-compose.yml') {
        return { icon: Docker };
    }

    if (filenameToCheck === 'readme.md') {
        return { icon:Markdown};
    }

    // If not a special file, get the extension
    const extension = filename.split('.').pop()?.toLowerCase() || '';

    // Map of file extensions to MDI icons and their colors
    const iconMap: { [key: string]: FileIconConfig } = {
        // Web
        'html': { icon: Html, label:'html', programming:false, framework:false },
        'astro': { icon: Astro },
        'htm': { icon: Html },
        'css': { icon: Css },
        'scss': { icon: Scss },
        'sass': { icon: Sass },
        'less': { icon: Less },
        'js': { icon: JS },
        'javascript': { icon: JS },
        'jsx': { icon: JSX },
        'd.ts': { icon: tsdeff },
        'ts': { icon: TS },
        'typescript': { icon: TS },
        'tsx': { icon: TSX },
        'vue': { icon: Vue },

        'ttf': { icon: Font },
        'woff': { icon: Font },
        'woff2': { icon: Font },

        // Programming Languages
        'py': { icon: Python },
        'python': { icon: Python },
        'java': { icon: Java},
        'kt': { icon: Kotlin },
        'kotlin': { icon: Kotlin },
        'cpp': { icon: Cpp},
        'c++': { icon: Cpp},
        'c': { icon: C },
        'dart': { icon: DART },
        'cs': { icon: CS },
        'c#': { icon: CS },
        'go': { icon: Go },
        'rb': { icon: RB },
        'ruby': { icon: RB },
        'php': { icon: PHP },
        'swift': { icon: Swift },
        'rs': { icon: RS },
        'rust': { icon: RS },

        // Data & Config
        'json': { icon: JSON },
        'xml': { icon: Xml },
        'yaml': { icon: Yml },
        'yml': { icon: Yml },
        'toml': { icon: Yml },
        'ini': { icon: Ini },
        'env': { icon: Dotenv },

        // Documents
        'md': { icon: Markdown },
        'txt': { icon: TXT },
        'pdf': { icon: PDF},
        'doc': { icon: Word },
        'docx': { icon: Word },
        'csv': { icon: Excell },
        'xlsx': { icon: Excell },

        // Images
        'png': { icon: Image },
        'jpg': { icon: Image },
        'jpeg': { icon: Image },
        'gif': { icon: Image },
        'svg': { icon: SVG },
        'ico': { icon: Favicon },

        //Database
        'sql': { icon: Database },
        'prisma': { icon: Prisma },

        // Other
        'zip': { icon: Zip },
        'rar': { icon: Zip },
        'tar': { icon: Zip },
        'gz': { icon: Zip },
        'sh': { icon: Shell },
    };

    return iconMap[extension] || { icon: TXT };
};

export default getFileIconConfig;