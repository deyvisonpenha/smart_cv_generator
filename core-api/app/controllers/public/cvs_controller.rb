# frozen_string_literal: true

module Public
  class CvsController < ActionController::API
    # Skip authentication for public endpoints
    skip_before_action :authenticate_request!, raise: false

    # GET /public/cv/:slug
    def show
      @cv = Cv.find_by!(slug: params[:slug])

      render json: {
        cv: {
          id: @cv.id,
          slug: @cv.slug,
          display_name: @cv.display_name,
          language: @cv.language,
          optimized_data: @cv.optimized_data,
          completeness: @cv.completeness_percentage,
          skills: @cv.skills,
          experiences: @cv.experiences,
          education: @cv.education,
          email: @cv.email_from_cv,
          phone: @cv.phone_from_cv,
          created_at: @cv.created_at,
          updated_at: @cv.updated_at
        },
        meta: {
          view_only: true,
          public_url: @cv.public_url
        }
      }
    rescue ActiveRecord::RecordNotFound
      render json: {
        error: 'CV not found',
        message: 'The requested CV does not exist or has been removed'
      }, status: :not_found
    end
  end
end
