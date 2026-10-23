# frozen_string_literal: true

require "cgi"

module Jekyll
  module InlineCitations
    CITE_REGEX = /\[\[@cite:\s*([a-zA-Z0-9_-]+)\s*\]\]/

    # Generate a deterministic URL-friendly slug from title for fallback IDs
    def self.slugify(text)
      text.to_s.downcase.strip
          .gsub(/[^\w\s-]/, "")
          .gsub(/[-\s]+/, "-")
          .sub(/^-+/, "")
          .sub(/-+$/, "")
    end

    # Ensure every source in front matter has a stable identifier
    def self.assign_source_ids(sources)
      used_ids = {}
      sources.each_with_index do |src, idx|
        raw_id = src["id"] || src[:id]
        id_str = raw_id.to_s.strip
        if id_str.empty?
          title_str = src["title"] || src[:title]
          slug = slugify(title_str)
          slug = slug[0...40].sub(/-+$/, "") if slug.length > 40
          slug = "source-#{idx + 1}" if slug.empty?
          id_str = slug
        end

        base_id = id_str
        counter = 2
        while used_ids.key?(id_str)
          id_str = "#{base_id}-#{counter}"
          counter += 1
        end
        used_ids[id_str] = true

        src["id"] = id_str
        src["citations"] = []
      end
    end

    # Mask code blocks and inline code so citations inside code are not converted
    def self.mask_code(text)
      placeholders = []
      # Fenced code blocks
      masked = text.gsub(/(```+|~~~+)[\s\S]*?\1/) do |match|
        idx = placeholders.size
        placeholders << match
        "<!--__CITE_CODE_BLOCK_#{idx}__-->"
      end
      # Inline code
      masked = masked.gsub(/`[^`\n]+`/) do |match|
        idx = placeholders.size
        placeholders << match
        "<!--__CITE_INLINE_CODE_#{idx}__-->"
      end
      [masked, placeholders]
    end

    def self.unmask_code(text, placeholders)
      text.gsub(/<!--__CITE_(?:CODE_BLOCK|INLINE_CODE)_(\d+)__-->/) do
        placeholders[$1.to_i]
      end
    end

    def self.process_document(doc, payload = nil)
      is_article = doc.collection&.label == "articles" ||
                   doc.data["layout"] == "article" ||
                   (doc.data["sources"].is_a?(Array) && !doc.data["sources"].empty?) ||
                   doc.content.to_s.include?("[[@cite:")
      return unless is_article

      sources = doc.data["sources"]
      sources = [] unless sources.is_a?(Array)

      # Duplicate source hashes so we don't accidentally mutate frozen or shared hashes
      normalized_sources = sources.map do |s|
        s.is_a?(Hash) ? s.dup : {}
      end

      # Assign stable IDs with backward-compatible fallback
      assign_source_ids(normalized_sources)

      # Build lookup by ID
      sources_by_id = {}
      normalized_sources.each do |src|
        sources_by_id[src["id"]] = src
      end

      # Mask code blocks in content
      masked_content, placeholders = mask_code(doc.content.to_s)

      # First pass: determine order of first appearance of valid cited sources
      first_seen_ids = []
      masked_content.scan(CITE_REGEX) do |match|
        cid = match[0].to_s.strip
        if sources_by_id.key?(cid)
          first_seen_ids << cid unless first_seen_ids.include?(cid)
        else
          file_ident = doc.respond_to?(:relative_path) ? doc.relative_path : (doc.respond_to?(:path) ? doc.path : "document")
          Jekyll.logger.warn "Science of Gifts Citation Warning:", "Unknown source ID '@cite:#{cid}' cited in #{file_ident}"
        end
      end

      # Order sources:
      # 1. Cited sources in order of their first appearance
      # 2. Uncited sources in their existing front matter order
      ordered_sources = []
      num = 1
      first_seen_ids.each do |cid|
        src = sources_by_id[cid]
        src["number"] = num
        src["citations"] = []
        num += 1
        ordered_sources << src
      end

      normalized_sources.each do |src|
        cid = src["id"]
        unless first_seen_ids.include?(cid)
          src["number"] = num
          src["citations"] = []
          num += 1
          ordered_sources << src
        end
      end

      # Second pass: replace citations with rendered superscript links
      occ_counter = Hash.new(0)
      replaced_content = masked_content.gsub(CITE_REGEX) do
        cid = $1.to_s.strip
        if sources_by_id.key?(cid)
          src = sources_by_id[cid]
          occ_counter[cid] += 1
          occ = occ_counter[cid]
          ref_id = "cite-ref-#{cid}-#{occ}"

          src["citations"] << {
            "id" => ref_id,
            "occurrence" => occ,
            "number" => src["number"],
            "label" => occ == 1 && occ_counter[cid] == 1 ? "#{src["number"]}" : "#{src["number"]}.#{occ}"
          }

          title_attr = CGI.escapeHTML(src["title"].to_s)
          %(<sup class="citation-ref scroll-mt-24" id="#{ref_id}"><a href="#source-#{cid}" class="citation-link font-mono-code text-[11px] font-semibold text-[#2A548E] hover:text-[#1B365D] hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-[#2A548E] px-0.5 rounded-xs" aria-label="Citation #{src["number"]}: #{title_attr}">[#{src["number"]}]</a></sup>)
        else
          escaped_id = CGI.escapeHTML(cid)
          %(<span class="citation-error text-rose-700 bg-rose-50 border border-rose-200 px-1 py-0.5 rounded text-[11px] font-mono-code" title="Unknown source ID: #{escaped_id}" aria-label="Unknown citation: #{escaped_id}">[citation needed: #{escaped_id}]</span>)
        end
      end

      # Unmask code blocks
      doc.content = unmask_code(replaced_content, placeholders)

      # Store updated sources in doc.data and payload for layout rendering
      doc.data["sources"] = ordered_sources
      if payload && payload["page"]
        payload["page"]["sources"] = ordered_sources
      end
    end
  end
end

Jekyll::Hooks.register :documents, :pre_render do |doc, payload|
  Jekyll::InlineCitations.process_document(doc, payload)
end

Jekyll::Hooks.register :documents, :post_convert do |doc|
  # Safety fallback: if any [[@cite:...]] somehow escaped pre_render, clean it here
  if doc.content && doc.content.include?("[[@cite:")
    masked, placeholders = Jekyll::InlineCitations.mask_code(doc.content)
    sources_by_id = {}
    (doc.data["sources"] || []).each { |s| sources_by_id[s["id"]] = s }
    occ_counter = Hash.new(0)
    replaced = masked.gsub(Jekyll::InlineCitations::CITE_REGEX) do
      cid = $1.to_s.strip
      if sources_by_id.key?(cid)
        src = sources_by_id[cid]
        occ_counter[cid] += 1
        occ = occ_counter[cid]
        ref_id = "cite-ref-#{cid}-#{occ}"
        title_attr = CGI.escapeHTML(src["title"].to_s)
        %(<sup class="citation-ref scroll-mt-24" id="#{ref_id}"><a href="#source-#{cid}" class="citation-link font-mono-code text-[11px] font-semibold text-[#2A548E] hover:text-[#1B365D] hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-[#2A548E] px-0.5 rounded-xs" aria-label="Citation #{src["number"]}: #{title_attr}">[#{src["number"]}]</a></sup>)
      else
        escaped_id = CGI.escapeHTML(cid)
        %(<span class="citation-error text-rose-700 bg-rose-50 border border-rose-200 px-1 py-0.5 rounded text-[11px] font-mono-code" title="Unknown source ID: #{escaped_id}" aria-label="Unknown citation: #{escaped_id}">[citation needed: #{escaped_id}]</span>)
      end
    end
    doc.content = Jekyll::InlineCitations.unmask_code(replaced, placeholders)
  end
end
