# frozen_string_literal: true

module Api
  module V1
    class JobDescriptionsController < BaseController
      before_action :set_job_description, only: [:show, :update, :destroy, :duplicate, :extract_keywords, :required_skills, :analysis]

      # GET /api/v1/job_descriptions
      def index
        jobs = current_user.job_descriptions.recent

        # Apply filters if provided
        jobs = jobs.by_company(params[:company]) if params[:company].present?
        jobs = jobs.by_title(params[:title]) if params[:title].present?
        jobs = jobs.with_company if params[:with_company] == 'true'

        # Search
        jobs = jobs.search(params[:q]) if params[:q].present?

        render_paginated(jobs.map(&:to_export_json))
      end

      # GET /api/v1/job_descriptions/:id
      def show
        render json: {
          job_description: @job_description.to_export_json
        }
      end

      # POST /api/v1/job_descriptions
      def create
        job = current_user.job_descriptions.build(job_description_params)

        if job.save
          render json: {
            message: 'Job description created successfully',
            job_description: job.to_export_json
          }, status: :created
        else
          render_error('Failed to create job description', errors: job.errors.full_messages)
        end
      end

      # PATCH/PUT /api/v1/job_descriptions/:id
      def update
        if @job_description.update(job_description_params)
          render json: {
            message: 'Job description updated successfully',
            job_description: @job_description.to_export_json
          }
        else
          render_error('Failed to update job description', errors: @job_description.errors.full_messages)
        end
      end

      # DELETE /api/v1/job_descriptions/:id
      def destroy
        @job_description.destroy
        render json: {
          message: 'Job description deleted successfully'
        }
      end

      # POST /api/v1/job_descriptions/:id/duplicate
      def duplicate
        new_job = @job_description.duplicate

        if new_job.persisted?
          render json: {
            message: 'Job description duplicated successfully',
            job_description: new_job.to_export_json
          }, status: :created
        else
          render_error('Failed to duplicate job description', errors: new_job.errors.full_messages)
        end
      end

      # GET /api/v1/job_descriptions/:id/extract_keywords
      def extract_keywords
        keywords = @job_description.extract_keywords

        render json: {
          keywords: keywords,
          count: keywords.size
        }
      end

      # GET /api/v1/job_descriptions/:id/required_skills
      def required_skills
        skills = @job_description.extract_required_skills

        render json: {
          skills: skills,
          count: skills.size
        }
      end

      # GET /api/v1/job_descriptions/:id/analysis
      def analysis
        render json: {
          keywords: @job_description.extract_keywords,
          required_skills: @job_description.extract_required_skills,
          experience_level: @job_description.extract_experience_level,
          remote_work: @job_description.remote_work?,
          estimated_read_time: @job_description.estimated_read_time
        }
      end

      private

      def set_job_description
        @job_description = current_user.job_descriptions.find(params[:id])
      end

      def job_description_params
        params.require(:job_description).permit(:title, :content, :company_name)
      end
    end
  end
end
