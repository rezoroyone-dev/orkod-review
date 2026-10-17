import axios from 'axios';
import http from 'http';
import { vi } from 'vitest';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import apiClient from '@/plugins/axios';
import { JSDOM } from 'jsdom';

// Setup jsdom for DOMPurify
const jsdom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
(global as any).window = jsdom.window;
(global as any).document = jsdom.window.document;
(global as any).navigator = jsdom.window.navigator;

// Initialize vuetify for tests (used in test mounting)
createVuetify({
  components,
  directives,
});

// Mock ResizeObserver for jsdom
// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.ResizeObserver = function() {
  return {
    observe: () => {},
    unobserve: () => {},
    disconnect: () => {},
  };
} as any;

// Mock vue-i18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: { value: 'en' }
  }),
}));

// localStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    length: 0,
    key: () => null,
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });
if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
}

global.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
if (typeof window !== 'undefined') {
    window.btoa = global.btoa;
}

// Helper function to convert FormData to buffer
async function formDataToBuffer(formData: FormData, boundary: string): Promise<Buffer> {
  const parts: Buffer[] = [];
  
  for (const [name, value] of formData.entries()) {
    parts.push(Buffer.from(`--${boundary}\r\n`));
    
    if (value instanceof Blob) {
      const arrayBuffer = await value.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const filename = (value as File).name || 'blob';
      const contentType = value.type || 'application/octet-stream';
      parts.push(Buffer.from(`Content-Disposition: form-data; name="${name}"; filename="${filename}"\r\n`));
      parts.push(Buffer.from(`Content-Type: ${contentType}\r\n\r\n`));
      parts.push(buffer);
      parts.push(Buffer.from('\r\n'));
    } else {
      parts.push(Buffer.from(`Content-Disposition: form-data; name="${name}"\r\n\r\n`));
      parts.push(Buffer.from(`${value}\r\n`));
    }
  }
  
  parts.push(Buffer.from(`--${boundary}--\r\n`));
  return Buffer.concat(parts);
}

// Configure axios to use Node's native http adapter for tests
// This allows axios to make real HTTP requests in the test environment
// eslint-disable-next-line @typescript-eslint/no-explicit-any
axios.defaults.adapter = async function(config: any) {
  return new Promise(async (resolve, reject) => {
    // Use the actual baseURL from config, or fallback to localhost:9091/api
    // The baseURL should include the /api suffix from AppConfigs.getServerURL()
    let baseURL = config.baseURL || 'http://localhost:9091';
    
    // Ensure baseURL always ends with /api for consistency
    if (!baseURL.endsWith('/api')) {
      baseURL = baseURL.replace(/\/?$/, '/api');
    }
    
    // Construct the full URL manually to ensure /api is preserved
    let fullUrl: string;
    if (config.url.startsWith('http://') || config.url.startsWith('https://')) {
      // Absolute URL - use as is
      fullUrl = config.url;
    } else {
      // Relative URL - append to baseURL
      const cleanBaseUrl = baseURL.replace(/\/+$/, '');
      const cleanPath = config.url.replace(/^\/+/, '');
      fullUrl = `${cleanBaseUrl}/${cleanPath}`;
    }
    
    const url = new URL(fullUrl);
    
    // Filter out undefined headers
    const filteredHeaders: Record<string, string> = {};
    if (config.headers) {
      for (const [key, value] of Object.entries(config.headers)) {
        if (value !== undefined) {
          filteredHeaders[key] = String(value);
        }
      }
    }
    
    const headers: http.OutgoingHttpHeaders = {
      'Content-Type': 'application/json',
      ...filteredHeaders,
    };
    
    // Handle Basic Auth for authentication requests
    if (config.auth) {
      const authString = `${config.auth.username}:${config.auth.password}`;
      headers['Authorization'] = `Basic ${Buffer.from(authString).toString('base64')}`;
    }
    
    // If no Authorization header yet, try to get token from:
    // 1. axios config headers (set by interceptor)
    // 2. localStorage (Pinia store persists there)
    // 3. Global test authentication state
    if (!headers['Authorization'] && !headers['authorization']) {
      // Check axios config headers (could be Authorization or authorization)
      const authHeader = config.headers?.Authorization || config.headers?.authorization;
      if (authHeader) {
        headers['Authorization'] = authHeader;
      } else {
        // Try localStorage (Pinia store persists there)
        try {
          const storedUser = localStorage.getItem('superUser');
          if (storedUser) {
            const user = JSON.parse(storedUser);
            if (user?.token) {
              headers['Authorization'] = `Bearer ${user.token}`;
            }
          }
        } catch (e) {
          // Ignore errors reading from localStorage
        }
      }
    }
    
    const options: http.RequestOptions = {
      hostname: url.hostname,
      port: url.port || 9091,
      path: url.pathname + url.search,
      method: config.method?.toUpperCase() || 'GET',
      headers,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const response = {
          data: data ? JSON.parse(data) : {},
          status: res.statusCode || 200,
          statusText: res.statusMessage || '',
          headers: res.headers as Record<string, string>,
          config,
        };
        
        // Handle error status codes
        if (res.statusCode && res.statusCode >= 400) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const error: any = new Error(`Request failed with status code ${res.statusCode}`);
          error.response = response;
          reject(error);
        } else {
          resolve(response);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    // Handle FormData for multipart/form-data requests
    // Check if data is FormData OR if Content-Type is multipart/form-data (without proper boundary)
    const isFormData = config.data && typeof config.data === 'object' && config.data.constructor.name === 'FormData';
    const contentType = headers['Content-Type'] as string;
    const isMultipartNoBoundary = contentType && contentType.includes('multipart/form-data') && !contentType.includes('boundary=');
    const isMultipart = (isFormData || isMultipartNoBoundary) && (!contentType || !contentType.includes('boundary='));
    
    if (isFormData || isMultipartNoBoundary) {
      const formData = isFormData ? config.data as FormData : new FormData();
      
      // Generate boundary and set proper Content-Type
      const boundary = '----FormDataBoundary' + Math.random().toString(36).substring(2);
      headers['Content-Type'] = `multipart/form-data; boundary=${boundary}`;
      
      // Convert FormData to buffer
      const formDataBuffer = await formDataToBuffer(formData, boundary);
      req.write(formDataBuffer);
    } else if (config.data) {
      if (typeof config.data === 'object') {
        req.write(JSON.stringify(config.data));
      } else {
        req.write(config.data);
      }
    }
    req.end();
  });
};

// Also set the adapter on the apiClient instance (used by services)
// @ts-ignore - adapter property exists but TypeScript doesn't recognize it
apiClient.defaults.adapter = axios.defaults.adapter;
