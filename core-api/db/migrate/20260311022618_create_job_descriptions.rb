class CreateJobDescriptions < ActiveRecord::Migration[8.1]
  def change
    create_table :job_descriptions do |t|
      t.references :user, null: false, foreign_key: true
      t.string :title, null: false
      t.text :content, null: false
      t.string :company_name

      t.timestamps
    end

    add_index :job_descriptions, [:user_id, :created_at]
  end
end
