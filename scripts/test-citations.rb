# frozen_string_literal: true

require "jekyll"
require "cgi"

puts "================================================="
puts "RUNNING SCIENCE OF GIFTS INLINE CITATIONS TEST SUITE"
puts "================================================="

failures = []

def assert(condition, message, failures)
  if condition
    puts "  [PASS] #{message}"
  else
    puts "  [FAIL] #{message}"
    failures << message
  end
end

require_relative "../_plugins/inline_citations"

# Mock document class for isolated unit testing
class TestDoc
  attr_accessor :content, :data, :collection, :relative_path
  def initialize(content, sources, slug = "unit-test-doc")
    @content = content
    @data = {
      "sources" => sources,
      "layout" => "article",
      "slug" => slug,
      "title" => "Unit Test Article"
    }
    @collection = Struct.new(:label).new("articles")
    @relative_path = "_articles/#{slug}.md"
  end
end

# Test 1: Single citation renders a numbered superscript link
doc1 = TestDoc.new("Social exchange.[[@cite:paper-a]]", [
  { "id" => "paper-a", "title" => "Paper A Title", "author" => "Author A" }
])
Jekyll::InlineCitations.process_document(doc1)
assert(
  doc1.content.include?('<sup class="citation-ref scroll-mt-24" id="cite-ref-paper-a-1"><a href="#source-paper-a" class="citation-link font-mono-code text-[11px] font-semibold text-[#2A548E] hover:text-[#1B365D] hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-[#2A548E] px-0.5 rounded-xs" aria-label="Citation 1: Paper A Title">[1]</a></sup>'),
  "Criterion 1: Paragraph containing one citation renders numbered superscript link",
  failures
)

# Test 2 & 3: Anchor matching between citation marker and reference backlink
sources1 = doc1.data["sources"]
assert(sources1.first["id"] == "paper-a", "Criterion 2: Reference has stable source ID", failures)
assert(sources1.first["number"] == 1, "Criterion 2: Reference has corresponding citation number 1", failures)
assert(sources1.first["citations"].size == 1 && sources1.first["citations"].first["id"] == "cite-ref-paper-a-1",
  "Criterion 3: Reference backlink points to exact marker ID cite-ref-paper-a-1", failures)

# Test 4: Two different sources cited in one paragraph display correct numbers
doc4 = TestDoc.new("Two sources cited together.[[@cite:first-source]][[@cite:second-source]]", [
  { "id" => "first-source", "title" => "First" },
  { "id" => "second-source", "title" => "Second" }
])
Jekyll::InlineCitations.process_document(doc4)
assert(
  doc4.content.include?('href="#source-first-source"') && doc4.content.include?('>[1]</a>') &&
  doc4.content.include?('href="#source-second-source"') && doc4.content.include?('>[2]</a>'),
  "Criterion 4: Two different sources cited in one paragraph display correct numbers [1] and [2]",
  failures
)

# Test 5: Repeated citations to one source reuse number with unique marker IDs
doc5 = TestDoc.new("First mention.[[@cite:multi-cite]] Second mention.[[@cite:multi-cite]]", [
  { "id" => "multi-cite", "title" => "Multi Cite Paper" }
])
Jekyll::InlineCitations.process_document(doc5)
assert(
  doc5.content.include?('id="cite-ref-multi-cite-1"') && doc5.content.include?('id="cite-ref-multi-cite-2"'),
  "Criterion 5a: Repeated citations have unique marker IDs (cite-ref-multi-cite-1 and cite-ref-multi-cite-2)",
  failures
)
cits5 = doc5.data["sources"].first["citations"]
assert(
  cits5.size == 2 && cits5[0]["number"] == 1 && cits5[1]["number"] == 1,
  "Criterion 5b: Repeated citations reuse reference number [1]",
  failures
)

