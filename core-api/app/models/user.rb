# frozen_string_literal: true

class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :jwt_authenticatable, jwt_revocation_strategy: self

  # JWT Revocation Strategy (using self for now, will create JwtDenylist later)
  def self.jwt_revoked?(payload, user)
    # For now, tokens are never revoked
    # TODO: Implement proper revocation with JwtDenylist model
    false
  end

  def self.revoke_jwt(payload, user)
    # TODO: Implement proper revocation
    # Will create jwt_denylists table to track revoked tokens
  end

  # ============================================
  # ASSOCIATIONS
  # ============================================
  has_many :cvs, dependent: :destroy
  has_many :job_descriptions, dependent: :destroy
  has_many :optimizations, dependent: :destroy
  has_many :interactions, dependent: :destroy

  # ============================================
  # VALIDATIONS
  # ============================================
  validates :email, presence: true, uniqueness: { case_sensitive: false }
  validates :subscription_tier,
            inclusion: { in: %w[free pro enterprise], allow_nil: true }
  validates :subscription_status,
            inclusion: { in: %w[active inactive canceled trialing], allow_nil: true }

  # ============================================
  # SCOPES
  # ============================================
  scope :active_subscribers, -> { where(subscription_status: 'active') }
  scope :free_tier, -> { where(subscription_tier: 'free') }
  scope :paid_tier, -> { where(subscription_tier: %w[pro enterprise]) }
  scope :on_trial, -> { where('trial_ends_at > ?', Time.current) }

  # ============================================
  # INSTANCE METHODS
  # ============================================

  # Check if user has an active paid subscription
  def pro_subscriber?
    subscription_tier.in?(%w[pro enterprise]) && subscription_status == 'active'
  end

  # Check if trial is still active
  def trial_active?
    trial_ends_at.present? && trial_ends_at > Time.current
  end

  # Check if user has access to pro features
  def has_pro_access?
    pro_subscriber? || trial_active?
  end

  # Rate limiting: Check if user can create a new optimization
  # Phase 4: Unlimited for all tiers — limits will be re-introduced in Phase 5 (Stripe)
  def can_create_optimization?
    true
  end

  # Get remaining optimizations (unlimited in Phase 4)
  def remaining_optimizations
    Float::INFINITY
  end

  # Human-readable subscription display
  def subscription_display
    return "Free (Trial)" if trial_active? && subscription_tier == 'free'
    return "Pro (Trial)" if trial_active? && subscription_tier == 'pro'

    subscription_tier&.titleize || 'Free'
  end
end
