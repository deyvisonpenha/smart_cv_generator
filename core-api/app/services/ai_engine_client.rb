# frozen_string_literal: true

class AiEngineClient
  class Error < StandardError; end
  class ConnectionError < Error; end
  class TimeoutError < Error; end
  class InvalidResponseError < Error; end

  attr_reader :base_url, :timeout

  def initialize(base_url: nil, timeout: 120)
    @base_url = base_url || ENV.fetch('PYTHON_SERVICE_URL', 'http://ai_engine:8000')
    @timeout = timeout
  end

  # Optimize a CV for a specific job description (using quick-analyze endpoint)
  def optimize_cv(cv:, job_description:, options: {})
    api_key = options[:api_key] || ENV['OPENAI_API_KEY']
    provider = options[:provider] || 'openai'

    response = post('/quick-analyze',
      {
        cv_text: cv.original_text,
        job_description: job_description.content,
        language: cv.language || 'en'
      },
      headers: {
        'X-Model-Api-Key' => api_key,
        'X-Model-Provider' => provider
      }
    )

    parse_quick_analysis_response(response)
  rescue Faraday::TimeoutError => e
    raise TimeoutError, "AI Engine timeout: #{e.message}"
  rescue Faraday::ConnectionFailed => e
    raise ConnectionError, "Cannot connect to AI Engine: #{e.message}"
  rescue StandardError => e
    raise Error, "AI Engine error: #{e.message}"
  end

  # Analyze gaps between CV and job description
  def analyze_gaps(cv:, job_description:, options: {})
    api_key = options[:api_key] || ENV['OPENAI_API_KEY']
    provider = options[:provider] || 'openai'

    response = post('/analyze-gaps',
      {
        cv_text: cv.original_text,
        job_description: job_description.content,
        language: cv.language || 'en'
      },
      headers: {
        'X-Model-Api-Key' => api_key,
        'X-Model-Provider' => provider
      }
    )

    response # Returns array of gap analysis items
  rescue StandardError => e
    Rails.logger.error("Gap analysis failed: #{e.message}")
    []
  end

  # Generate optimized CV with user answers
  def generate_cv(cv:, job_description:, user_answers: [], options: {})
    api_key = options[:api_key] || ENV['OPENAI_API_KEY']
    provider = options[:provider] || 'openai'
    template_id = options[:template_id] || 'classic'

    response = post('/generate-cv',
      {
        cv_text: cv.original_text,
        job_description: job_description.content,
        user_answers: user_answers.map { |a| { question: a[:question], answer: a[:answer] } },
        language: cv.language || 'en',
        template_id: template_id
      },
      headers: {
        'X-Model-Api-Key' => api_key,
        'X-Model-Provider' => provider
      }
    )

    response # Returns CVData structure
  rescue StandardError => e
    Rails.logger.error("CV generation failed: #{e.message}")
    { error: e.message }
  end

  # Extract text from PDF
  def extract_text_from_pdf(file_path)
    response = post_multipart('/extract-text', file_path: file_path)
    response['text']
  rescue StandardError => e
    Rails.logger.error("Text extraction failed: #{e.message}")
    nil
  end

  # Health check
  def health_check
    response = get('/health')
    response['status'] == 'ok'
  rescue StandardError
    false
  end

  # Get API information
  def api_info
    response = get('/api/info')
    response
  rescue StandardError => e
    Rails.logger.error("Failed to get API info: #{e.message}")
    { error: e.message }
  end

  private

  def connection
    @connection ||= Faraday.new(url: base_url) do |conn|
      conn.request :json
      conn.response :json, content_type: /\bjson$/
      conn.adapter Faraday.default_adapter
      conn.options.timeout = timeout
      conn.options.open_timeout = 10

      # Logging middleware (only in development)
      if Rails.env.development?
        conn.response :logger, Rails.logger, bodies: true do |logger|
          logger.filter(/(password|token|api_key)/i, '[FILTERED]')
        end
      end
    end
  end

  def get(path, params: {})
    log_request(:get, path, params)

    response = connection.get(path, params)

    log_response(response)
    handle_response(response)
  end

  def post(path, body, headers: {})
    log_request(:post, path, body)

    response = connection.post(path) do |req|
      req.body = body
      headers.each { |key, value| req.headers[key] = value if value }
    end

    log_response(response)
    handle_response(response)
  end

  def post_multipart(path, file_path:)
    log_request(:post, path, { file: 'binary_data' })

    response = connection.post(path) do |req|
      req.headers['Content-Type'] = 'multipart/form-data'
      req.body = { file: Faraday::UploadIO.new(file_path, 'application/pdf') }
    end

    log_response(response)
    handle_response(response)
  end

  def handle_response(response)
    case response.status
    when 200..299
      response.body
    when 400..499
      error_message = extract_error_message(response.body)
      raise InvalidResponseError, "Client error (#{response.status}): #{error_message}"
    when 500..599
      error_message = extract_error_message(response.body)
      raise Error, "Server error (#{response.status}): #{error_message}"
    else
      raise Error, "Unexpected response: #{response.status}"
    end
  end

  def extract_error_message(body)
    return body.to_s unless body.is_a?(Hash)
    body['detail'] || body['message'] || body['error'] || body.to_s
  end

  def parse_quick_analysis_response(response)
    # FastAPI quick-analyze returns: { match_percentage, gap_reasons, recommendations }
    {
      optimized_data: {
        analysis: response['recommendations'] || [],
        gaps: response['gap_reasons'] || []
      },
      match_score: response['match_percentage'] || 0,
      report: {
        recommendations: response['recommendations'] || [],
        improvements: extract_improvements(response['recommendations']),
        strengths: extract_strengths(response['gap_reasons']),
        weaknesses: response['gap_reasons'] || [],
        keyword_matches: {},
        missing_skills: extract_missing_skills(response['gap_reasons'])
      }
    }
  end

  def extract_improvements(recommendations)
    return [] unless recommendations.is_a?(Array)
    recommendations.select { |r| r.to_s.downcase.include?('improve') || r.to_s.downcase.include?('add') }
  end

  def extract_strengths(gap_reasons)
    return [] unless gap_reasons.is_a?(Array)
    # Inverse of gaps - what's NOT mentioned as a gap
    []
  end

  def extract_missing_skills(gap_reasons)
    return [] unless gap_reasons.is_a?(Array)
    gap_reasons.select { |g| g.to_s.downcase.include?('skill') || g.to_s.downcase.include?('experience') }
  end

  def log_request(method, path, payload)
    Rails.logger.info("[AI Engine] Request: #{method.upcase} #{base_url}#{path}")
    Rails.logger.debug("[AI Engine] Payload: #{sanitize_payload(payload)}")
  end

  def log_response(response)
    Rails.logger.info("[AI Engine] Response: #{response.status}")
    if response.status >= 400
      Rails.logger.error("[AI Engine] Error Body: #{response.body}")
    else
      Rails.logger.debug("[AI Engine] Body: #{response.body.inspect}")
    end
  end

  def sanitize_payload(payload)
    return payload.inspect unless payload.is_a?(Hash)

    # Truncate long text fields for logging
    sanitized = payload.dup
    sanitized['cv_text'] = truncate_text(sanitized['cv_text']) if sanitized['cv_text']
    sanitized['job_description'] = truncate_text(sanitized['job_description']) if sanitized['job_description']
    sanitized.inspect
  end

  def truncate_text(text, max_length: 100)
    return text unless text.is_a?(String)
    text.length > max_length ? "#{text[0...max_length]}... (#{text.length} chars)" : text
  end
end
