# frozen_string_literal: true

module Api
  module V1
    class CvsController < BaseController
      before_action :set_cv, only: [:show, :update, :destroy, :duplicate, :public_view]

      # GET /api/v1/cvs
      def index
        cvs = current_user.cvs.recent

        # Apply filters if provided
        cvs = cvs.by_language(params[:language]) if params[:language].present?
        cvs = cvs.optimized if params[:optimized] == 'true'
        cvs = cvs.unoptimized if params[:unoptimized] == 'true'

        render_paginated(cvs.map(&:to_export_json))
      end

      # GET /api/v1/cvs/:id
      def show
        render json: {
          cv: @cv.to_export_json
        }
      end

      # POST /api/v1/cvs
      def create
        cv = current_user.cvs.build(cv_params)

        if cv.save
          render json: {
            message: 'CV created successfully',
            cv: cv.to_export_json
          }, status: :created
        else
          render_error('Failed to create CV', errors: cv.errors.full_messages)
        end
      end

      # PATCH/PUT /api/v1/cvs/:id
      def update
        if @cv.update(cv_params)
          render json: {
            message: 'CV updated successfully',
            cv: @cv.to_export_json
          }
        else
          render_error('Failed to update CV', errors: @cv.errors.full_messages)
        end
      end

      # DELETE /api/v1/cvs/:id
      def destroy
        @cv.destroy
        render json: {
          message: 'CV deleted successfully'
        }
      end

      # POST /api/v1/cvs/:id/duplicate
      def duplicate
        new_cv = @cv.duplicate

        if new_cv.persisted?
          render json: {
            message: 'CV duplicated successfully',
            cv: new_cv.to_export_json
          }, status: :created
        else
          render_error('Failed to duplicate CV', errors: new_cv.errors.full_messages)
        end
      end

      # GET /api/v1/cvs/:id/public_view
      def public_view
        render json: {
          cv: @cv.to_export_json,
          public_url: @cv.public_url
        }
      end

      private

      def set_cv
        @cv = current_user.cvs.find(params[:id])
      end

      def cv_params
        params.require(:cv).permit(:original_text, :language, optimized_data: {})
      end
    end
  end
end
