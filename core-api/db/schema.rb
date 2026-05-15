# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_04_03_000001) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"
  enable_extension "vector"

  create_table "cvs", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.vector "embedding", limit: 1536
    t.string "language", default: "en"
    t.jsonb "optimized_data", default: {}
    t.text "original_text"
    t.string "slug", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["optimized_data"], name: "index_cvs_on_optimized_data", using: :gin
    t.index ["slug"], name: "index_cvs_on_slug", unique: true
    t.index ["user_id", "created_at"], name: "index_cvs_on_user_id_and_created_at"
    t.index ["user_id"], name: "index_cvs_on_user_id"
  end

  create_table "interactions", force: :cascade do |t|
    t.text "answer", null: false
    t.string "category"
    t.datetime "created_at", null: false
    t.vector "embedding", limit: 1536
    t.datetime "last_used_at"
    t.text "question", null: false
    t.datetime "updated_at", null: false
    t.integer "used_count"
    t.bigint "user_id", null: false
    t.index ["created_at"], name: "index_interactions_on_created_at"
    t.index ["user_id", "category"], name: "index_interactions_on_user_id_and_category"
    t.index ["user_id"], name: "index_interactions_on_user_id"
  end

  create_table "job_descriptions", force: :cascade do |t|
    t.string "company_name"
    t.text "content", null: false
    t.datetime "created_at", null: false
    t.vector "embedding", limit: 1536
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["user_id", "created_at"], name: "index_job_descriptions_on_user_id_and_created_at"
    t.index ["user_id"], name: "index_job_descriptions_on_user_id"
  end

  create_table "optimizations", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "cv_id", null: false
    t.text "error_message"
    t.bigint "job_description_id", null: false
    t.datetime "last_used_at"
    t.integer "match_score"
    t.datetime "processing_completed_at"
    t.datetime "processing_started_at"
    t.jsonb "report", default: {}
    t.integer "retry_count"
    t.string "status", default: "pending", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["cv_id"], name: "index_optimizations_on_cv_id"
    t.index ["job_description_id"], name: "index_optimizations_on_job_description_id"
    t.index ["status"], name: "index_optimizations_on_status"
    t.index ["user_id", "status", "created_at"], name: "index_optimizations_on_user_id_and_status_and_created_at"
    t.index ["user_id"], name: "index_optimizations_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.datetime "remember_created_at"
    t.datetime "reset_password_sent_at"
    t.string "reset_password_token"
    t.string "stripe_customer_id"
    t.string "subscription_status", default: "active"
    t.string "subscription_tier", default: "free"
    t.datetime "trial_ends_at"
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["stripe_customer_id"], name: "index_users_on_stripe_customer_id", unique: true
  end

  add_foreign_key "cvs", "users"
  add_foreign_key "interactions", "users"
  add_foreign_key "job_descriptions", "users"
  add_foreign_key "optimizations", "cvs"
  add_foreign_key "optimizations", "job_descriptions"
  add_foreign_key "optimizations", "users"
end
