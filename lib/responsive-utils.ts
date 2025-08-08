/**
 * Responsive utility functions and constants for consistent breakpoint usage
 * across the SPT Teams HR Management application
 */

// Tailwind CSS breakpoints for reference
export const BREAKPOINTS = {
  sm: '640px',   // Small devices (landscape phones)
  md: '768px',   // Medium devices (tablets)
  lg: '1024px',  // Large devices (desktops)
  xl: '1280px',  // Extra large devices
  '2xl': '1536px' // 2X Extra large devices
} as const;

// Common responsive class patterns
export const RESPONSIVE_PATTERNS = {
  // Container patterns
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6',
  containerSmall: 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6',
  containerLarge: 'max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6',
  containerFluid: 'w-full px-4 sm:px-6 lg:px-8 space-y-6',
  
  // Grid patterns
  gridResponsive: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8',
  gridTwoCol: 'grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12',
  gridThreeCol: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8',
  gridFourCol: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8',
  gridAutoFit: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6',
  
  // Flex patterns
  flexResponsive: 'flex flex-col sm:flex-row gap-4 sm:gap-6',
  flexCenter: 'flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6',
  flexBetween: 'flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6',
  flexWrap: 'flex flex-wrap gap-4 sm:gap-6',
  
  // Text patterns
  textCenter: 'text-center sm:text-left',
  textResponsive: 'text-sm sm:text-base lg:text-lg',
  headingResponsive: 'text-2xl sm:text-3xl lg:text-4xl xl:text-5xl',
  
  // Spacing patterns
  paddingResponsive: 'p-4 sm:p-6 lg:p-8',
  marginResponsive: 'm-4 sm:m-6 lg:m-8',
  gapResponsive: 'gap-4 sm:gap-6 lg:gap-8',
  spaceYResponsive: 'space-y-4 sm:space-y-6 lg:space-y-8',
  spaceXResponsive: 'space-x-4 sm:space-x-6 lg:space-x-8',
  
  // Image patterns
  imageResponsive: 'w-full h-48 sm:h-56 md:h-64 lg:h-72 object-cover',
  avatarResponsive: 'w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12',
  iconResponsive: 'w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6',
  
  // Button patterns
  buttonResponsive: 'w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3',
  buttonGroup: 'flex flex-col sm:flex-row gap-2 sm:gap-4',
  
  // Navigation patterns
  navHidden: 'hidden lg:flex',
  navMobile: 'lg:hidden',
  navResponsive: 'flex flex-col lg:flex-row gap-4 lg:gap-8',
  
  // Card patterns
  cardResponsive: 'p-4 sm:p-6 lg:p-8 rounded-lg sm:rounded-xl',
  cardGrid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6',
  
  // DataTable patterns (specific to HR dashboard)
  tableContainer: 'w-full overflow-x-auto',
  tableResponsive: 'min-w-full divide-y divide-gray-200',
  tableCell: 'px-3 py-4 sm:px-6 text-sm',
  tableHeader: 'px-3 py-3 sm:px-6 text-xs font-medium uppercase tracking-wider',
  tableMobile: 'block sm:hidden',
  tableDesktop: 'hidden sm:table',
  
  // Dashboard patterns
  dashboardGrid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6',
  dashboardSidebar: 'w-full lg:w-64 xl:w-72',
  dashboardMain: 'flex-1 min-w-0 space-y-6',
  dashboardLayout: 'flex flex-col lg:flex-row gap-6 lg:gap-8',
  
  // Stats card patterns
  statsGrid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6',
  statsCard: 'p-4 sm:p-6 bg-white rounded-lg shadow',
  statsValue: 'text-2xl sm:text-3xl lg:text-4xl font-bold',
  statsLabel: 'text-sm sm:text-base text-gray-600',
  
  // Form patterns
  formGrid: 'grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6',
  formSection: 'space-y-6',
  formActions: 'flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end',
  formInput: 'w-full px-3 py-2 sm:px-4 sm:py-3',
  
  // HR specific patterns
  employeeCard: 'p-4 sm:p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow',
  attendanceGrid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4',
  leaveCalendar: 'w-full overflow-x-auto',
  recruitmentBoard: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6',
  payrollTable: 'w-full overflow-x-auto bg-white rounded-lg shadow',
  
  // Modal and dialog patterns
  modalContent: 'w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-4xl',
  modalPadding: 'p-4 sm:p-6 lg:p-8',
  
  // Search and filter patterns
  searchContainer: 'flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center',
  filterGroup: 'flex flex-wrap gap-2 sm:gap-4',
  
  // Responsive visibility
  showOnMobile: 'block sm:hidden',
  hideOnMobile: 'hidden sm:block',
  showOnTablet: 'hidden sm:block lg:hidden',
  showOnDesktop: 'hidden lg:block',
} as const;

