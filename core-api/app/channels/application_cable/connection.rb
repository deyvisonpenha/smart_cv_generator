# frozen_string_literal: true

module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_user

    def connect
      self.current_user = find_verified_user
      logger.add_tags 'ActionCable', "User #{current_user.id}"
    end

    private

    def find_verified_user
      # Get token from connection params or headers
      token = request.params[:token] || extract_token_from_header

      return reject_unauthorized_connection unless token

      begin
        decoded = JWT.decode(
          token,
          Rails.application.credentials.secret_key_base || Rails.application.secret_key_base,
          true,
          { algorithm: 'HS256' }
        ).first

        user = User.find(decoded['sub'])
        logger.info "ActionCable connection established for user #{user.id}"
        user
      rescue JWT::DecodeError, JWT::ExpiredSignature => e
        logger.error "JWT decode error: #{e.message}"
        reject_unauthorized_connection
      rescue ActiveRecord::RecordNotFound
        logger.error "User not found for token"
        reject_unauthorized_connection
      end
    end

    def extract_token_from_header
      # Extract token from Authorization header
      auth_header = request.headers['Authorization']
      return nil unless auth_header

      auth_header.split(' ').last
    end
  end
end
