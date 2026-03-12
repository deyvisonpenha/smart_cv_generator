# frozen_string_literal: true

module Api
  module V1
    class SessionsController < BaseController
      # Skip authentication for login endpoint
      skip_before_action :authenticate_request!, only: [:create]

      # POST /api/v1/login
      # Authenticate user and return JWT token
      def create
        user = User.find_by(email: params[:email]&.downcase)

        if user&.valid_password?(params[:password])
          # Generate JWT token
          token = generate_jwt(user)

          render json: {
            message: 'Logged in successfully',
            user: user_response(user),
            token: token
          }, status: :ok
        else
          render json: {
            error: 'Invalid credentials',
            message: 'Email or password is incorrect'
          }, status: :unauthorized
        end
      end

      # DELETE /api/v1/logout
      # Revoke JWT token and logout user
      def destroy
        # TODO: Implement JWT blacklisting
        # For now, client-side deletion is sufficient
        # Future: Add token to jwt_denylists table

        render json: {
          message: 'Logged out successfully'
        }, status: :ok
      end

      # GET /api/v1/current_user
      # Return current authenticated user
      def show
        if current_user
          render json: {
            user: user_response(current_user)
          }, status: :ok
        else
          render json: {
            error: 'Not authenticated',
            message: 'No valid session found'
          }, status: :unauthorized
        end
      end

      private

      # Generate JWT token for user
      def generate_jwt(user)
        payload = {
          sub: user.id,
          email: user.email,
          exp: 24.hours.from_now.to_i,
          iat: Time.current.to_i
        }

        JWT.encode(
          payload,
          Rails.application.credentials.secret_key_base || Rails.application.secret_key_base,
          'HS256'
        )
      end

      # Format user response
      def user_response(user)
        {
          id: user.id,
          email: user.email,
          subscription_tier: user.subscription_tier,
          subscription_status: user.subscription_status,
          subscription_display: user.subscription_display,
          has_pro_access: user.has_pro_access?,
          trial_active: user.trial_active?,
          trial_ends_at: user.trial_ends_at,
          remaining_optimizations: user.remaining_optimizations,
          created_at: user.created_at,
          updated_at: user.updated_at
        }
      end
    end
  end
end
