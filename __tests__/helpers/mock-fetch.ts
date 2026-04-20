/**
 * Mock Fetch Helper
 *
 * Utilities for mocking fetch API in tests
 */

export type FetchMockOptions = {
  status?: number;
  statusText?: string;
  ok?: boolean;
  body?: string;
  json?: any;
  headers?: Record<string, string>;
  arrayBuffer?: ArrayBuffer | Uint8Array;
  throwError?: Error;
};

/**
 * Create a mock fetch response
 */
export function createMockFetch(options: FetchMockOptions = {}) {
  const {
    status = 200,
    statusText = 'OK',
    ok = true,
    body = '',
    json = null,
    headers = {},
    arrayBuffer = null,
    throwError = null
  } = options;

  return async (url: string | URL | Request, requestOptions?: RequestInit): Promise<Response> => {
    if (throwError) {
      throw throwError;
    }

    return {
      ok,
      status,
      statusText,
      headers: new Headers(headers),
      text: async () => body,
      arrayBuffer: async () => {
        if (arrayBuffer instanceof Uint8Array) {
          return arrayBuffer.buffer.slice(arrayBuffer.byteOffset, arrayBuffer.byteOffset + arrayBuffer.byteLength);
        }
        if (arrayBuffer) {
          return arrayBuffer;
        }
        return new TextEncoder().encode(body).buffer;
      },
      json: async () => {
        if (json !== null) {
          return json;
        }
        if (body) {
          return JSON.parse(body);
        }
        throw new Error('No JSON content');
      }
    } as Response;
  };
}

/**
 * Create a mock fetch that captures the request
 */
export function createCapturingMockFetch() {
  let capturedUrl: string = '';
  let capturedOptions: RequestInit | undefined;

  const mockFetch = async (url: string | URL | Request, options?: RequestInit): Promise<Response> => {
    capturedUrl = url.toString();
    capturedOptions = options;

    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
      text: async () => '<html><body>Test</body></html>',
      arrayBuffer: async () => new TextEncoder().encode('<html><body>Test</body></html>').buffer,
      json: async () => ({ results: [] })
    } as Response;
  };

  return {
    mockFetch,
    getCapturedUrl: () => capturedUrl,
    getCapturedOptions: () => capturedOptions
  };
}

/**
 * Create a mock fetch that throws on abort
 */
export function createAbortableMockFetch(delayMs: number = 50) {
  return async (url: string | URL | Request, options?: RequestInit): Promise<Response> => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const abortError = new Error('The operation was aborted');
        abortError.name = 'AbortError';
        reject(abortError);
      }, delayMs);

      if (options?.signal) {
        options.signal.addEventListener('abort', () => {
          clearTimeout(timeout);
          const abortError = new Error('The operation was aborted');
          abortError.name = 'AbortError';
          reject(abortError);
        });
      }
    });
  };
}

/**
 * Save and restore global fetch
 */
export class FetchMocker {
  private originalFetch: typeof global.fetch;

  constructor() {
    this.originalFetch = global.fetch;
  }

  mock(mockFetch: typeof global.fetch): void {
    global.fetch = mockFetch;
  }

  restore(): void {
    global.fetch = this.originalFetch;
  }
}
