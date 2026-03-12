class AddUsedCountToInteractions < ActiveRecord::Migration[8.1]
  def change
    add_column :interactions, :used_count, :integer
    add_column :interactions, :last_used_at, :datetime
  end
end
