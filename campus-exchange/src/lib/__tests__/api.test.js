import { apiGet, apiSend, createListing, sendMessage, streamListings } from '@/lib/api'

// Mock fetch
global.fetch = jest.fn()

// Mock Firebase auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: {
      getIdToken: jest.fn().mockResolvedValue('mock-token')
    }
  }))
}))

describe('API utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    fetch.mockClear()
  })

  test('apiGet makes GET request with auth headers', async () => {
    const mockResponse = { data: 'test' }
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    })

    const result = await apiGet('/test')

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5001/api/test',
      {
        headers: {
          Authorization: 'Bearer mock-token'
        }
      }
    )
    expect(result).toEqual(mockResponse)
  })

  test('apiSend makes POST request with JSON body', async () => {
    const mockResponse = { id: 'created' }
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    })

    const testData = { title: 'Test', price: 50 }
    const result = await apiSend('POST', '/listings', testData)

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5001/api/listings',
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer mock-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      }
    )
    expect(result).toEqual(mockResponse)
  })

  test('createListing handles file uploads', async () => {
    const mockResponse = { id: 'listing-id' }
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    })

    const testListing = {
      title: 'Test Item',
      price: 50,
      images: [new File([''], 'test.jpg', { type: 'image/jpeg' })]
    }

    const result = await createListing(testListing)

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5001/api/listings',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer mock-token'
        }),
        body: expect.any(FormData)
      })
    )
    expect(result).toEqual(mockResponse)
  })

  test('handles API errors', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 400
    })

    await expect(apiGet('/test')).rejects.toThrow('GET /test → 400')
  })
})