require('@testing-library/jest-dom');
const React = require('react');

let mockPathname = '/';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(),
  __setMockPathname: (p) => {
    mockPathname = p;
  },
}));

// Mock next/image
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }) {
    const imgSrc = typeof src === 'object' && src !== null ? src.src || '' : src;
    return React.createElement('img', { src: imgSrc, alt: alt || '', ...props });
  };
});

// Mock gsap animations & ScrollTrigger
jest.mock('gsap', () => {
  const gsapMock = {
    timeline: () => ({
      to: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      play: jest.fn(),
      pause: jest.fn(),
      restart: jest.fn(),
      kill: jest.fn(),
    }),
    to: jest.fn(),
    from: jest.fn(),
    set: jest.fn(),
    killTweensOf: jest.fn(),
    context: (cb) => {
      if (typeof cb === 'function') cb();
      return { revert: jest.fn() };
    },
    registerPlugin: jest.fn(),
  };
  return {
    __esModule: true,
    default: gsapMock,
    ...gsapMock,
  };
});

jest.mock('gsap/ScrollTrigger', () => {
  const scrollTriggerMock = {
    create: jest.fn(() => ({
      kill: jest.fn(),
      progress: 0,
    })),
    refresh: jest.fn(),
    getAll: jest.fn(() => []),
  };
  return {
    __esModule: true,
    ScrollTrigger: scrollTriggerMock,
    default: scrollTriggerMock,
  };
});

// Forward native Node global fetch to window in jsdom
if (typeof window !== 'undefined') {
  if (!window.fetch && typeof globalThis.fetch !== 'undefined') {
    window.fetch = globalThis.fetch.bind(globalThis);
    global.fetch = globalThis.fetch.bind(globalThis);
  }

  // Mock matchMedia if not present in jsdom
  if (!window.matchMedia) {
    window.matchMedia = (query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    });
  }

  // Mock scrollTo
  if (!window.scrollTo) {
    window.scrollTo = jest.fn();
  }
}
