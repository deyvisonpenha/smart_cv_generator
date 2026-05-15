# frozen_string_literal: true

class GenerateEmbeddingJob < ApplicationJob
  queue_as :embeddings

  ALLOWED_MODELS = %w[Cv JobDescription Interaction].freeze

  discard_on ActiveRecord::RecordNotFound

  def perform(model_name, record_id)
    # Whitelist to prevent arbitrary class instantiation via tampered job args
    raise ArgumentError, "Disallowed model: #{model_name}" unless ALLOWED_MODELS.include?(model_name)

    record = model_name.constantize.find(record_id)

    text = embedding_text_for(record)
    return if text.blank?

    embedding = EmbeddingService.embed(text)
    return unless embedding

    record.update_column(:embedding, embedding)
  end

  private

  def embedding_text_for(record)
    case record
    when Cv
      record.original_text
    when JobDescription
      "#{record.title} #{record.company_name} #{record.content}"
    when Interaction
      "#{record.question} #{record.answer}"
    else
      nil
    end
  end
end
