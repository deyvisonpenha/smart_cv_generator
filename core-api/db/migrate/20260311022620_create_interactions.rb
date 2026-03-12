class CreateInteractions < ActiveRecord::Migration[8.1]
  def change
    create_table :interactions do |t|
      t.references :user, null: false, foreign_key: true
      t.text :question, null: false
      t.text :answer, null: false
      t.string :category

      t.timestamps
    end

    # Fast lookups for "have I answered this before?"
    add_index :interactions, [:user_id, :category]
    add_index :interactions, :created_at
  end
end
