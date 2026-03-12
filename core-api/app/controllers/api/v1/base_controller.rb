# frozen_string_literal: true

module Api
  module V1
    class BaseController < ActionController::API
      # Custom authentication before action
      before_action :authenticate_request!

      # Handle common errors
      rescue_from ActiveRecord::RecordNotFound, with: :not_found
      rescue_from ActiveRecord::RecordInvalid, with: :unprocessable_entity
      rescue_from ActionController::ParameterMissing, with: :bad_request

      # Make current_user available
      attr_reader :current_user

      private

      # Authenticate the request by validating JWT token
      def authenticate_request!
        @current_user = nil

        header = request.headers['Authorization']
        return render_unauthorized unless header

        token = header.split(' ').last
        return render_unauthorized unless token

        begin
          decoded = decode_jwt(token)
          @current_user = User.find(decoded['sub'])
        rescue ActiveRecord::RecordNotFound
          render_unauthorized
        rescue JWT::DecodeError, JWT::ExpiredSignature => e
          render json: {
            error: 'Invalid token',
            message: e.message
          }, status: :unauthorized
        end
      end

      # Decode JWT token
      def decode_jwt(token)
        JWT.decode(
          token,
          Rails.application.credentials.secret_key_base || Rails.application.secret_key_base,
          true,
          { algorithm: 'HS256' }
        ).first
      end

      # Check if user has pro access
      def require_pro_access!
        unless current_user&.has_pro_access?
          render json: {
            error: 'Pro subscription required',
            message: 'This feature requires a Pro or Enterprise subscription',
            subscription_tier: current_user&.subscription_tier
          }, status: :forbidden
        end
      end

      # Check rate limits for free tier users
      def check_optimization_limit!
        unless current_user.can_create_optimization?
          render json: {
            error: 'Rate limit exceeded',
            message: 'You have reached your monthly limit of 5 optimizations',
            remaining: 0,
            upgrade_url: '/pricing'
          }, status: :too_many_requests
        end
      end

      # Pagination helpers
      def pagination_params
        {
          page: params[:page] || 1,
          per_page: [params[:per_page]&.to_i || 20, 100].min # Max 100 per page
        }
      end

      def paginate(collection)
        page = pagination_params[:page]
        per_page = pagination_params[:per_page]

        collection.offset((page.to_i - 1) * per_page).limit(per_page)
      end

      # Render paginated response
      def render_paginated(collection, serializer: nil)
        page = pagination_params[:page].to_i
        per_page = pagination_params[:per_page]

        total_count = collection.count
        total_pages = (total_count.to_f / per_page).ceil

        paginated = paginate(collection)

        render json: {
          data: serializer ? paginated.map { |item| serializer.new(item).as_json } : paginated,
          meta: {
            current_page: page,
            total_pages: total_pages,
            total_count: total_count,
            per_page: per_page
          }
        }
      end

      # Success response helper
      def render_success(data = nil, message: nil, status: :ok)
        response = {}
        response[:message] = message if message
        response[:data] = data if data

        render json: response, status: status
      end

      # Error response helper
      def render_error(message, status: :unprocessable_entity, errors: nil)
        response = { error: message }
        response[:errors] = errors if errors

        render json: response, status: status
      end

      # ============================================
      # ERROR HANDLERS
      # ============================================

      def not_found(exception)
        render json: {
          error: 'Not Found',
          message: exception.message
        }, status: :not_found
      end

      def unprocessable_entity(exception)
        render json: {
          error: 'Validation Failed',
          message: exception.message,
          errors: exception.record&.errors&.full_messages
        }, status: :unprocessable_entity
      end

      def bad_request(exception)
        render json: {
          error: 'Bad Request',
          message: exception.message
        }, status: :bad_request
      end

      def render_unauthorized(message = 'You must be logged in to access this resource')
        render json: {
          error: 'Unauthorized',
          message: message
        }, status: :unauthorized
      end

      def forbidden(message = 'Access denied')
        render json: {
          error: 'Forbidden',
          message: message
        }, status: :forbidden
      end
    end
  end
end
