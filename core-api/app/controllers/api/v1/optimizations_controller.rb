# frozen_string_literal: true

module Api
  module V1
    class OptimizationsController < BaseController
      before_action :set_optimization, only: [:show, :status, :regenerate, :cancel]
      before_action :check_optimization_limit!, only: [:create]

      # GET /api/v1/optimizations
      def index
        optimizations = current_user.optimizations.recent

        # Apply filters
        optimizations = optimizations.where(status: params[:status]) if params[:status].present?
        optimizations = optimizations.where(cv_id: params[:cv_id]) if params[:cv_id].present?
        optimizations = optimizations.where(job_description_id: params[:job_description_id]) if params[:job_description_id].present?

        # Filter by date range
        if params[:from].present?
          optimizations = optimizations.where('created_at >= ?', params[:from])
        end
        if params[:to].present?
          optimizations = optimizations.where('created_at <= ?', params[:to])
        end

        render_paginated(optimizations.map(&:to_export_json))
      end

      # GET /api/v1/optimizations/:id
      def show
        render json: {
          optimization: @optimization.to_export_json
        }
      end

      # POST /api/v1/optimizations
      def create
        cv = current_user.cvs.find(optimization_params[:cv_id])
        job = current_user.job_descriptions.find(optimization_params[:job_description_id])

        optimization = current_user.optimizations.create!(
          cv: cv,
          job_description: job
        )

        render json: {
          message: 'Optimization started',
          optimization: optimization.to_export_json
        }, status: :created
      rescue ActiveRecord::RecordInvalid => e
        render_error('Failed to create optimization', errors: e.record.errors.full_messages)
      end

      # GET /api/v1/optimizations/:id/status
      def status
        render json: {
          id: @optimization.id,
          status: @optimization.status,
          status_display: @optimization.status_display,
          completion_percentage: @optimization.completion_percentage,
          match_score: @optimization.match_score,
          processing_duration: @optimization.processing_duration_humanized,
          can_retry: @optimization.can_retry?,
          updated_at: @optimization.updated_at
        }
      end

      # POST /api/v1/optimizations/:id/regenerate
      def regenerate
        unless @optimization.can_retry?
          return render_error(
            'Cannot retry this optimization',
            status: :unprocessable_entity
          )
        end

        if @optimization.retry!
          render json: {
            message: 'Optimization restarted',
            optimization: @optimization.to_export_json
          }
        else
          render_error('Failed to restart optimization')
        end
      end

      # POST /api/v1/optimizations/:id/cancel
      def cancel
        unless @optimization.can_cancel?
          return render_error(
            'Cannot cancel this optimization',
            status: :unprocessable_entity
          )
        end

        if @optimization.cancel!
          render json: {
            message: 'Optimization cancelled',
            optimization: @optimization.to_export_json
          }
        else
          render_error('Failed to cancel optimization')
        end
      end

      # GET /api/v1/optimizations/stats
      def stats
        stats = {
          total: current_user.optimizations.count,
          by_status: {
            pending: current_user.optimizations.pending.count,
            processing: current_user.optimizations.processing.count,
            completed: current_user.optimizations.completed.count,
            failed: current_user.optimizations.failed.count,
            cancelled: current_user.optimizations.cancelled.count
          },
          average_match_score: current_user.optimizations.completed.average(:match_score)&.round(2),
          high_match_count: current_user.optimizations.high_match.count,
          medium_match_count: current_user.optimizations.medium_match.count,
          low_match_count: current_user.optimizations.low_match.count,
          this_month: current_user.optimizations.where('created_at >= ?', 1.month.ago).count,
          remaining_this_month: current_user.remaining_optimizations
        }

        render json: { stats: stats }
      end

      private

      def set_optimization
        @optimization = current_user.optimizations.find(params[:id])
      end

      def optimization_params
        params.require(:optimization).permit(:cv_id, :job_description_id)
      end
    end
  end
end
