# frozen_string_literal: true

class Optimization < ApplicationRecord
  # ============================================
  # ASSOCIATIONS
  # ============================================
  belongs_to :user
  belongs_to :cv
  belongs_to :job_description

  # ============================================
  # ENUMS & CONSTANTS
  # ============================================
  STATUSES = %w[pending processing completed failed cancelled].freeze

  # ============================================
  # VALIDATIONS
  # ============================================
  validates :user, presence: true
  validates :cv, presence: true
  validates :job_description, presence: true
  validates :status, presence: true, inclusion: { in: STATUSES }
  validates :match_score, numericality: {
    greater_than_or_equal_to: 0,
    less_than_or_equal_to: 100,
    allow_nil: true
  }

  # Ensure CV and Job belong to the same user
  validate :cv_belongs_to_user
  validate :job_description_belongs_to_user

  # ============================================
  # CALLBACKS
  # ============================================
  before_validation :set_default_status, on: :create
  before_validation :ensure_report_is_hash
  after_create :enqueue_optimization_job
  after_update :notify_status_change, if: :saved_change_to_status?

  # ============================================
  # SCOPES
  # ============================================
  scope :recent, -> { order(created_at: :desc) }
  scope :pending, -> { where(status: 'pending') }
  scope :processing, -> { where(status: 'processing') }
  scope :completed, -> { where(status: 'completed') }
  scope :failed, -> { where(status: 'failed') }
  scope :cancelled, -> { where(status: 'cancelled') }
  scope :in_progress, -> { where(status: %w[pending processing]) }
  scope :finished, -> { where(status: %w[completed failed cancelled]) }
  scope :with_score, -> { where.not(match_score: nil) }
  scope :high_match, -> { where('match_score >= ?', 80) }
  scope :medium_match, -> { where('match_score >= ? AND match_score < ?', 60, 80) }
  scope :low_match, -> { where('match_score < ?', 60) }

  # ============================================
  # STATE MACHINE METHODS
  # ============================================

  # Transition to processing state
  def start_processing!
    return false unless can_start_processing?

    update(
      status: 'processing',
      processing_started_at: Time.current
    )
  end

  # Mark as completed with results
  def complete!(match_score:, report:)
    return false unless can_complete?

    update(
      status: 'completed',
      match_score: match_score,
      report: report,
      processing_completed_at: Time.current,
      error_message: nil
    )
  end

  # Mark as failed with error
  def fail!(error_message)
    return false unless can_fail?

    update(
      status: 'failed',
      error_message: error_message,
      processing_completed_at: Time.current
    )
  end

  # Cancel the optimization
  def cancel!
    return false unless can_cancel?

    update(
      status: 'cancelled',
      processing_completed_at: Time.current
    )
  end

  # Retry a failed optimization
  def retry!
    return false unless failed?

    update(
      status: 'pending',
      error_message: nil,
      match_score: nil,
      report: {},
      processing_started_at: nil,
      processing_completed_at: nil,
      retry_count: (retry_count || 0) + 1
    )
  end

  # ============================================
  # STATE CHECKS
  # ============================================

  def pending?
    status == 'pending'
  end

  def processing?
    status == 'processing'
  end

  def completed?
    status == 'completed'
  end

  def failed?
    status == 'failed'
  end

  def cancelled?
    status == 'cancelled'
  end

  def in_progress?
    pending? || processing?
  end

  def finished?
    completed? || failed? || cancelled?
  end

  def successful?
    completed?
  end

  # ============================================
  # TRANSITION GUARDS
  # ============================================

  def can_start_processing?
    pending?
  end

  def can_complete?
    processing?
  end

  def can_fail?
    pending? || processing?
  end

  def can_cancel?
    pending? || processing?
  end

  def can_retry?
    failed? && (retry_count || 0) < 3
  end

  # ============================================
  # INSTANCE METHODS
  # ============================================

  # Calculate processing duration
  def processing_duration
    return nil unless processing_started_at && processing_completed_at

    processing_completed_at - processing_started_at
  end

  # Processing duration in human readable format
  def processing_duration_humanized
    return 'N/A' unless processing_duration

    duration = processing_duration
    if duration < 60
      "#{duration.round}s"
    elsif duration < 3600
      "#{(duration / 60).round}m"
    else
      "#{(duration / 3600).round(1)}h"
    end
  end

  # Get match score category
  def match_score_category
    return 'unscored' unless match_score

    case match_score
    when 80..100 then 'excellent'
    when 60...80 then 'good'
    when 40...60 then 'fair'
    when 0...40 then 'poor'
    else 'unknown'
    end
  end

  # Get match score color for UI
  def match_score_color
    case match_score_category
    when 'excellent' then 'green'
    when 'good' then 'blue'
    when 'fair' then 'yellow'
    when 'poor' then 'red'
    else 'gray'
    end
  end

  # Check if optimization is stale (stuck in processing)
  def stale?
    return false unless processing?
    return false unless processing_started_at

    Time.current - processing_started_at > 10.minutes
  end

  # Get recommendations from report
  def recommendations
    return [] unless report.present? && report['recommendations']

    report['recommendations']
  end

  # Get improvements from report
  def improvements
    return [] unless report.present? && report['improvements']

    report['improvements']
  end

  # Get strengths from report
  def strengths
    return [] unless report.present? && report['strengths']

    report['strengths']
  end

  # Get weaknesses from report
  def weaknesses
    return [] unless report.present? && report['weaknesses']

    report['weaknesses']
  end

  # Get keyword matches
  def keyword_matches
    return {} unless report.present? && report['keyword_matches']

    report['keyword_matches']
  end

  # Get missing skills
  def missing_skills
    return [] unless report.present? && report['missing_skills']

    report['missing_skills']
  end

  # Calculate completion percentage
  def completion_percentage
    return 0 if pending?
    return 50 if processing?
    return 100 if finished?

    0
  end

  # Get status display text
  def status_display
    status.titleize
  end

  # Get status icon for UI
  def status_icon
    case status
    when 'pending' then '⏳'
    when 'processing' then '⚙️'
    when 'completed' then '✅'
    when 'failed' then '❌'
    when 'cancelled' then '🚫'
    else '❓'
    end
  end

  # Export as JSON
  def to_export_json
    {
      id: id,
      status: status,
      status_display: status_display,
      match_score: match_score,
      match_score_category: match_score_category,
      report: report,
      error_message: error_message,
      created_at: created_at,
      updated_at: updated_at,
      processing_started_at: processing_started_at,
      processing_completed_at: processing_completed_at,
      processing_duration: processing_duration,
      processing_duration_humanized: processing_duration_humanized,
      completion_percentage: completion_percentage,
      retry_count: retry_count || 0,
      can_retry: can_retry?,
      cv: {
        id: cv.id,
        slug: cv.slug,
        display_name: cv.display_name
      },
      job_description: {
        id: job_description.id,
        title: job_description.title,
        company_name: job_description.company_name
      },
      summary: {
        recommendations_count: recommendations.size,
        improvements_count: improvements.size,
        strengths_count: strengths.size,
        weaknesses_count: weaknesses.size,
        missing_skills_count: missing_skills.size
      }
    }
  end

  # ============================================
  # CLASS METHODS
  # ============================================

  # Clean up stale optimizations
  def self.cleanup_stale!
    stale_optimizations = processing.where('processing_started_at < ?', 10.minutes.ago)

    stale_optimizations.find_each do |optimization|
      optimization.fail!('Optimization timed out')
    end

    stale_optimizations.count
  end

  # Get average match score for user
  def self.average_match_score_for_user(user)
    completed.where(user: user).average(:match_score)&.round(2)
  end

  # Get statistics
  def self.statistics
    {
      total: count,
      pending: pending.count,
      processing: processing.count,
      completed: completed.count,
      failed: failed.count,
      cancelled: cancelled.count,
      average_match_score: with_score.average(:match_score)&.round(2),
      high_match_count: high_match.count,
      medium_match_count: medium_match.count,
      low_match_count: low_match.count
    }
  end

  private

  # Set default status
  def set_default_status
    self.status ||= 'pending'
  end

  # Ensure report is always a hash
  def ensure_report_is_hash
    self.report = {} if report.nil?
  end

  # Validate CV belongs to user
  def cv_belongs_to_user
    return unless cv && user

    unless cv.user_id == user.id
      errors.add(:cv, 'must belong to the same user')
    end
  end

  # Validate JobDescription belongs to user
  def job_description_belongs_to_user
    return unless job_description && user

    unless job_description.user_id == user.id
      errors.add(:job_description, 'must belong to the same user')
    end
  end

  # Enqueue background job for processing
  def enqueue_optimization_job
    return unless pending?

    OptimizeResumeJob.perform_later(id)
    Rails.logger.info("Optimization #{id} enqueued for processing")
  end

  # Notify status change via ActionCable
  def notify_status_change
    # TODO: Implement in Phase 2
    # ActionCable.server.broadcast(
    #   "optimization_#{id}",
    #   { status: status, match_score: match_score }
    # )
  end
end
