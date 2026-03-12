# frozen_string_literal: true

class OptimizeResumeJob < ApplicationJob
  queue_as :default

  # Retry up to 3 times with exponential backoff
  retry_on AiEngineClient::TimeoutError, wait: :exponentially_longer, attempts: 3
  retry_on AiEngineClient::ConnectionError, wait: 10.seconds, attempts: 5

  # Don't retry on these errors
  discard_on ActiveRecord::RecordNotFound
  discard_on AiEngineClient::InvalidResponseError

  def perform(optimization_id)
    optimization = Optimization.find(optimization_id)

    # Guard: Only process if still pending
    return unless optimization.pending?

    Rails.logger.info("[OptimizeResumeJob] Starting optimization #{optimization_id}")

    # Mark as processing
    optimization.start_processing!
    broadcast_status(optimization, 'processing', progress: 10)

    # Call AI Engine
    result = optimize_with_ai_engine(optimization)

    # Mark as completed
    optimization.complete!(
      match_score: result[:match_score],
      report: result[:report]
    )

    # Update CV with optimized data
    optimization.cv.update_optimized_data(result[:optimized_data])

    broadcast_status(optimization, 'completed', progress: 100)

    Rails.logger.info("[OptimizeResumeJob] Optimization #{optimization_id} completed successfully")
    Rails.logger.info("[OptimizeResumeJob] Match score: #{result[:match_score]}%")

  rescue AiEngineClient::Error => e
    handle_ai_engine_error(optimization, e)
  rescue StandardError => e
    handle_unexpected_error(optimization, e)
  end

  private

  def optimize_with_ai_engine(optimization)
    client = AiEngineClient.new

    broadcast_status(optimization, 'processing', progress: 30)
    Rails.logger.info("[OptimizeResumeJob] Calling AI Engine for optimization #{optimization.id}")

    result = client.optimize_cv(
      cv: optimization.cv,
      job_description: optimization.job_description,
      options: {
        use_interactions: true,
        user_id: optimization.user_id,
        api_key: ENV['OPENAI_API_KEY'],
        provider: 'openai'
      }
    )

    broadcast_status(optimization, 'processing', progress: 90)

    result
  end

  def handle_ai_engine_error(optimization, error)
    optimization.fail!(error.message)
    broadcast_status(optimization, 'failed', error: error.message)

    Rails.logger.error("[OptimizeResumeJob] Optimization #{optimization.id} failed: #{error.message}")
    Rails.logger.error(error.backtrace.join("\n"))

    # Notify user (implement in Phase 3)
    # UserMailer.optimization_failed(optimization).deliver_later
  end

  def handle_unexpected_error(optimization, error)
    optimization.fail!("Unexpected error: #{error.message}")
    broadcast_status(optimization, 'failed', error: error.message)

    Rails.logger.error("[OptimizeResumeJob] Unexpected error in optimization #{optimization.id}")
    Rails.logger.error("Error class: #{error.class}")
    Rails.logger.error("Error message: #{error.message}")
    Rails.logger.error(error.backtrace.join("\n"))

    # Report to error tracking service (Sentry, Rollbar, etc.)
    # Sentry.capture_exception(error) if defined?(Sentry)
  end

  def broadcast_status(optimization, status, **data)
    # Broadcast via ActionCable (will be implemented in Step 3)
    ActionCable.server.broadcast(
      "optimization_#{optimization.id}",
      {
        id: optimization.id,
        status: status,
        match_score: optimization.match_score,
        completion_percentage: optimization.completion_percentage,
        updated_at: optimization.updated_at,
        **data
      }
    )
  rescue StandardError => e
    Rails.logger.error("[OptimizeResumeJob] Failed to broadcast status: #{e.message}")
    # Don't fail the job if broadcasting fails
  end
end