# Test 6: Numbering follows first appearance in article body (reordering check)
# In front matter: gamma, beta, alpha.
# In body: beta cited first, alpha cited second, gamma not cited.
doc6 = TestDoc.new("Mentioning B[[@cite:beta]] then A[[@cite:alpha]].", [
  { "id" => "gamma", "title" => "Gamma" },
  { "id" => "beta", "title" => "Beta" },
  { "id" => "alpha", "title" => "Alpha" }
])
Jekyll::InlineCitations.process_document(doc6)
ordered6 = doc6.data["sources"]
assert(
  ordered6[0]["id"] == "beta" && ordered6[0]["number"] == 1 &&
  ordered6[1]["id"] == "alpha" && ordered6[1]["number"] == 2 &&
  ordered6[2]["id"] == "gamma" && ordered6[2]["number"] == 3,
  "Criterion 6: Numbering follows first appearance in body (Beta=1, Alpha=2), followed by uncited (Gamma=3)",
  failures
)

# Test 7: Uncited sources remain in bibliography
assert(
  ordered6.any? { |s| s["id"] == "gamma" && s["number"] == 3 && s["citations"].empty? },
  "Criterion 7: Uncited sources remain in bibliography with sequential number and empty citations",
  failures
)

# Test 8: Unknown source IDs produce a useful diagnostic and no broken link
doc8 = TestDoc.new("Citing mystery source.[[@cite:nonexistent-mystery-id]]", [
  { "id" => "known-source", "title" => "Known" }
])
Jekyll::InlineCitations.process_document(doc8)
assert(
  doc8.content.include?('<span class="citation-error') &&
  doc8.content.include?('nonexistent-mystery-id') &&
  !doc8.content.include?('href="#source-nonexistent-mystery-id"'),
  "Criterion 8: Unknown source ID renders visible error indicator and does NOT produce broken link",
  failures
)

# Test 9: Backward compatibility - legacy sources without IDs get stable fallback IDs
doc9 = TestDoc.new("Legacy article without explicit IDs.", [
  { "title" => "A Study on Decision Fatigue in Retail", "author" => "Smith" },
  { "title" => "Another Classical Paper on Etiquette", "author" => "Jones" }
])
Jekyll::InlineCitations.process_document(doc9)
sources9 = doc9.data["sources"]
assert(
  sources9[0]["id"] == "a-study-on-decision-fatigue-in-retail" && sources9[0]["number"] == 1 &&
  sources9[1]["id"] == "another-classical-paper-on-etiquette" && sources9[1]["number"] == 2,
  "Criterion 9: Backward-compatible fallback IDs generated from titles for legacy sources",
  failures
)

# Test 10: Legacy article with no sources renders cleanly
doc10 = TestDoc.new("Article with no sources.", [])
Jekyll::InlineCitations.process_document(doc10)
assert(doc10.data["sources"] == [], "Criterion 10: Legacy article with no sources remains empty array", failures)

# Test 11: Integration test with actual Jekyll site build
config = Jekyll.configuration({ "source" => ".", "destination" => "./_site", "quiet" => true })
site = Jekyll::Site.new(config)
site.reset
site.read
site.generate
site.render
site.write

rendered_article_path = "_site/avoid-overthinking-gift-decisions/index.html"
assert(File.exist?(rendered_article_path), "Criterion 13a: Jekyll site builds successfully", failures)

rendered_html = File.read(rendered_article_path)
assert(!rendered_html.include?("[[@cite:"), "Criterion 11: Rendered HTML contains no literal [[@cite: syntax", failures)
assert(rendered_html.include?('class="citation-ref scroll-mt-24" id="cite-ref-giver-recipient-asymmetry-1"'),
  "Criterion 12a: Rendered HTML contains inline citation link for giver-recipient-asymmetry", failures)
assert(rendered_html.include?('id="source-giver-recipient-asymmetry"'),
  "Criterion 12b: Rendered HTML contains reference card with stable ID source-giver-recipient-asymmetry", failures)
assert(rendered_html.include?('1.1') && rendered_html.include?('1.2'),
  "Criterion 12c: Reference card for repeated citation has backlinks 1.1 and 1.2", failures)

puts "================================================="
if failures.empty?
  puts "ALL 13 ACCEPTANCE CRITERIA PASSED SUCCESSFULLY!"
  puts "================================================="
  exit 0
else
  puts "FAILED #{failures.size} TESTS:"
  failures.each { |f| puts "  - #{f}" }
  puts "================================================="
  exit 1
end
