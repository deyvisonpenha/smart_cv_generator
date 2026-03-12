# frozen_string_literal: true

module Api
  module V1
    class RegistrationsController < BaseController
      # Skip authentication for signup endpoint
      skip_before_action :authenticate_request!, only: [:create]

      # POST /api/v1/signup
      # Create a new user account and return JWT token
      def create
        user = User.new(registration_params)

        # Set default subscription values
        user.subscription_tier ||= 'free'
        user.subscription_status ||= 'active'

        # Optionally set trial period (14 days for new users)
        if params[:start_trial]
          user.trial_ends_at = 14.days.from_now
        end

        if user.save
          # Generate JWT token
          token = generate_jwt(user)

          render json: {
            message: 'Account created successfully',
            user: user_response(user),
            token: token
          }, status: :created
        else
          render json: {
            error: 'Registration failed',
            message: 'Unable to create account',
            errors: user.errors.full_messages
          }, status: :unprocessable_entity
        end
      end

      private

      # Strong parameters for registration
      def registration_params
        params.require(:user).permit(
          :email,
          :password,
          :password_confirmation
        )
      rescue ActionController::ParameterMissing
        # Allow params without 'user' wrapper
        params.permit(
          :email,
          :password,
          :password_confirmation
        )
      end

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
