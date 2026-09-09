import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProfileSection from '@/components/ProfileSection'

jest.mock('@/lib/api', () => ({
  deleteListing: jest.fn(),
  getSavedListings: jest.fn().mockResolvedValue([])
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

  test('loads dark mode from localStorage on mount', () => {
    localStorage.getItem.mockReturnValue('true')
    
    render(<ProfileSection user={mockUser} userListings={mockUserListings} />)
    
    expect(localStorage.getItem).toHaveBeenCalledWith('darkMode')
  })

  test('toggles dark mode setting', async () => {
    const user = userEvent.setup()
    render(<ProfileSection user={mockUser} userListings={mockUserListings} />)
    
    // Navigate to settings tab
    const settingsTab = screen.getByText('Settings')
    await user.click(settingsTab)
    
    // Find and click dark mode toggle
    const darkModeToggle = screen.getByLabelText(/dark mode/i)
    expect(darkModeToggle).toBeInTheDocument()
    
    await user.click(darkModeToggle)
    
    // Check that localStorage was called
    expect(localStorage.setItem).toHaveBeenCalledWith('darkMode', 'true')
  })

  test('displays settings tab correctly', async () => {
    const user = userEvent.setup()
    render(<ProfileSection user={mockUser} userListings={mockUserListings} />)
    
    // Click settings tab
    const settingsTab = screen.getByText('Settings')
    await user.click(settingsTab)
    
    // Check that all settings are visible
    expect(screen.getByText('Account Settings')).toBeInTheDocument()
    expect(screen.getByText('Email Notifications')).toBeInTheDocument()
    expect(screen.getByText('Profile Visibility')).toBeInTheDocument()
    expect(screen.getByText('Dark Mode')).toBeInTheDocument()
  })

  test('displays saved listings tab', async () => {
    const user = userEvent.setup()
    render(<ProfileSection user={mockUser} userListings={mockUserListings} />)
    
    // Click saved tab
    const savedTab = screen.getByText('Saved')
    await user.click(savedTab)
    
    // Should show empty state initially
    expect(screen.getByText('No saved listings')).toBeInTheDocument()
  })
})