/**
 * Utility function to combine responsive classes
 */
export function combineResponsiveClasses(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Check if current screen size matches breakpoint
 * Note: This is for client-side usage only
 */
export function useMediaQuery(query: string): boolean {
  if (typeof window === 'undefined') return false;
  
  const mediaQuery = window.matchMedia(query);
  return mediaQuery.matches;
}

/**
 * Common media queries
 */
export const MEDIA_QUERIES = {
  isMobile: '(max-width: 767px)',
  isTablet: '(min-width: 768px) and (max-width: 1023px)',
  isDesktop: '(min-width: 1024px)',
  isLarge: '(min-width: 1280px)',
  isExtraLarge: '(min-width: 1536px)',
  isTouch: '(hover: none) and (pointer: coarse)',
  isHover: '(hover: hover) and (pointer: fine)',
  prefersReducedMotion: '(prefers-reduced-motion: reduce)',
  prefersDarkMode: '(prefers-color-scheme: dark)',
  isLandscape: '(orientation: landscape)',
  isPortrait: '(orientation: portrait)',
} as const;

/**
 * Responsive image sizes for Next.js Image component
 */
export const IMAGE_SIZES = {
  hero: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  card: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw',
  avatar: '(max-width: 768px) 40px, (max-width: 1200px) 48px, 56px',
  thumbnail: '(max-width: 768px) 80px, (max-width: 1200px) 120px, 160px',
  full: '100vw',
  half: '50vw',
  quarter: '25vw',
} as const;

/**
 * Responsive typography scale
 */
export const TYPOGRAPHY_SCALE = {
  h1: 'text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold',
  h2: 'text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold',
  h3: 'text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-semibold',
  h4: 'text-lg sm:text-xl lg:text-2xl xl:text-3xl font-semibold',
  h5: 'text-base sm:text-lg lg:text-xl xl:text-2xl font-medium',
  h6: 'text-sm sm:text-base lg:text-lg xl:text-xl font-medium',
  body: 'text-sm sm:text-base lg:text-lg',
  bodySmall: 'text-xs sm:text-sm lg:text-base',
  caption: 'text-xs sm:text-sm',
  overline: 'text-xs uppercase tracking-wider',
} as const;

/**
 * Responsive spacing scale
 */
export const SPACING_SCALE = {
  xs: 'p-2 sm:p-3 lg:p-4',
  sm: 'p-3 sm:p-4 lg:p-6',
  md: 'p-4 sm:p-6 lg:p-8',
  lg: 'p-6 sm:p-8 lg:p-12',
  xl: 'p-8 sm:p-12 lg:p-16',
} as const;

/**
 * Responsive gap scale
 */
export const GAP_SCALE = {
  xs: 'gap-2 sm:gap-3 lg:gap-4',
  sm: 'gap-3 sm:gap-4 lg:gap-6',
  md: 'gap-4 sm:gap-6 lg:gap-8',
  lg: 'gap-6 sm:gap-8 lg:gap-12',
  xl: 'gap-8 sm:gap-12 lg:gap-16',
} as const;

/**
 * Helper function to get responsive classes based on screen size
 */
export function getResponsiveClasses({
  mobile,
  tablet,
  desktop,
  large,
}: {
  mobile?: string;
  tablet?: string;
  desktop?: string;
  large?: string;
}): string {
  const classes = [];
  
  if (mobile) classes.push(mobile);
  if (tablet) classes.push(`md:${tablet}`);
  if (desktop) classes.push(`lg:${desktop}`);
  if (large) classes.push(`xl:${large}`);
  
  return classes.join(' ');
}

/**
 * Helper function for responsive grid columns
 */
export function getResponsiveGrid({
  mobile = 1,
  tablet = 2,
  desktop = 3,
  large = 4,
  gap = 'md',
}: {
  mobile?: number;
  tablet?: number;
  desktop?: number;
  large?: number;
  gap?: keyof typeof GAP_SCALE;
} = {}): string {
  return combineResponsiveClasses(
    'grid',
    `grid-cols-${mobile}`,
    `md:grid-cols-${tablet}`,
    `lg:grid-cols-${desktop}`,
    `xl:grid-cols-${large}`,
    GAP_SCALE[gap]
  );
}

/**
 * Helper function for responsive flex direction
 */
export function getResponsiveFlex({
  mobile = 'col',
  tablet = 'row',
  gap = 'md',
  align = 'start',
  justify = 'start',
}: {
  mobile?: 'row' | 'col';
  tablet?: 'row' | 'col';
  gap?: keyof typeof GAP_SCALE;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
} = {}): string {
  return combineResponsiveClasses(
    'flex',
    `flex-${mobile}`,
    `md:flex-${tablet}`,
    `items-${align}`,
    `justify-${justify}`,
    GAP_SCALE[gap]
  );
}

/**
 * Helper function for responsive text sizes
 */
export function getResponsiveText({
  mobile = 'sm',
  tablet = 'base',
  desktop = 'lg',
  weight = 'normal',
}: {
  mobile?: string;
  tablet?: string;
  desktop?: string;
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
} = {}): string {
  return combineResponsiveClasses(
    `text-${mobile}`,
    `md:text-${tablet}`,
    `lg:text-${desktop}`,
    `font-${weight}`
  );
}

/**
 * Helper function for responsive padding
 */
export function getResponsivePadding({
  mobile = 4,
  tablet = 6,
  desktop = 8,
}: {
  mobile?: number;
  tablet?: number;
  desktop?: number;
} = {}): string {
  return combineResponsiveClasses(
    `p-${mobile}`,
    `md:p-${tablet}`,
    `lg:p-${desktop}`
  );
}

/**
 * Helper function for responsive margins
 */
export function getResponsiveMargin({
  mobile = 4,
  tablet = 6,
  desktop = 8,
}: {
  mobile?: number;
  tablet?: number;
  desktop?: number;
} = {}): string {
  return combineResponsiveClasses(
    `m-${mobile}`,
    `md:m-${tablet}`,
    `lg:m-${desktop}`
  );
}



/**
 * Custom hooks for responsive breakpoint checks
 */
export const useIsMobile = () => useMediaQuery(MEDIA_QUERIES.isMobile);
export const useIsTablet = () => useMediaQuery(MEDIA_QUERIES.isTablet);
export const useIsDesktop = () => useMediaQuery(MEDIA_QUERIES.isDesktop);
export const useIsLarge = () => useMediaQuery(MEDIA_QUERIES.isLarge);
export const useIsTouch = () => useMediaQuery(MEDIA_QUERIES.isTouch);
export const usePrefersReducedMotion = () => useMediaQuery(MEDIA_QUERIES.prefersReducedMotion);

/**
 * Breakpoint utilities object for easier importing
 */
export const breakpointUtils = {
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useIsLarge,
  useIsTouch,
  usePrefersReducedMotion,
};

/**
 * Export all utilities as a single object for easier importing
 */
export const ResponsiveUtils = {
  BREAKPOINTS,
  RESPONSIVE_PATTERNS,
  MEDIA_QUERIES,
  IMAGE_SIZES,
  TYPOGRAPHY_SCALE,
  SPACING_SCALE,
  GAP_SCALE,
  combineResponsiveClasses,
  useMediaQuery,
  getResponsiveClasses,
  getResponsiveGrid,
  getResponsiveFlex,
  getResponsiveText,
  getResponsivePadding,
  getResponsiveMargin,
  breakpointUtils,
} as const;

export default ResponsiveUtils;