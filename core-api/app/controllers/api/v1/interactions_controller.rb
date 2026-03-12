# frozen_string_literal: true

module Api
  module V1
    class InteractionsController < BaseController
      before_action :set_interaction, only: [:show, :update, :destroy]

      # GET /api/v1/interactions
      def index
        interactions = current_user.interactions.recent

        # Apply filters
        interactions = interactions.by_category(params[:category]) if params[:category].present?
        interactions = interactions.frequently_used if params[:frequently_used] == 'true'
        interactions = interactions.search_question(params[:q]) if params[:q].present?

        render_paginated(interactions.map(&:to_export_json))
      end

      # GET /api/v1/interactions/:id
      def show
        render json: {
          interaction: @interaction.to_export_json
        }
      end

      # POST /api/v1/interactions
      def create
        # Try to find or create interaction (Feature Store pattern)
        interaction = Interaction.find_or_create_for(
          user: current_user,
          question: interaction_params[:question],
          answer: interaction_params[:answer],
          category: interaction_params[:category]
        )

        if interaction.persisted?
          render json: {
            message: interaction.reused? ? 'Answer updated' : 'Interaction saved',
            interaction: interaction.to_export_json,
            reused: interaction.reused?
          }, status: interaction.reused? ? :ok : :created
        else
          render_error('Failed to save interaction', errors: interaction.errors.full_messages)
        end
      end

      # PATCH/PUT /api/v1/interactions/:id
      def update
        if @interaction.update(interaction_params)
          render json: {
            message: 'Interaction updated successfully',
            interaction: @interaction.to_export_json
          }
        else
          render_error('Failed to update interaction', errors: @interaction.errors.full_messages)
        end
      end

      # DELETE /api/v1/interactions/:id
      def destroy
        @interaction.destroy
        render json: {
          message: 'Interaction deleted successfully'
        }
      end

      # GET /api/v1/interactions/by_category
      def by_category
        category = params[:category]

        unless Interaction::CATEGORIES.include?(category)
          return render_error('Invalid category', status: :bad_request)
        end

        interactions = current_user.interactions.by_category(category).recent

        render json: {
          category: category,
          category_display: Interaction.category_display_name(category),
          interactions: interactions.map(&:to_export_json),
          count: interactions.size
        }
      end

      # GET /api/v1/interactions/categories
      def categories
        categories = Interaction::CATEGORIES.map do |category|
          {
            name: category,
            display_name: Interaction.category_display_name(category),
            count: current_user.interactions.by_category(category).count
          }
        end

        render json: {
          categories: categories,
          total: current_user.interactions.count
        }
      end

      # GET /api/v1/interactions/search
      def search
        query = params[:q]

        if query.blank?
          return render_error('Search query is required', status: :bad_request)
        end

        # Find similar interactions
        interactions = current_user.interactions.search_question(query)

        # Also check for cached answer
        cached_answer = Interaction.get_cached_answer(
          user: current_user,
          question: query
        )

        render json: {
          query: query,
          interactions: interactions.map(&:to_export_json),
          cached_answer: cached_answer,
          found_cache: cached_answer.present?
        }
      end

      # GET /api/v1/interactions/stats
      def stats
        stats = Interaction.statistics_for_user(current_user)

        render json: {
          stats: {
            total_count: stats[:total_count],
            by_category: stats[:by_category],
            most_used: stats[:most_used].map(&:to_export_json),
            recent_count: stats[:recent_count],
            total_reuses: stats[:total_reuses],
            reuse_rate: stats[:total_count] > 0 ? (stats[:total_reuses].to_f / stats[:total_count] * 100).round(2) : 0
          }
        }
      end

      # GET /api/v1/interactions/popular/:category
      def popular
        category = params[:category]

        unless Interaction::CATEGORIES.include?(category)
          return render_error('Invalid category', status: :bad_request)
        end

        popular_interactions = Interaction.popular_by_category(category, limit: 10)

        render json: {
          category: category,
          category_display: Interaction.category_display_name(category),
          interactions: popular_interactions.map(&:to_export_json)
        }
      end

      private

      def set_interaction
        @interaction = current_user.interactions.find(params[:id])
      end

      def interaction_params
        params.require(:interaction).permit(:question, :answer, :category)
      end
    end
  end
end
