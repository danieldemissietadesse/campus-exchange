import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { act } from 'react'

// Fix: Mock everything BEFORE importing the component
jest.mock('@/app/firebaseConfig', () => ({
  auth: {
    currentUser: {
      uid: 'test-uid',
      email: 'test@wit.edu',
      emailVerified: true,
      metadata: {
        creationTime: '2024-01-01T00:00:00.000Z'
      }
    },
    signOut: jest.fn()
  }
}))

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn((auth, callback) => {
    callback({
      uid: 'test-uid',
      email: 'test@wit.edu',
      emailVerified: true,
      metadata: {
        creationTime: '2024-01-01T00:00:00.000Z'
      }
    })
    return jest.fn()
  }),
  reload: jest.fn()
}))

jest.mock('@/lib/api', () => ({
  streamListings: jest.fn((callback) => {
    callback([
      {
        id: '1',
        title: 'Test Textbook',
        price: 50,
        category: 'Textbooks',
        description: 'Great condition',
        userId: 'other-user',
        userEmail: 'other@wit.edu',
        imageUrls: ['https://example.com/image.jpg'],
        createdAt: { seconds: Date.now() / 1000 }
      }
    ])
    return jest.fn()
  }),
  streamMessages: jest.fn((userId, callback) => {
    callback([
      {
        id: 'msg1',
        senderId: 'other-user',
        recipientId: 'test-uid',
        message: 'Hi, interested in your item',
        read: false,
        listingTitle: 'Test Item',
        createdAt: { seconds: Date.now() / 1000 }
      }
    ])
    return jest.fn()
  })
}))

// Mock components
jest.mock('@/components/Auth', () => {
  return function MockAuth() {
    return <div data-testid="auth-component">Auth Component</div>
  }
})

jest.mock('@/components/VerificationPage', () => {
  return function MockVerificationPage() {
    return <div data-testid="verification-page">Verification Page</div>
  }
})

// NOW import the component after all mocks are set up
import HomePage from '@/app/page'

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders main marketplace interface for authenticated user', async () => {
    await act(async () => {
      render(<HomePage />)
    })

    expect(screen.getByText('📦 Campus Exchange')).toBeInTheDocument()
    expect(screen.getByText(/WIT Student Marketplace/)).toBeInTheDocument()
    expect(screen.getByText(/Post New Item/)).toBeInTheDocument()
  })

  test('displays user email in header', async () => {
    await act(async () => {
      render(<HomePage />)
    })

    expect(screen.getByText('test@wit.edu')).toBeInTheDocument()
  })
})