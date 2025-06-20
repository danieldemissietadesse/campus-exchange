import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Auth from '@/components/Auth'

// Mock Firebase auth functions
jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  sendEmailVerification: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}))

describe('Auth Component', () => {
  const mockOnAuth = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders login form by default', () => {
    render(<Auth onAuth={mockOnAuth} />)
    
    expect(screen.getByText('Welcome Back!')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('your.name@wit.edu')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  test('validates WIT email requirement', async () => {
    render(<Auth onAuth={mockOnAuth} />)
    
    const emailInput = screen.getByPlaceholderText('your.name@wit.edu')
    const passwordInput = screen.getByPlaceholderText(/your password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    fireEvent.change(emailInput, { target: { value: 'test@gmail.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/please use your WIT email/i)).toBeInTheDocument()
    })
  })
})