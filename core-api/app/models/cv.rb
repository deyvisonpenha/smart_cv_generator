# frozen_string_literal: true

class Cv < ApplicationRecord
  # ============================================
  # ASSOCIATIONS
  # ============================================
  belongs_to :user
  has_many :optimizations, dependent: :destroy

  # ============================================
  # CALLBACKS
  # ============================================
  before_validation :generate_slug, on: :create
  before_validation :ensure_optimized_data_is_hash

  # ============================================
  # VALIDATIONS
  # ============================================
  validates :user, presence: true
  validates :original_text, presence: true, length: { minimum: 50, maximum: 50_000 }
  validates :slug, presence: true, uniqueness: true
  validates :language, presence: true, inclusion: { in: %w[en es pt fr de it] }

  # ============================================
  # SCOPES
  # ============================================
  scope :recent, -> { order(created_at: :desc) }
  scope :by_language, ->(lang) { where(language: lang) }
  scope :optimized, -> { where.not(optimized_data: {}) }
  scope :unoptimized, -> { where(optimized_data: {}) }

  # ============================================
  # CLASS METHODS
  # ============================================

  # Supported languages
  def self.supported_languages
    {
      'en' => 'English',
      'es' => 'Spanish',
      'pt' => 'Portuguese',
      'fr' => 'French',
      'de' => 'German',
      'it' => 'Italian'
    }
  end

  # ============================================
  # INSTANCE METHODS
  # ============================================

  # Check if CV has been optimized
  def optimized?
    optimized_data.present? && optimized_data.is_a?(Hash) && optimized_data.any?
  end

  # Check if CV is still in draft (no optimizations yet)
  def draft?
    !optimized?
  end

  # Get the latest optimization
  def latest_optimization
    optimizations.order(created_at: :desc).first
  end

  # Get successful optimizations count
  def successful_optimizations_count
    optimizations.where(status: 'completed').count
  end

  # Get pending optimizations count
  def pending_optimizations_count
    optimizations.where(status: %w[pending processing]).count
  end

  # Check if there's an optimization in progress
  def optimization_in_progress?
    pending_optimizations_count.positive?
  end

  # Get public URL for this CV
  def public_url
    return nil unless slug.present?
    "/public/cv/#{slug}"
  end

  # Get display name for the CV (from optimized data or fallback)
  def display_name
    if optimized_data.present? && optimized_data['name'].present?
      optimized_data['name']
    elsif optimized_data.present? && optimized_data['personal_info'].present?
      optimized_data['personal_info']['name']
    else
      "CV #{id}"
    end
  end

  # Extract email from CV data
  def email_from_cv
    return nil unless optimized_data.present?

    optimized_data['email'] ||
      optimized_data.dig('personal_info', 'email') ||
      optimized_data.dig('contact', 'email')
  end

  # Extract phone from CV data
  def phone_from_cv
    return nil unless optimized_data.present?

    optimized_data['phone'] ||
      optimized_data.dig('personal_info', 'phone') ||
      optimized_data.dig('contact', 'phone')
  end

  # Get skills list from optimized data
  def skills
    return [] unless optimized_data.present?

    optimized_data['skills'] ||
      optimized_data.dig('professional_skills', 'technical') ||
      []
  end

  # Get work experience entries
  def experiences
    return [] unless optimized_data.present?

    optimized_data['experiences'] ||
      optimized_data['work_experience'] ||
      optimized_data['experience'] ||
      []
  end

  # Get education entries
  def education
    return [] unless optimized_data.present?

    optimized_data['education'] ||
      optimized_data['academic_background'] ||
      []
  end

  # Calculate completeness percentage
  def completeness_percentage
    score = 0
    total = 6

    score += 1 if original_text.present? && original_text.length > 100
    score += 1 if optimized_data.present? && optimized_data.any?
    score += 1 if skills.any?
    score += 1 if experiences.any?
    score += 1 if education.any?
    score += 1 if email_from_cv.present?

    ((score.to_f / total) * 100).round
  end

  # Duplicate this CV for the same user
  def duplicate
    new_cv = self.dup
    new_cv.slug = nil # Will be regenerated
    new_cv.optimized_data = optimized_data.deep_dup if optimized_data.present?
    new_cv.save
    new_cv
  end

  # Update optimized data with new information
  def update_optimized_data(new_data)
    return false unless new_data.is_a?(Hash)

    self.optimized_data = optimized_data.deep_merge(new_data)
    save
  end

  # Export CV data as JSON
  def to_export_json
    {
      id: id,
      slug: slug,
      language: language,
      created_at: created_at,
      updated_at: updated_at,
      original_text: original_text,
      optimized_data: optimized_data,
      public_url: public_url,
      completeness: completeness_percentage,
      optimized: optimized?,
      optimizations_count: optimizations.count,
      successful_optimizations_count: successful_optimizations_count
    }
  end

  private

  # Generate a unique slug for the CV
  def generate_slug
    return if slug.present?

    loop do
      self.slug = SecureRandom.urlsafe_base64(8)
      break unless Cv.exists?(slug: slug)
    end
  end

  # Ensure optimized_data is always a hash
  def ensure_optimized_data_is_hash
    self.optimized_data = {} if optimized_data.nil?
  end
end
