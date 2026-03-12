class AddProcessingFieldsToOptimizations < ActiveRecord::Migration[8.1]
  def change
    add_column :optimizations, :processing_started_at, :datetime
    add_column :optimizations, :processing_completed_at, :datetime
    add_column :optimizations, :error_message, :text
    add_column :optimizations, :retry_count, :integer
    add_column :optimizations, :last_used_at, :datetime
  end
end
