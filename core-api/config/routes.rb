# frozen_string_literal: true

Rails.application.routes.draw do
  # Health check endpoint for load balancers and monitoring
  get "up" => "rails/health#show", as: :rails_health_check

  # API Routes
  namespace :api do
    namespace :v1 do
      # Custom Devise routes for JWT authentication
      devise_scope :user do
        post 'signup', to: 'registrations#create'
        post 'login', to: 'sessions#create'
        delete 'logout', to: 'sessions#destroy'
        get 'current_user', to: 'sessions#show'
      end

      # User profile and subscription management
      resource :profile, only: [:show, :update] do
        get :subscription_status, on: :collection
      end

      # CV Management
      resources :cvs, except: [:new, :edit] do
        member do
          get :public_view  # Public CV view via slug
          post :duplicate   # Duplicate a CV
        end
      end

      # Job Descriptions
      resources :job_descriptions, except: [:new, :edit]

      # Optimizations (CV + Job → AI optimization)
      resources :optimizations, only: [:index, :show, :create] do
        member do
          get :status       # Check optimization status
          post :regenerate  # Retry optimization
        end
      end

      # Interactions (Feature Store for Q&A)
      resources :interactions, only: [:index, :create, :show] do
        collection do
          get :by_category  # Get interactions by category
        end
      end

      # Dashboard - aggregated stats
      get 'dashboard', to: 'dashboard#index'
      get 'dashboard/stats', to: 'dashboard#stats'
    end
  end

  # Public routes (no authentication required)
  namespace :public do
    # Public CV view by slug
    get 'cv/:slug', to: 'cvs#show', as: :cv
  end

  # Root path (API info)
  root to: proc { [200, {}, [{ message: 'SmartCV API', version: 'v1', status: 'running' }.to_json]] }
end
