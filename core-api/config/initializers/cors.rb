# frozen_string_literal: true

# CORS Configuration for API-only Rails application
# Allows React frontend to make cross-origin requests

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  # Development environment - allow localhost
  allow do
    # React typically runs on port 3001, 3002, or 5173 (Vite)
    # Adjust these origins based on your frontend setup
    origins(
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:5173',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3002',
      'http://127.0.0.1:5173'
    )

    resource '*',
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      credentials: true,
      expose: ['Authorization'] # Expose JWT token in response headers
  end

  # Production environment - allow your production domains
  if Rails.env.production?
    allow do
      # Add your production frontend URLs here
      origins ENV.fetch('FRONTEND_URL', 'https://smartcv.com')

      resource '*',
        headers: :any,
        methods: [:get, :post, :put, :patch, :delete, :options, :head],
        credentials: true,
        expose: ['Authorization'],
        max_age: 600 # Cache preflight requests for 10 minutes
    end
  end

  # Allow requests from Docker network (for internal service communication)
  allow do
    origins '*' # Only use this for internal Docker communication

    resource '/up',
      headers: :any,
      methods: [:get, :head]
  end
end
