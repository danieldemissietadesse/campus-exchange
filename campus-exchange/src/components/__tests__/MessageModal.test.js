import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MessageModal from '@/components/MessageModal'

jest.mock('@/lib/api', () => ({
  sendMessage: jest.fn()
}))

const mockListing = {
  id: 'listing-1',
  title: 'Calculus Textbook',
  price: 75,
  category: 'Textbooks',
  userId: 'seller-uid',
  userEmail: 'seller@wit.edu',
  imageUrls: ['https://example.com/image1.jpg']
}

const mockCurrentUser = {
  uid: 'current-user-uid',
  email: 'current@wit.edu'
}

const mockOnClose = jest.fn()

describe('MessageModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders message modal with listing info', () => {
    render(
      <MessageModal
        listing={mockListing}
        currentUser={mockCurrentUser}
        onClose={mockOnClose}
      />
    )

    expect(screen.getByText('💬 Send Message')).toBeInTheDocument()
    expect(screen.getByText('Calculus Textbook')).toBeInTheDocument()
    expect(screen.getByText('$75')).toBeInTheDocument()
    expect(screen.getByText('To: seller@wit.edu')).toBeInTheDocument()
  })

  test('displays quick message options', () => {
    render(
      <MessageModal
        listing={mockListing}
        currentUser={mockCurrentUser}
        onClose={mockOnClose}
      />
    )

    expect(screen.getByText('Quick Messages:')).toBeInTheDocument()
    expect(screen.getByText("Hi! Is this item still available?")).toBeInTheDocument()
  })

  test('fills textarea with quick message when clicked', async () => {
    const user = userEvent.setup()
    render(
      <MessageModal
        listing={mockListing}
        currentUser={mockCurrentUser}
        onClose={mockOnClose}
      />
    )

    const quickMessageButton = screen.getByText("Hi! Is this item still available?")
    await user.click(quickMessageButton)

    const textarea = screen.getByPlaceholderText('Type your message here...')
    expect(textarea.value).toBe("Hi! Is this item still available?")
  })

  test('sends message successfully', async () => {
    const { sendMessage } = require('@/lib/api')
    sendMessage.mockResolvedValue({ id: 'message-id' })

    const user = userEvent.setup()
    render(
      <MessageModal
        listing={mockListing}
        currentUser={mockCurrentUser}
        onClose={mockOnClose}
      />
    )

    const textarea = screen.getByPlaceholderText('Type your message here...')
    await user.type(textarea, 'I am interested in this textbook')

    // Fix: Use getByRole for the submit button instead of text
    const sendButton = screen.getByRole('button', { name: /send message/i })
    await user.click(sendButton)

    await waitFor(() => {
      expect(sendMessage).toHaveBeenCalledWith({
        senderId: 'current-user-uid',
        senderEmail: 'current@wit.edu',
        recipientId: 'seller-uid',
        recipientEmail: 'seller@wit.edu',
        listingId: 'listing-1',
        listingTitle: 'Calculus Textbook',
        message: 'I am interested in this textbook'
      })
    })

    expect(mockOnClose).toHaveBeenCalled()
  })
})