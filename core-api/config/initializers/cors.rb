# frozen_string_literal: true

# CORS Configuration for API-only Rails application.
# Allowed origins are read from ALLOWED_ORIGINS (comma-separated).
# Fallback covers standard local development ports.

_allowed_origins = ENV.fetch('ALLOWED_ORIGINS', 'http://localhost:3001,http://127.0.0.1:3001')
                      .split(',')
                      .map(&:strip)
                      .reject(&:empty?)

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins(*_allowed_origins)

    resource '*',
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      credentials: true,
      expose: ['Authorization'],
      max_age: Rails.env.production? ? 600 : 0
  end

  # Healthcheck is open to all so load balancers and Docker can reach it.
  allow do
    origins '*'
    resource '/up', headers: :any, methods: [:get, :head]
  end
end
