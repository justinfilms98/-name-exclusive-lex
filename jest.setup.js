// Polyfills for Node.js environment
import { TextEncoder, TextDecoder } from 'util';
import { Response, Request, Headers } from 'node-fetch';
import 'whatwg-fetch';
import { TransformStream, ReadableStream, WritableStream } from 'stream/web';

// Polyfill TextEncoder/TextDecoder
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}

// Polyfill fetch API
if (typeof global.Response === 'undefined') {
  global.Response = Response;
}
if (typeof global.Request === 'undefined') {
  global.Request = Request;
}
if (typeof global.Headers === 'undefined') {
  global.Headers = Headers;
}

// Polyfill URL and URLSearchParams
if (typeof global.URL === 'undefined') {
  global.URL = URL;
}
if (typeof global.URLSearchParams === 'undefined') {
  global.URLSearchParams = URLSearchParams;
}

// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    };
  },
  usePathname() {
    return '';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock environment variables
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.NEXTAUTH_SECRET = 'test-secret';

// Mock window.URL.createObjectURL
window.URL.createObjectURL = jest.fn(() => 'blob:test-url');

// Mock window.URL.revokeObjectURL
window.URL.revokeObjectURL = jest.fn();

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock BroadcastChannel
class MockBroadcastChannel {
  constructor() {}
  postMessage() {}
  close() {}
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() { return true; }
}

if (typeof global.BroadcastChannel === 'undefined') {
  global.BroadcastChannel = MockBroadcastChannel;
}

if (typeof global.TransformStream === 'undefined') {
  global.TransformStream = TransformStream;
}
if (typeof global.ReadableStream === 'undefined') {
  global.ReadableStream = ReadableStream;
}
if (typeof global.WritableStream === 'undefined') {
  global.WritableStream = WritableStream;
} 