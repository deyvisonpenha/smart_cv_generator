class AddSubscriptionFieldsToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :subscription_tier, :string, default: "free"
    add_column :users, :subscription_status, :string, default: "active"
    add_column :users, :stripe_customer_id, :string
    add_column :users, :trial_ends_at, :datetime

    # Index for Stripe webhook lookups
    add_index :users, :stripe_customer_id, unique: true
  end
end
