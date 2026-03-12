class CreateCvs < ActiveRecord::Migration[8.1]
  def change
    create_table :cvs do |t|
      t.references :user, null: false, foreign_key: true
      t.text :original_text
      t.jsonb :optimized_data, default: {}
      t.string :language, default: 'en'
      t.string :slug, null: false

      t.timestamps
    end

    add_index :cvs, :slug, unique: true
    add_index :cvs, [:user_id, :created_at]
    # GIN index for JSONB queries (Phase 4 - Semantic Search)
    add_index :cvs, :optimized_data, using: :gin
  end
end
