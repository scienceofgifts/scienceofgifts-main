# frozen_string_literal: true

require "json"
require "fileutils"

module Jekyll
  module CatalogGenerator
    def self.generate_catalog(site)
      source_dir = site.source
      
      # 1. Authors
      authors = site.data["authors"] || {}

      # 2. Products
      products = site.data["products"] || []

      # 3. Guides
      guides = {}
      if site.collections["guides"]
        site.collections["guides"].docs.each do |doc|
          data = doc.data
          slug = data["slug"] || doc.basename_without_ext
          guides[slug] = {
            "slug" => slug,
            "title" => data["title"],
            "deck" => data["deck"] || data["description"],
            "category" => data["category"] || "Curation",
            "readTime" => data["readTime"] || "10 min read",
            "publishedDate" => data["publishedDate"],
            "lastModifiedDate" => data["lastModifiedDate"] || "Autumn 2026",
            "updatedDate" => data["updatedDate"] || data["lastModifiedDate"] || "Autumn 2026",
            "author" => data["author"],
            "heroImageAlt" => data["heroImageAlt"],
            "heroImageType" => data["heroImageType"] || data["image"] || slug,
            "image" => data["image"] || data["heroImageType"] || slug,
            "heroImageCaption" => data["heroImageCaption"],
            "introQuote" => data["introQuote"],
            "relatedGuideSlugs" => data["relatedGuideSlugs"] || []
          }
        end
      end

      # 4. Articles
      articles = {}
      if site.collections["articles"]
        site.collections["articles"].docs.each do |doc|
          data = doc.data
          slug = data["slug"] || doc.basename_without_ext
          articles[slug] = {
            "slug" => slug,
            "title" => data["title"],
            "deck" => data["deck"] || data["description"],
            "category" => data["category"] || "Essays",
            "readTime" => data["readTime"] || "8 min read",
            "publishedDate" => data["publishedDate"],
            "lastModifiedDate" => data["lastModifiedDate"] || "Autumn 2026",
            "updatedDate" => data["updatedDate"] || data["lastModifiedDate"] || "Autumn 2026",
            "author" => data["author"],
            "heroImageType" => data["heroImageType"] || data["image"] || slug,
            "image" => data["image"] || data["heroImageType"] || slug,
            "heroImageAlt" => data["heroImageAlt"],
            "heroImageCaption" => data["heroImageCaption"],
            "introQuote" => data["introQuote"],
            "sources" => data["sources"] || [],
            "relatedArticleSlugs" => data["relatedArticleSlugs"] || [],
            "relatedGuideSlug" => data["relatedGuideSlug"]
          }
        end
      end

      # 5. Pages
      pages = {}
      page_slugs = %w[about affiliate-disclosure contact privacy terms]
      page_slugs.each do |slug|
        page_file = File.join(source_dir, slug, "index.html")
        page_file = File.join(source_dir, "#{slug}.md") unless File.exist?(page_file)
        if File.exist?(page_file)
          content = File.read(page_file)
          match = content.match(/\A---\r?\n(.*?)\r?\n---\r?\n?(.*)\z/m)
          data = {}
          body = content
          if match
            begin
              data = SafeYAML.load(match[1]) || {}
            rescue
              data = {}
            end
            body = match[2]
          end
          pages[slug] = {
            "slug" => slug,
            "title" => data["title"] || "",
            "description" => data["description"] || "",
            "eyebrow" => data["eyebrow"] || "",
            "updatedDate" => data["updatedDate"] || "Autumn 2026",
            "content" => body.strip
          }
        end
      end

      catalog_js = <<~JS
        /**
         * Science of Gifts Centralized Catalog Data
         * Automatically compiled from Jekyll collections (_guides, _articles), _data, and content pages.
         */

        window.SOG_AUTHORS = #{JSON.pretty_generate(authors)};

        window.SOG_PRODUCTS = #{JSON.pretty_generate(products)};

        window.SOG_GUIDES = #{JSON.pretty_generate(guides)};

        window.SOG_ARTICLES = #{JSON.pretty_generate(articles)};

        window.SOG_PAGES = #{JSON.pretty_generate(pages)};
      JS

      # Write to source directory
      js_path = File.join(source_dir, "assets", "js", "catalog-data.js")
      FileUtils.mkdir_p(File.dirname(js_path))
      File.write(js_path, catalog_js)

      # Write to output destination if present
      if site.dest && Dir.exist?(site.dest)
        dest_js_path = File.join(site.dest, "assets", "js", "catalog-data.js")
        FileUtils.mkdir_p(File.dirname(dest_js_path))
        File.write(dest_js_path, catalog_js)
      end
    end
  end
end

Jekyll::Hooks.register :site, :post_read do |site|
  Jekyll::CatalogGenerator.generate_catalog(site)
end
