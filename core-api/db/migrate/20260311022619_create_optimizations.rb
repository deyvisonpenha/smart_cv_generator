class CreateOptimizations < ActiveRecord::Migration[8.1]
  def change
    create_table :optimizations do |t|
      t.references :user, null: false, foreign_key: true
      t.references :cv, null: false, foreign_key: true
      t.references :job_description, null: false, foreign_key: true
      t.string :status, null: false, default: 'pending'
      t.integer :match_score
      t.jsonb :report, default: {}

      t.timestamps
    end

    # Critical for real-time status tracking
    add_index :optimizations, :status
    add_index :optimizations, [:user_id, :status, :created_at]
  end
end
