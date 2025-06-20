import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProfileSection from '@/components/ProfileSection'

jest.mock('@/lib/api', () => ({
  deleteListing: jest.fn()
}))

const mockUser = {
  uid: 'test-uid',
  email: 'test@wit.edu',
  metadata: {
    creationTime: '2024-01-01T00:00:00.000Z'
  }
}

const mockUserListings = [
  {
    id: 'listing-1',
    title: 'Calculus Textbook',
    price: 75,
    category: 'Textbooks',
    imageUrls: ['https://example.com/image1.jpg']
  },
  {
    id: 'listing-2',
    title: 'Gaming Laptop',
    price: 800,
    category: 'Electronics',
    imageUrls: []
  }
]

describe('ProfileSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders profile information correctly', () => {
    render(<ProfileSection user={mockUser} userListings={mockUserListings} />)

    expect(screen.getByText('👤 My Profile')).toBeInTheDocument()
    expect(screen.getByText('test@wit.edu')).toBeInTheDocument()
    // Fix: Use regex to handle different date formats
    expect(screen.getByText(/2024|2023/)).toBeInTheDocument()
    expect(screen.getByText('✅ Verified WIT Student')).toBeInTheDocument()
  })

  test('displays statistics correctly', () => {
    render(<ProfileSection user={mockUser} userListings={mockUserListings} />)

    expect(screen.getByText('2')).toBeInTheDocument() // Active listings count
    expect(screen.getByText('$875')).toBeInTheDocument() // Total value (75 + 800)
  })

  test('displays active listings', () => {
    render(<ProfileSection user={mockUser} userListings={mockUserListings} />)

    // Fix: Use flexible text matching for split elements
    expect(screen.getByText(/My Active Listings/)).toBeInTheDocument()
    expect(screen.getByText('Calculus Textbook')).toBeInTheDocument()
    expect(screen.getByText('Gaming Laptop')).toBeInTheDocument()
    // Look for the number 2 which represents the count
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  test('shows empty state when no listings', () => {
    render(<ProfileSection user={mockUser} userListings={[]} />)

    expect(screen.getByText('No active listings')).toBeInTheDocument()
    expect(screen.getByText(/You haven't posted any items yet/)).toBeInTheDocument()
  })

  test('handles delete listing', async () => {
    const { deleteListing } = require('@/lib/api')
    deleteListing.mockResolvedValue()

    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()

    render(<ProfileSection user={mockUser} userListings={mockUserListings} />)

    const deleteButtons = screen.getAllByText('🗑️ Delete')
    await user.click(deleteButtons[0])

    await waitFor(() => {
      expect(deleteListing).toHaveBeenCalledWith('listing-1')
    })

    confirmSpy.mockRestore()
  })
})