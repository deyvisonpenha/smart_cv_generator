# frozen_string_literal: true

# Sidekiq Configuration
# Connects to Redis for job queue management

Sidekiq.configure_server do |config|
  config.redis = { url: ENV.fetch('REDIS_URL', 'redis://localhost:6379/1') }

  # Enable job statistics
  config.average_scheduled_poll_interval = 15

  # Error handling - log when jobs die (exhaust all retries)
  config.death_handlers << lambda { |job, ex|
    Rails.logger.error("Sidekiq job #{job['jid']} died after all retries")
    Rails.logger.error("Job class: #{job['class']}")
    Rails.logger.error("Job args: #{job['args']}")
    Rails.logger.error("Error: #{ex.message}")
    Rails.logger.error(ex.backtrace.join("\n"))

    # TODO: Send notification to monitoring service
    # Sentry.capture_exception(ex) if defined?(Sentry)
  }

  # Lifecycle callbacks
  config.on(:startup) do
    Rails.logger.info("Sidekiq server started")
  end

  config.on(:shutdown) do
    Rails.logger.info("Sidekiq server shutting down")
  end
end

Sidekiq.configure_client do |config|
  config.redis = { url: ENV.fetch('REDIS_URL', 'redis://localhost:6379/1') }
end

# Configure default job options
Sidekiq.default_job_options = {
  'backtrace' => true,
  'retry' => 3
}

# Log Sidekiq version
Rails.logger.info("Sidekiq #{Sidekiq::VERSION} configured")
