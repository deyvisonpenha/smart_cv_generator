# frozen_string_literal: true

# Calls the Python AI engine to generate text embeddings for semantic search.
# Returns nil (and logs a warning) if the AI engine is unavailable or has no API key.
class EmbeddingService
  PYTHON_URL = ENV.fetch('PYTHON_SERVICE_URL', 'http://ai_engine:8000')
  MAX_TEXT_LENGTH = 8_000

  def self.embed(text)
    return nil if text.blank?

    api_key = ENV['OPENAI_API_KEY']
    return nil if api_key.blank?

    truncated = text.to_s.truncate(MAX_TEXT_LENGTH, omission: '')
    response = Faraday.post("#{PYTHON_URL}/embed") do |req|
      req.headers['Content-Type'] = 'application/json'
      req.headers['X-Model-Api-Key'] = api_key
      req.headers['X-Model-Provider'] = 'openai'
      req.body = { text: truncated }.to_json
      req.options.timeout = 30
      req.options.open_timeout = 5
    end

    return nil unless response.success?

    body = JSON.parse(response.body)
    embedding = body['embedding']

    # Python returns null when no API key is configured
    return nil if embedding.nil?

    embedding.map(&:to_f)
  rescue => e
    Rails.logger.warn("[EmbeddingService] Could not generate embedding: #{e.message}")
    nil
  end
end
