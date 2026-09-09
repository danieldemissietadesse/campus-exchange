import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return ''
  },
}))

// Mock Firebase/Firestore
jest.mock('firebase/firestore', () => ({
  doc: jest.fn((db, collection, docId) => ({ 
    id: docId,
    path: `${collection}/${docId}`,
    collection,
    docId 
  })),
  getDoc: jest.fn().mockResolvedValue({
    exists: () => true,
    data: () => ({
      profileImageUrl: 'test-url',
      emailNotifications: true,
      profileVisibility: true,
      darkMode: false
    })
  }),
  setDoc: jest.fn().mockResolvedValue(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  getDocs: jest.fn().mockResolvedValue({
    docs: [],
    empty: true
  }),
  FieldValue: {
    serverTimestamp: jest.fn(() => new Date())
  }
}))

// Mock Firebase Storage
jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn().mockResolvedValue({ ref: { name: 'test-file' } }),
  getDownloadURL: jest.fn().mockResolvedValue('https://test-url.com/image.jpg'),
  deleteObject: jest.fn().mockResolvedValue()
}))

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Suppress JSDOM navigation warnings
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('Not implemented: navigation')) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})