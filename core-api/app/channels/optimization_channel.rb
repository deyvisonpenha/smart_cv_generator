# frozen_string_literal: true

class OptimizationChannel < ApplicationCable::Channel
  def subscribed
    optimization = Optimization.find_by(id: params[:id])

    # Reject if optimization not found
    return reject unless optimization

    # Authorize: User must own this optimization
    if current_user && optimization.user_id == current_user.id
      stream_from "optimization_#{optimization.id}"

      logger.info "User #{current_user.id} subscribed to optimization #{optimization.id}"

      # Send current status immediately upon subscription
      transmit(
        id: optimization.id,
        status: optimization.status,
        match_score: optimization.match_score,
        completion_percentage: optimization.completion_percentage,
        created_at: optimization.created_at,
        updated_at: optimization.updated_at,
        cv: {
          id: optimization.cv.id,
          display_name: optimization.cv.display_name
        },
        job_description: {
          id: optimization.job_description.id,
          title: optimization.job_description.title
        }
      )
    else
      logger.warn "Unauthorized subscription attempt for optimization #{params[:id]}"
      reject
    end
  end

  def unsubscribed
    logger.info "User #{current_user&.id} unsubscribed from optimization #{params[:id]}"
    stop_all_streams
  end

  # Client can request a status update
  def request_status
    optimization = Optimization.find_by(id: params[:id])

    return unless optimization && optimization.user_id == current_user.id

    transmit(
      id: optimization.id,
      status: optimization.status,
      match_score: optimization.match_score,
      completion_percentage: optimization.completion_percentage,
      updated_at: optimization.updated_at,
      report: optimization.report
    )
  end
end
