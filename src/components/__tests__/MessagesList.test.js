import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MessagesList from '@/components/MessagesList'

jest.mock('@/lib/api', () => ({
  markMessageAsRead: jest.fn()
}))

const currentUserId = 'current-user-id'

const mockMessages = [
  {
    id: 'msg-1',
    senderId: 'sender-1',
    recipientId: 'current-user-id',
    senderEmail: 'sender1@wit.edu',
    listingTitle: 'Calculus Textbook',
    message: 'Hi, is this textbook still available?',
    read: false,
    createdAt: { seconds: Date.now() / 1000 - 3600 }
  },
  {
    id: 'msg-2',
    senderId: 'sender-2',
    recipientId: 'current-user-id',
    senderEmail: 'sender2@wit.edu',
    listingTitle: 'Gaming Laptop',
    message: 'What is the condition of the laptop?',
    read: true,
    createdAt: { seconds: Date.now() / 1000 - 86400 }
  }
]

describe('MessagesList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders messages list header', () => {
    render(<MessagesList messages={mockMessages} currentUserId={currentUserId} />)

    expect(screen.getByText('💬 My Messages')).toBeInTheDocument()
  })

  test('displays received messages count', () => {
    render(<MessagesList messages={mockMessages} currentUserId={currentUserId} />)

    expect(screen.getByText('📥 Received (2)')).toBeInTheDocument()
  })

  test('shows NEW badge for unread messages', () => {
    render(<MessagesList messages={mockMessages} currentUserId={currentUserId} />)

    const newBadges = screen.getAllByText('NEW')
    expect(newBadges).toHaveLength(1)
  })

  test('marks message as read when clicked', async () => {
    const { markMessageAsRead } = require('@/lib/api')
    markMessageAsRead.mockResolvedValue()

    const user = userEvent.setup()
    render(<MessagesList messages={mockMessages} currentUserId={currentUserId} />)

    const unreadMessage = screen.getByText('Hi, is this textbook still available?').closest('div').parentElement
    await user.click(unreadMessage)

    expect(markMessageAsRead).toHaveBeenCalledWith('msg-1')
  })

  test('shows empty state when no messages', () => {
    render(<MessagesList messages={[]} currentUserId={currentUserId} />)

    expect(screen.getByText('No messages yet')).toBeInTheDocument()
  })
})