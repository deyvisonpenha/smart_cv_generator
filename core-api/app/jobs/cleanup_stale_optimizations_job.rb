# frozen_string_literal: true

class CleanupStaleOptimizationsJob < ApplicationJob
  queue_as :low

  def perform
    Rails.logger.info("[CleanupStaleOptimizationsJob] Starting cleanup of stale optimizations")

    count = Optimization.cleanup_stale!

    if count > 0
      Rails.logger.warn("[CleanupStaleOptimizationsJob] Cleaned up #{count} stale optimizations")
    else
      Rails.logger.info("[CleanupStaleOptimizationsJob] No stale optimizations found")
    end

    count
  end
end
