# frozen_string_literal: true

module Api
  module V1
    # Phase 4: Semantic Search & RAG
    # Provides vector-similarity search over CVs, job descriptions, and interactions.
    # Also powers the RAG "suggest answer" feature on the interview screen.
    class SemanticSearchController < BaseController
      DEFAULT_LIMIT = 5
      MAX_LIMIT = 20

      # POST /api/v1/semantic/similar_cvs
      # Body: { text: "...", limit: 5 }
      # Returns the user's CVs most similar to the given text.
      def similar_cvs
        embedding = generate_embedding(params[:text])
        return unless embedding

        results = current_user.cvs
                              .nearest_neighbors(:embedding, embedding, distance: 'cosine')
                              .limit(result_limit)

        render json: { results: results.map(&:to_export_json) }
      end

      # POST /api/v1/semantic/similar_jobs
      # Body: { text: "...", limit: 5 }
      # Returns the user's job descriptions most similar to the given text.
      def similar_jobs
        embedding = generate_embedding(params[:text])
        return unless embedding

        results = current_user.job_descriptions
                              .nearest_neighbors(:embedding, embedding, distance: 'cosine')
                              .limit(result_limit)

        render json: { results: results.map(&:to_export_json) }
      end

      # POST /api/v1/semantic/suggest_answer
      # Body: { question: "...", limit: 5 }
      # Returns past interactions whose question+answer are semantically similar to the input.
      # Used as RAG on the InterviewScreen to pre-fill answers from the user's history.
      def suggest_answer
        text = params[:question].presence || params[:text]
        return render_error('question is required', status: :bad_request) if text.blank?

        embedding = generate_embedding(text)
        return unless embedding

        results = current_user.interactions
                              .nearest_neighbors(:embedding, embedding, distance: 'cosine')
                              .limit(result_limit)

        render json: {
          results: results.map do |interaction|
            {
              id: interaction.id,
              question: interaction.question,
              answer: interaction.answer,
              category: interaction.category,
              category_display: interaction.category_display_name,
              used_count: interaction.used_count || 0,
              similarity_hint: 'semantic'
            }
          end
        }
      end

      # POST /api/v1/semantic/reindex
      # Triggers background re-embedding for all of the current user's records.
      # Useful after changing embedding models or after bulk imports.
      # Rate-limited to once per hour per user to prevent job-queue flooding.
      def reindex
        cache_key = "reindex_cooldown:#{current_user.id}"
        if Rails.cache.exist?(cache_key)
          return render json: {
            error: 'Too many requests',
            message: 'Reindex is allowed once per hour. Please try again later.'
          }, status: :too_many_requests
        end

        Rails.cache.write(cache_key, true, expires_in: 1.hour)

        enqueued = 0

        current_user.cvs.find_each do |cv|
          GenerateEmbeddingJob.perform_later('Cv', cv.id)
          enqueued += 1
        end

        current_user.job_descriptions.find_each do |jd|
          GenerateEmbeddingJob.perform_later('JobDescription', jd.id)
          enqueued += 1
        end

        current_user.interactions.find_each do |interaction|
          GenerateEmbeddingJob.perform_later('Interaction', interaction.id)
          enqueued += 1
        end

        render json: {
          message: 'Re-indexing started',
          jobs_enqueued: enqueued
        }
      end

      private

      def generate_embedding(text)
        if text.blank?
          render_error('text is required', status: :bad_request)
          return nil
        end

        embedding = EmbeddingService.embed(text)

        if embedding.nil?
          render json: {
            results: [],
            message: 'Semantic search is unavailable: OPENAI_API_KEY not configured'
          }
          return nil
        end

        embedding
      end

      def result_limit
        requested = params[:limit].to_i
        return DEFAULT_LIMIT if requested <= 0
        [requested, MAX_LIMIT].min
      end
    end
  end
end
