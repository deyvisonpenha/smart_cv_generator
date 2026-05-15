# frozen_string_literal: true

class AddPgvectorEmbeddings < ActiveRecord::Migration[8.1]
  def up
    enable_extension 'vector'

    add_column :cvs, :embedding, :vector, limit: 1536
    add_column :job_descriptions, :embedding, :vector, limit: 1536
    add_column :interactions, :embedding, :vector, limit: 1536
  end

  def down
    remove_column :interactions, :embedding
    remove_column :job_descriptions, :embedding
    remove_column :cvs, :embedding
  end
end
