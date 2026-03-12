# frozen_string_literal: true

module Api
  module V1
    class DashboardController < BaseController
      # GET /api/v1/dashboard
      def index
        render json: {
          user: user_summary,
          cvs: cvs_summary,
          job_descriptions: job_descriptions_summary,
          optimizations: optimizations_summary,
          interactions: interactions_summary,
          recent_activity: recent_activity
        }
      end

      # GET /api/v1/dashboard/stats
      def stats
        render json: {
          overview: {
            total_cvs: current_user.cvs.count,
            total_jobs: current_user.job_descriptions.count,
            total_optimizations: current_user.optimizations.count,
            completed_optimizations: current_user.optimizations.completed.count,
            in_progress_optimizations: current_user.optimizations.in_progress.count,
            failed_optimizations: current_user.optimizations.failed.count
          },
          subscription: {
            tier: current_user.subscription_tier,
            status: current_user.subscription_status,
            display: current_user.subscription_display,
            has_pro_access: current_user.has_pro_access?,
            trial_active: current_user.trial_active?,
            trial_ends_at: current_user.trial_ends_at,
            remaining_optimizations: current_user.remaining_optimizations
          },
          performance: {
            average_match_score: current_user.optimizations.completed.average(:match_score)&.round(2),
            highest_match_score: current_user.optimizations.completed.maximum(:match_score),
            lowest_match_score: current_user.optimizations.completed.minimum(:match_score),
            optimizations_this_month: current_user.optimizations.where('created_at >= ?', 1.month.ago).count,
            optimizations_this_week: current_user.optimizations.where('created_at >= ?', 1.week.ago).count
          },
          match_distribution: {
            high: current_user.optimizations.high_match.count,
            medium: current_user.optimizations.medium_match.count,
            low: current_user.optimizations.low_match.count
          }
        }
      end

      private

      def user_summary
        {
          id: current_user.id,
          email: current_user.email,
          subscription_tier: current_user.subscription_tier,
          subscription_display: current_user.subscription_display,
          has_pro_access: current_user.has_pro_access?,
          remaining_optimizations: current_user.remaining_optimizations,
          member_since: current_user.created_at
        }
      end

      def cvs_summary
        {
          total: current_user.cvs.count,
          optimized: current_user.cvs.optimized.count,
          unoptimized: current_user.cvs.unoptimized.count,
          by_language: current_user.cvs.group(:language).count,
          recent: current_user.cvs.recent.limit(5).map do |cv|
            {
              id: cv.id,
              display_name: cv.display_name,
              language: cv.language,
              optimized: cv.optimized?,
              created_at: cv.created_at
            }
          end
        }
      end

      def job_descriptions_summary
        {
          total: current_user.job_descriptions.count,
          with_company: current_user.job_descriptions.with_company.count,
          recent: current_user.job_descriptions.recent.limit(5).map do |job|
            {
              id: job.id,
              title: job.title,
              company_name: job.company_name,
              optimized_cvs_count: job.optimized_cvs_count,
              created_at: job.created_at
            }
          end
        }
      end

      def optimizations_summary
        {
          total: current_user.optimizations.count,
          by_status: {
            pending: current_user.optimizations.pending.count,
            processing: current_user.optimizations.processing.count,
            completed: current_user.optimizations.completed.count,
            failed: current_user.optimizations.failed.count,
            cancelled: current_user.optimizations.cancelled.count
          },
          average_match_score: current_user.optimizations.completed.average(:match_score)&.round(2),
          recent: current_user.optimizations.recent.limit(5).map do |opt|
            {
              id: opt.id,
              status: opt.status,
              match_score: opt.match_score,
              cv_name: opt.cv.display_name,
              job_title: opt.job_description.title,
              created_at: opt.created_at
            }
          end
        }
      end

      def interactions_summary
        {
          total: current_user.interactions.count,
          by_category: Interaction::CATEGORIES.map do |category|
            {
              name: category,
              display_name: Interaction.category_display_name(category),
              count: current_user.interactions.by_category(category).count
            }
          end,
          frequently_used: current_user.interactions.frequently_used.limit(5).map do |interaction|
            {
              id: interaction.id,
              question: interaction.question,
              category: interaction.category_display_name,
              used_count: interaction.used_count,
              last_used_at: interaction.last_used_at
            }
          end,
          total_reuses: current_user.interactions.sum(:used_count) - current_user.interactions.count
        }
      end

      def recent_activity
        activities = []

        # Recent optimizations
        current_user.optimizations.recent.limit(10).each do |opt|
          activities << {
            type: 'optimization',
            action: opt.status,
            description: "#{opt.status.titleize} optimization for #{opt.job_description.title}",
            match_score: opt.match_score,
            created_at: opt.created_at,
            url: "/optimizations/#{opt.id}"
          }
        end

        # Recent CVs
        current_user.cvs.recent.limit(5).each do |cv|
          activities << {
            type: 'cv',
            action: 'created',
            description: "Created CV: #{cv.display_name}",
            created_at: cv.created_at,
            url: "/cvs/#{cv.id}"
          }
        end

        # Recent job descriptions
        current_user.job_descriptions.recent.limit(5).each do |job|
          activities << {
            type: 'job_description',
            action: 'created',
            description: "Added job: #{job.title}#{job.company_name ? " at #{job.company_name}" : ''}",
            created_at: job.created_at,
            url: "/job_descriptions/#{job.id}"
          }
        end

        # Sort by created_at and limit to 20
        activities.sort_by { |a| a[:created_at] }.reverse.take(20)
      end
    end
  end
end
