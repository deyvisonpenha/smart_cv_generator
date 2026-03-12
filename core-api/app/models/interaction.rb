# frozen_string_literal: true

class Interaction < ApplicationRecord
  # ============================================
  # ASSOCIATIONS
  # ============================================
  belongs_to :user

  # ============================================
  # ENUMS & CONSTANTS
  # ============================================
  CATEGORIES = %w[
    gap_explanation
    career_change
    skill_highlight
    achievement_description
    weakness_improvement
    salary_expectation
    relocation_preference
    availability
    work_style
    motivation
    other
  ].freeze

  # ============================================
  # VALIDATIONS
  # ============================================
  validates :user, presence: true
  validates :question, presence: true, length: { minimum: 5, maximum: 1000 }
  validates :answer, presence: true, length: { minimum: 3, maximum: 5000 }
  validates :category, inclusion: { in: CATEGORIES }, allow_blank: true

  # ============================================
  # CALLBACKS
  # ============================================
  before_validation :normalize_question
  before_validation :set_default_category, on: :create

  # ============================================
  # SCOPES
  # ============================================
  scope :recent, -> { order(created_at: :desc) }
  scope :by_category, ->(cat) { where(category: cat) }
  scope :uncategorized, -> { where(category: [nil, 'other']) }
  scope :frequently_used, -> { where('used_count > ?', 2).order(used_count: :desc) }
  scope :this_month, -> { where('created_at >= ?', 1.month.ago) }
  scope :search_question, ->(query) { where('question ILIKE ?', "%#{query}%") }

  # ============================================
  # CLASS METHODS (FEATURE STORE)
  # ============================================

  # Find or create an interaction for a question
  def self.find_or_create_for(user:, question:, answer:, category: nil)
    # Try to find existing interaction with similar question
    existing = find_similar_for_user(user, question)

    if existing
      # Update the existing answer if it's different
      existing.update(answer: answer) if existing.answer != answer
      existing.increment_usage!
      existing
    else
      # Create new interaction
      create(
        user: user,
        question: question,
        answer: answer,
        category: category || categorize_question(question),
        used_count: 1
      )
    end
  end

  # Find similar question for user (fuzzy matching)
  def self.find_similar_for_user(user, question)
    normalized = normalize_text(question)

    user.interactions
        .where("LOWER(REGEXP_REPLACE(question, '[^a-zA-Z0-9\\s]', '', 'g')) LIKE ?",
               "%#{normalized}%")
        .first
  end

  # Get cached answer for a question if exists
  def self.get_cached_answer(user:, question:)
    interaction = find_similar_for_user(user, question)
    return nil unless interaction

    interaction.increment_usage!
    interaction.answer
  end

  # Automatically categorize a question using keyword matching
  def self.categorize_question(question)
    question_lower = question.downcase

    return 'gap_explanation' if question_lower.match?(/gap|break|unemploy|time off|hiatus/)
    return 'career_change' if question_lower.match?(/career change|switch|transition|pivot/)
    return 'skill_highlight' if question_lower.match?(/skill|expertise|proficiency|strength/)
    return 'achievement_description' if question_lower.match?(/achievement|accomplish|success|award/)
    return 'weakness_improvement' if question_lower.match?(/weakness|improve|develop|learn/)
    return 'salary_expectation' if question_lower.match?(/salary|compensation|pay|wage/)
    return 'relocation_preference' if question_lower.match?(/relocate|move|location|remote/)
    return 'availability' if question_lower.match?(/available|start date|notice period/)
    return 'work_style' if question_lower.match?(/work style|preference|environment|culture/)
    return 'motivation' if question_lower.match?(/motivat|interest|passion|why/)

    'other'
  end

  # Get popular questions by category
  def self.popular_by_category(category, limit: 10)
    by_category(category)
      .frequently_used
      .limit(limit)
  end

  # Get category display name
  def self.category_display_name(category)
    {
      'gap_explanation' => 'Employment Gap Explanation',
      'career_change' => 'Career Change Justification',
      'skill_highlight' => 'Skill Highlighting',
      'achievement_description' => 'Achievement Description',
      'weakness_improvement' => 'Weakness & Improvement',
      'salary_expectation' => 'Salary Expectations',
      'relocation_preference' => 'Relocation Preferences',
      'availability' => 'Availability & Start Date',
      'work_style' => 'Work Style Preferences',
      'motivation' => 'Motivation & Interest',
      'other' => 'Other'
    }[category] || category.to_s.titleize
  end

  # Statistics for user
  def self.statistics_for_user(user)
    interactions = user.interactions

    {
      total_count: interactions.count,
      by_category: CATEGORIES.map { |cat|
        [cat, interactions.by_category(cat).count]
      }.to_h,
      most_used: interactions.frequently_used.limit(5),
      recent_count: interactions.this_month.count,
      total_reuses: interactions.sum(:used_count) - interactions.count
    }
  end

  # ============================================
  # INSTANCE METHODS
  # ============================================

  # Increment usage counter (when answer is reused)
  def increment_usage!
    increment!(:used_count)
    touch(:last_used_at)
  end

  # Check if this interaction has been reused
  def reused?
    (used_count || 0) > 1
  end

  # Get reuse count
  def reuse_count
    [(used_count || 1) - 1, 0].max
  end

  # Get category display name
  def category_display_name
    self.class.category_display_name(category)
  end

  # Check if question is similar to another
  def similar_to?(other_question)
    return false unless other_question

    # Normalize both questions and check similarity
    this_normalized = self.class.normalize_text(question)
    other_normalized = self.class.normalize_text(other_question)

    # Simple similarity: check if one contains most words of the other
    this_words = this_normalized.split
    other_words = other_normalized.split

    common_words = (this_words & other_words).size
    similarity_ratio = common_words.to_f / [this_words.size, other_words.size].max

    similarity_ratio > 0.7 # 70% similarity threshold
  end

  # Get preview of answer
  def answer_preview(length: 100)
    answer.truncate(length, separator: ' ')
  end

  # Check if interaction is recent
  def recent?
    created_at > 1.month.ago
  end

  # Check if frequently used
  def frequently_used?
    (used_count || 0) > 2
  end

  # Export as JSON
  def to_export_json
    {
      id: id,
      question: question,
      answer: answer,
      category: category,
      category_display: category_display_name,
      used_count: used_count || 0,
      reuse_count: reuse_count,
      reused: reused?,
      frequently_used: frequently_used?,
      created_at: created_at,
      updated_at: updated_at,
      last_used_at: last_used_at
    }
  end

  # ============================================
  # PRIVATE METHODS
  # ============================================

  private

  # Normalize question text for comparison
  def normalize_question
    return unless question

    self.question = question.strip.gsub(/\s+/, ' ')
  end

  # Set default category if not provided
  def set_default_category
    return if category.present?

    self.category = self.class.categorize_question(question)
  end

  # Normalize text for comparison (class method)
  def self.normalize_text(text)
    return '' unless text

    text.downcase
        .gsub(/[^a-z0-9\s]/, '')
        .gsub(/\s+/, ' ')
        .strip
  end
end
