/**
 * Life Tracker Pro - Design System
 * Consistent colors, styles, and design tokens
 */

// Category-based color system
export const CATEGORY_COLORS = {
  work: {
    primary: 'blue',
    light: 'bg-blue-50',
    medium: 'bg-blue-100',
    dark: 'bg-blue-600',
    text: 'text-blue-700',
    border: 'border-blue-200',
    hover: 'hover:bg-blue-100',
    emoji: '💼'
  },
  study: {
    primary: 'green',
    light: 'bg-green-50',
    medium: 'bg-green-100',
    dark: 'bg-green-600',
    text: 'text-green-700',
    border: 'border-green-200',
    hover: 'hover:bg-green-100',
    emoji: '📚'
  },
  exercise: {
    primary: 'purple',
    light: 'bg-purple-50',
    medium: 'bg-purple-100',
    dark: 'bg-purple-600',
    text: 'text-purple-700',
    border: 'border-purple-200',
    hover: 'hover:bg-purple-100',
    emoji: '🏃'
  },
  personal: {
    primary: 'orange',
    light: 'bg-orange-50',
    medium: 'bg-orange-100',
    dark: 'bg-orange-600',
    text: 'text-orange-700',
    border: 'border-orange-200',
    hover: 'hover:bg-orange-100',
    emoji: '🎯'
  },
  creative: {
    primary: 'pink',
    light: 'bg-pink-50',
    medium: 'bg-pink-100',
    dark: 'bg-pink-600',
    text: 'text-pink-700',
    border: 'border-pink-200',
    hover: 'hover:bg-pink-100',
    emoji: '🎨'
  }
} as const;

// Status colors
export const STATUS_COLORS = {
  success: {
    light: 'bg-green-50',
    medium: 'bg-green-100',
    dark: 'bg-green-600',
    text: 'text-green-700',
    border: 'border-green-200'
  },
  warning: {
    light: 'bg-yellow-50',
    medium: 'bg-yellow-100',
    dark: 'bg-yellow-600',
    text: 'text-yellow-700',
    border: 'border-yellow-200'
  },
  error: {
    light: 'bg-red-50',
    medium: 'bg-red-100',
    dark: 'bg-red-600',
    text: 'text-red-700',
    border: 'border-red-200'
  },
  info: {
    light: 'bg-blue-50',
    medium: 'bg-blue-100',
    dark: 'bg-blue-600',
    text: 'text-blue-700',
    border: 'border-blue-200'
  }
} as const;

// Shadow system
export const SHADOWS = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl'
} as const;

// Border radius system
export const BORDER_RADIUS = {
  sm: 'rounded',
  md: 'rounded-lg',
  lg: 'rounded-xl',
  xl: 'rounded-2xl',
  full: 'rounded-full'
} as const;

// Spacing system
export const SPACING = {
  xs: 'p-1',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
  '2xl': 'p-12'
} as const;

// Animation classes
export const ANIMATIONS = {
  pulse: 'animate-pulse',
  spin: 'animate-spin',
  bounce: 'animate-bounce',
  fadeIn: 'animate-fade-in',
  slideUp: 'animate-slide-up'
} as const;

// Button variants
export const BUTTON_VARIANTS = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
  success: 'bg-green-600 hover:bg-green-700 text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  warning: 'bg-yellow-600 hover:bg-yellow-700 text-white',
  outline: 'border border-gray-300 hover:bg-gray-50 text-gray-700'
} as const;

// Card styles
export const CARD_STYLES = {
  default: 'bg-white border border-gray-200',
  elevated: 'bg-white shadow-lg border border-gray-200',
  interactive: 'bg-white hover:shadow-lg border border-gray-200 transition-shadow duration-200'
} as const;

// Typography scale
export const TYPOGRAPHY = {
  h1: 'text-3xl font-bold text-gray-900',
  h2: 'text-2xl font-bold text-gray-900',
  h3: 'text-xl font-semibold text-gray-900',
  h4: 'text-lg font-medium text-gray-900',
  body: 'text-base text-gray-700',
  small: 'text-sm text-gray-600',
  caption: 'text-xs text-gray-500'
} as const;

// Utility function to get category color
export const getCategoryColor = (categoryId: string) => {
  return CATEGORY_COLORS[categoryId as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.work;
};

// Utility function to get status color
export const getStatusColor = (status: string) => {
  return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.info;
};

// Time formatting utility
export const formatTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  
  return `${minutes}m ${secs > 0 ? ` ${secs}s` : ''}`;
};

// Format time with full precision
export const formatTimeDetailed = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

// Productivity score color mapping
export const getProductivityColor = (score: number) => {
  if (score >= 80) return STATUS_COLORS.success;
  if (score >= 60) return STATUS_COLORS.warning;
  return STATUS_COLORS.error;
};
