# frozen_string_literal: true

# JWT Configuration for Devise
Devise.setup do |config|
  # Configure JWT for API authentication
  config.jwt do |jwt|
    # Secret key for signing tokens (uses Rails secret_key_base)
    jwt.secret = Rails.application.credentials.secret_key_base

    # Which requests should dispatch (create) a JWT token
    # These routes will return a JWT in the Authorization header
    jwt.dispatch_requests = [
      ['POST', %r{^/login$}],
      ['POST', %r{^/signup$}]
    ]

    # Which requests should revoke (invalidate) a JWT token
    # These routes will blacklist the token
    jwt.revocation_requests = [
      ['DELETE', %r{^/logout$}]
    ]

    # Expiration time for tokens (24 hours)
    jwt.expiration_time = 24.hours.to_i

    # Algorithm used for signing (HS256 is secure and fast)
    jwt.aud_header = 'JWT'

    # Request formats that should process JWT
    jwt.request_formats = { user: [:json] }
  end
end
