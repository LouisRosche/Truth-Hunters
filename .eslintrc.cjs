module.exports = {
  root: true, // This is the root config, don't look for configs in parent directories

  // Environment: browser globals and ES2021 features
  env: {
    browser: true, // Enable browser globals (window, document, etc.)
    es2021: true,  // Enable ES2021 syntax (optional chaining, nullish coalescing, etc.)
  },

  // Extend recommended rule sets
  extends: [
    'eslint:recommended',              // ESLint's recommended rules
    'plugin:react/recommended',        // React best practices
    'plugin:react-hooks/recommended',  // React hooks rules (deps arrays, etc.)
  ],

  // Parser configuration for modern JavaScript
  parserOptions: {
    ecmaVersion: 'latest', // Support latest ECMAScript features
    sourceType: 'module',  // Use ES modules (import/export)
    ecmaFeatures: {
      jsx: true,           // Enable JSX syntax
    },
  },

  plugins: ['react', 'react-hooks'],

  // Configure React version for React-specific rules
  settings: {
    react: {
      version: '18.2', // Match our React version to avoid warnings
    },
  },

  // Custom rule overrides
  rules: {
    // React 17+ doesn't require importing React in JSX files
    'react/react-in-jsx-scope': 'off',

    // Prop-types disabled for now - TODO: Add PropTypes validation for production
    // This is a technical debt item that should be addressed for type safety
    'react/prop-types': 'off',

    // Allow unused variables if prefixed with underscore (e.g., _unusedParam)
    // Warns instead of errors to allow iterative development
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
};
