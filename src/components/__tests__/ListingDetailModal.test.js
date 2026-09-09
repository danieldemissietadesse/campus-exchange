import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ListingDetailModal from '@/components/ListingDetailModal'

jest.mock('@/lib/api', () => ({
  deleteListing: jest.fn()
}))

const mockListing = {
  id: 'listing-1',
  title: 'Calculus Textbook',
  price: 75,
  category: 'Textbooks',
  description: 'Great condition, barely used.',
  userId: 'seller-uid',
  userEmail: 'seller@wit.edu',
  imageUrls: ['https://example.com/image1.jpg'],
  createdAt: { seconds: 1640995200 }
}

const mockCurrentUser = {
  uid: 'current-user-uid',
  email: 'current@wit.edu'
}

const mockOwnerUser = {
  uid: 'seller-uid',
  email: 'seller@wit.edu'
}

const mockOnClose = jest.fn()
const mockOnMessageClick = jest.fn()

describe('ListingDetailModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders listing details correctly', () => {
    render(
      <ListingDetailModal
        listing={mockListing}
        currentUser={mockCurrentUser}
        onClose={mockOnClose}
        onMessageClick={mockOnMessageClick}
      />
    )

    expect(screen.getByText('Calculus Textbook')).toBeInTheDocument()
    expect(screen.getByText('$75')).toBeInTheDocument()
    expect(screen.getByText('📚 Textbooks')).toBeInTheDocument()
    expect(screen.getByText('Great condition, barely used.')).toBeInTheDocument()
  })

  test('shows message button for non-owner', () => {
    render(
      <ListingDetailModal
        listing={mockListing}
        currentUser={mockCurrentUser}
        onClose={mockOnClose}
        onMessageClick={mockOnMessageClick}
      />
    )

    const messageButton = screen.getByText('💬 Message Seller')
    expect(messageButton).toBeInTheDocument()

    fireEvent.click(messageButton)
    expect(mockOnMessageClick).toHaveBeenCalled()
  })

  test('shows delete button for owner', () => {
    render(
      <ListingDetailModal
        listing={mockListing}
        currentUser={mockOwnerUser}
        onClose={mockOnClose}
        onMessageClick={mockOnMessageClick}
      />
    )

    const deleteButton = screen.getByText('🗑️ Delete Listing')
    expect(deleteButton).toBeInTheDocument()
    expect(screen.queryByText('💬 Message Seller')).not.toBeInTheDocument()
  })

  test('handles delete confirmation', async () => {
    const { deleteListing } = require('@/lib/api')
    deleteListing.mockResolvedValue()

    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()

    render(
      <ListingDetailModal
        listing={mockListing}
        currentUser={mockOwnerUser}
        onClose={mockOnClose}
        onMessageClick={mockOnMessageClick}
      />
    )

    const deleteButton = screen.getByText('🗑️ Delete Listing')
    await user.click(deleteButton)

    await waitFor(() => {
      expect(deleteListing).toHaveBeenCalledWith('listing-1')
      expect(mockOnClose).toHaveBeenCalled()
    })

    confirmSpy.mockRestore()
  })
})