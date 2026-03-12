# frozen_string_literal: true

class JobDescription < ApplicationRecord
  # ============================================
  # ASSOCIATIONS
  # ============================================
  belongs_to :user
  has_many :optimizations, dependent: :destroy

  # ============================================
  # VALIDATIONS
  # ============================================
  validates :user, presence: true
  validates :title, presence: true, length: { minimum: 3, maximum: 200 }
  validates :content, presence: true, length: { minimum: 50, maximum: 20_000 }
  validates :company_name, length: { maximum: 200 }, allow_blank: true

  # ============================================
  # SCOPES
  # ============================================
  scope :recent, -> { order(created_at: :desc) }
  scope :by_company, ->(company) { where('company_name ILIKE ?', "%#{company}%") }
  scope :by_title, ->(title) { where('title ILIKE ?', "%#{title}%") }
  scope :with_company, -> { where.not(company_name: [nil, '']) }
  scope :optimized, -> { joins(:optimizations).where(optimizations: { status: 'completed' }).distinct }

  # ============================================
  # INSTANCE METHODS
  # ============================================

  # Get the full job title with company name
  def full_title
    if company_name.present?
      "#{title} at #{company_name}"
    else
      title
    end
  end

  # Get all optimizations for this job description
  def completed_optimizations
    optimizations.where(status: 'completed').order(created_at: :desc)
  end

  # Get pending optimizations
  def pending_optimizations
    optimizations.where(status: %w[pending processing]).order(created_at: :desc)
  end

  # Check if there are optimizations in progress
  def optimization_in_progress?
    pending_optimizations.exists?
  end

  # Count of CVs optimized for this job
  def optimized_cvs_count
    completed_optimizations.count
  end

  # Get the average match score for this job description
  def average_match_score
    scores = completed_optimizations.where.not(match_score: nil).pluck(:match_score)
    return nil if scores.empty?

    (scores.sum.to_f / scores.size).round(2)
  end

  # Get the best match score
  def best_match_score
    completed_optimizations.maximum(:match_score)
  end

  # Extract keywords from job description content
  def extract_keywords
    # Simple keyword extraction (can be improved with NLP)
    stop_words = %w[the a an and or but in on at to for of with by from as is was are were be been being have has had do does did will would should could may might must can]

    words = content.downcase
                   .gsub(/[^a-z0-9\s]/, ' ')
                   .split
                   .reject { |w| w.length < 3 || stop_words.include?(w) }

    # Count word frequency
    frequency = words.each_with_object(Hash.new(0)) { |word, counts| counts[word] += 1 }

    # Return top 20 keywords
    frequency.sort_by { |_word, count| -count }.first(20).to_h
  end

  # Get required skills from content (simple pattern matching)
  def extract_required_skills
    skills_section = content[/(?:required skills?|qualifications?|requirements?):?(.*?)(?:\n\n|$)/mi, 1]
    return [] unless skills_section

    # Extract bullet points or comma-separated items
    skills_section.scan(/[•\-\*]\s*([^\n]+)|([^,\n]{3,}(?:,|$))/)
                  .flatten
                  .compact
                  .map(&:strip)
                  .reject(&:empty?)
                  .first(15)
  end

  # Get experience level from content
  def extract_experience_level
    content_lower = content.downcase

    return 'entry' if content_lower.match?(/entry[\s-]?level|junior|graduate|0-2 years?/)
    return 'mid' if content_lower.match?(/mid[\s-]?level|intermediate|2-5 years?|3-5 years?/)
    return 'senior' if content_lower.match?(/senior|lead|principal|staff|5\+ years?|7\+ years?/)
    return 'executive' if content_lower.match?(/executive|director|vp|chief|c-level/)

    'not_specified'
  end

  # Check if remote work is mentioned
  def remote_work?
    content.downcase.match?(/remote|work from home|wfh|distributed/)
  end

  # Estimated read time in minutes
  def estimated_read_time
    words = content.split.size
    (words / 200.0).ceil # Average reading speed: 200 words per minute
  end

  # Content preview (first 200 characters)
  def preview
    content.truncate(200, separator: ' ')
  end

  # Duplicate this job description
  def duplicate
    dup.tap do |new_job|
      new_job.title = "#{title} (Copy)"
      new_job.save
    end
  end

  # Export as JSON for API responses
  def to_export_json
    {
      id: id,
      title: title,
      company_name: company_name,
      full_title: full_title,
      content: content,
      preview: preview,
      created_at: created_at,
      updated_at: updated_at,
      stats: {
        optimized_cvs_count: optimized_cvs_count,
        average_match_score: average_match_score,
        best_match_score: best_match_score,
        optimization_in_progress: optimization_in_progress?
      },
      metadata: {
        experience_level: extract_experience_level,
        remote_work: remote_work?,
        estimated_read_time: estimated_read_time,
        keywords_count: extract_keywords.size
      }
    }
  end

  # Search in title and content
  def self.search(query)
    return none if query.blank?

    where('title ILIKE ? OR content ILIKE ? OR company_name ILIKE ?',
          "%#{query}%", "%#{query}%", "%#{query}%")
  end
end
