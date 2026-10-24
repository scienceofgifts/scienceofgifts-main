/**
 * scienceofgifts-static Main Vanilla JavaScript Controller
 * Implements navigation, search modal, saved items drawer, shortlist import/sharing,
 * the Gift Finder scoring engine, and the visual Product Creator Studio.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Global State
  let savedItems = getSavedItems();

  // Initialize all modular scripts
  initHeaderAndDrawer();
  initSearch();
  initPageBookmarks();
  checkShortlistImport();

  // Initialize page-specific interactive scripts
  if (document.querySelector('#gift-finder-container')) {
    initGiftFinder();
  }
  if (document.querySelector('#gift-guides-page-container') || document.querySelector('#collections-page-container')) {
    initGiftGuidesPage();
  }
  if (document.querySelector('#articles-page-container')) {
    initArticlesPage();
  }
  if (document.querySelector('#for-men-page-container')) {
    initProductCollectionPage('men');
  }
  if (document.querySelector('#for-women-page-container')) {
    initProductCollectionPage('women');
  }
  if (document.querySelector('.toc-link')) {
    initScrollSpy();
  }
  if (document.querySelector('.faq-item')) {
    initFaqAccordion();
  }
  if (document.querySelector('#studio-container') || document.querySelector('#product-studio-content')) {
    initProductStudio();
  }

  // --- LOCAL STORAGE HELPERS ---
  function getSavedItems() {
    try {
      const stored = localStorage.getItem('sog_saved_items');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  function saveSavedItems(items) {
    try {
      localStorage.setItem('sog_saved_items', JSON.stringify(items));
      savedItems = items;
      // Dispatch event for any other components
      window.dispatchEvent(new Event('sog:saved_updated'));
    } catch (err) {
      console.error('Failed to save to localStorage', err);
    }
  }

  function getVendorRelAttr(vendor, vendorUrl) {
    const v = (vendor || '').toLowerCase();
    const u = (vendorUrl || '').toLowerCase();
    if (v.includes('scienceofgifts') || v.includes('science of gifts') || u.includes('scienceofgifts.com')) {
      return '';
    }
    return 'rel="noopener noreferrer sponsored"';
  }

  // --- COMPONENT 1: HEADER & SAVED ITEMS DRAWER ---
  function initHeaderAndDrawer() {
    const searchBtn = document.querySelector('button[aria-label="Search gift guides and articles"]');
    const savedBtn = document.querySelector('button[aria-label="Saved gifts and guides"]');
    const mobileMenuTrigger = document.getElementById('mobile-menu-trigger') || document.querySelector('button[aria-label="Toggle navigation menu"]');
    
    // Select or create saved drawer markup in DOM if not present
    let savedDrawer = document.querySelector('#saved-gifts-drawer');
    if (!savedDrawer) {
      // We will inject the drawer template dynamically at the bottom of the body
      injectSavedDrawerTemplate();
      savedDrawer = document.querySelector('#saved-gifts-drawer');
    }

    // Toggle Mobile Menu
    if (mobileMenuTrigger) {
      mobileMenuTrigger.addEventListener('click', () => {
        const drawer = document.getElementById('mobile-menu-drawer') || document.querySelector('.md\\:hidden.border-t');
        if (drawer) {
          drawer.classList.toggle('hidden');
          // Update icon inside button
          const svg = mobileMenuTrigger.querySelector('svg');
          if (svg) {
            if (drawer.classList.contains('hidden')) {
              svg.innerHTML = '<path d="M4 5h16"></path><path d="M4 12h16"></path><path d="M4 19h16"></path>';
            } else {
              svg.innerHTML = '<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>';
            }
          }
        }
      });
    }

    // Open Drawer
    if (savedBtn) {
      savedBtn.addEventListener('click', () => {
        openSavedDrawer();
      });
    }

    // Update global badge counter on header load/change
    updateSavedCountBadge();

    window.addEventListener('sog:saved_updated', () => {
      updateSavedCountBadge();
      if (savedDrawer && !savedDrawer.classList.contains('hidden')) {
        renderSavedDrawerItems();
      }
    });

    // Close Drawer Buttons
    const closeBtns = savedDrawer.querySelectorAll('.close-drawer');
    closeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        closeSavedDrawer();
      });
    });

    // Delegated actions inside saved drawer (Clear All & Remove)
    savedDrawer.addEventListener('click', (e) => {
      const clearBtn = e.target.closest('#clear-all-saved');
      if (clearBtn) {
        e.preventDefault();
        saveSavedItems([]);
        renderSavedDrawerItems();
        updateSavedCountBadge();
      }
    });
  }

  function openSavedDrawer() {
    const drawer = document.querySelector('#saved-gifts-drawer');
    if (drawer) {
      drawer.classList.remove('hidden');
      renderSavedDrawerItems();
    }
  }

  function closeSavedDrawer() {
    const drawer = document.querySelector('#saved-gifts-drawer');
    if (drawer) {
      drawer.classList.add('hidden');
    }
  }

  function updateSavedCountBadge() {
    const count = getSavedItems().length;
    const badges = document.querySelectorAll('button[aria-label="Saved gifts and guides"] span.relative');
    badges.forEach(badge => {
      if (count > 0) {
        badge.innerHTML = `<span class="absolute inset-0 rounded-full bg-[#C3F3DF] text-[#154D3B] text-[10px] font-bold flex items-center justify-center font-mono-code border border-[#226E56]/20 whitespace-nowrap">${count > 99 ? '99+' : count}</span>`;
      } else {
        badge.innerHTML = '';
      }
    });
  }

  function renderSavedDrawerItems() {
    const listContainer = document.querySelector('#saved-drawer-items-list');
    const items = getSavedItems();
    
    if (!listContainer) return;

    if (items.length === 0) {
      listContainer.innerHTML = `
        <div class="text-center py-16 space-y-3">
          <div class="w-12 h-12 rounded-full bg-[#EEF5FF] text-[#2A548E] flex items-center justify-center mx-auto text-xl font-serif">§</div>
          <h4 class="font-serif-display text-base text-[#1E232B]">No saved objects yet</h4>
          <p class="text-xs text-[#5A6270] max-w-xs mx-auto leading-relaxed">
            As you browse our gift guides and essays, click the bookmark icon on any recommendation to keep a personal shortlist.
          </p>
          <a href="/history-gifts/" class="mt-2 inline-flex items-center gap-1 text-xs text-[#2A548E] font-medium hover:underline">
            Explore History Gifts <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-right w-3.5 h-3.5"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
          </a>
        </div>
      `;
      // Hide footer
      const footer = document.querySelector('#saved-drawer-footer');
      if (footer) footer.classList.add('hidden');
      return;
    }

    // Show footer
    const footer = document.querySelector('#saved-drawer-footer');
    if (footer) footer.classList.remove('hidden');

    listContainer.innerHTML = items.map(item => {
      const rawImg = item.image || item.imageType || item.id;
      const { webp, fallback } = getOptimizedImageSources(rawImg, true);
      return `
      <div class="p-4 bg-white border border-[#99BFF9]/25 space-y-3 relative group" data-id="${item.id}">
        <div class="flex items-start gap-3">
          <div class="w-16 h-16 shrink-0 bg-[#FAF9F6] border border-[#99BFF9]/30 rounded-sm overflow-hidden">
            <img
              src="${webp}"
              data-fallback="${fallback}"
              alt="${item.title}"
              class="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
              onerror="this.onerror=null; this.src=this.dataset.fallback;"
            >
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2">
              <h4 class="font-serif-display text-sm font-medium text-[#1E232B] line-clamp-1">${item.title}</h4>
              <button class="remove-saved-item text-[#5A6270]/60 hover:text-red-600 p-1 transition-colors shrink-0" data-id="${item.id}" title="Remove from saved">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2 w-3.5 h-3.5"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
              </button>
            </div>
            ${(item.tagline || item.editorialReview || item.description) ? `<p class="text-xs text-[#5A6270] line-clamp-1 mt-0.5">${item.tagline || item.editorialReview || item.description}</p>` : ''}
          </div>
        </div>
        <div class="pt-2 flex items-center justify-between text-xs border-t border-stone-100">
          <span class="font-mono-code font-semibold text-[#154D3B]">${item.price}</span>
          <a href="${item.vendorUrl}" ${getVendorRelAttr(item.vendor, item.vendorUrl)} class="text-[#2A548E] hover:underline flex items-center gap-1 font-medium text-[11px]">
            View on ${item.vendor ? item.vendor.split(',')[0] : 'Store'} <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-external-link w-2.5 h-2.5"><path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg>
          </a>
        </div>
      </div>
    `;
    }).join('');

    // Attach click listeners to Remove buttons
    const removeBtns = listContainer.querySelectorAll('.remove-saved-item');
    removeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-id');
        const filtered = getSavedItems().filter(item => item.id !== id);
        saveSavedItems(filtered);
        renderSavedDrawerItems();
      });
    });

    // Attach footer click listeners once
    const clearBtn = document.querySelector('#clear-all-saved');
    if (clearBtn) {
      clearBtn.onclick = (e) => {
        if (e) e.preventDefault();
        saveSavedItems([]);
        renderSavedDrawerItems();
        updateSavedCountBadge();
      };
    }

    const shareBtn = document.querySelector('#share-saved-shortlist');
    if (shareBtn) {
      shareBtn.onclick = () => {
        const ids = getSavedItems().map(item => item.id).join(',');
        const shareUrl = `${window.location.origin}/?shortlist=${encodeURIComponent(ids)}`;
        navigator.clipboard?.writeText(shareUrl).then(() => {
          shareBtn.innerText = '✓ Link Copied';
          shareBtn.classList.remove('bg-[#2A548E]');
          shareBtn.classList.add('bg-[#226E56]');
          setTimeout(() => {
            shareBtn.innerText = 'Share Shortlist';
            shareBtn.classList.remove('bg-[#226E56]');
            shareBtn.classList.add('bg-[#2A548E]');
          }, 2000);
        });
      };
    }
  }

  function injectSavedDrawerTemplate() {
    const drawerHtml = `
      <div id="saved-gifts-drawer" class="fixed inset-0 z-50 overflow-hidden hidden" role="dialog" aria-modal="true">
        <div class="absolute inset-0 bg-black/30 backdrop-blur-xs transition-opacity close-drawer"></div>
        <div class="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <div class="w-screen max-w-md bg-[#FAF9F6] border-l border-[#99BFF9]/40 shadow-2xl flex flex-col">
            <!-- Header -->
            <div class="p-6 border-b border-[#99BFF9]/30 flex items-center justify-between bg-white">
              <div>
                <h3 class="font-serif-display text-xl text-[#1E232B]">Your Saved Curations</h3>
                <p class="text-xs text-[#5A6270] mt-0.5">Shortlisted gift items</p>
              </div>
              <button class="p-2 text-[#5A6270] hover:text-[#1E232B] hover:bg-[#EEF5FF] rounded-full close-drawer" aria-label="Close saved drawer">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x w-5 h-5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <!-- Dynamic Saved List -->
            <div id="saved-drawer-items-list" class="flex-1 overflow-y-auto p-6 space-y-4"></div>
            <!-- Footer controls -->
            <div id="saved-drawer-footer" class="p-4 bg-white border-t border-[#99BFF9]/30 flex items-center justify-between text-xs hidden">
              <button id="clear-all-saved" class="text-[#5A6270] hover:text-red-600 transition-colors">Clear all</button>
              <button id="share-saved-shortlist" class="px-4 py-2 bg-[#2A548E] hover:bg-[#1B365D] text-white font-medium text-xs transition-colors min-w-[120px] text-center">Share Shortlist</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', drawerHtml);
  }

  // --- COMPONENT 2: SEARCH OVERLAY ---
  function initSearch() {
    const searchBtns = document.querySelectorAll('button[aria-label="Search gift guides and articles"]');
    
    // Inject search modal dynamically if not in DOM
    let searchModal = document.querySelector('#search-modal');
    if (!searchModal) {
      injectSearchModalTemplate();
      searchModal = document.querySelector('#search-modal');
    }

    searchBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        openSearchModal();
      });
    });

    const closeBtns = searchModal.querySelectorAll('.close-search');
    closeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        closeSearchModal();
      });
    });

    const overlay = searchModal.querySelector('.search-overlay-bg');
    if (overlay) {
      overlay.addEventListener('click', () => {
        closeSearchModal();
      });
    }

    // Keyboard ESC to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !searchModal.classList.contains('hidden')) {
        closeSearchModal();
      }
    });

    const searchInput = searchModal.querySelector('#search-input-field');
    const resultsContainer = searchModal.querySelector('#search-results-list');
    const clearInputBtn = searchModal.querySelector('#clear-search-input');

    if (searchInput && resultsContainer) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        if (query) {
          clearInputBtn.classList.remove('hidden');
        } else {
          clearInputBtn.classList.add('hidden');
        }
        renderSearchResults(query, resultsContainer);
      });
    }

    if (clearInputBtn && searchInput && resultsContainer) {
      clearInputBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearInputBtn.classList.add('hidden');
        renderSearchResults('', resultsContainer);
        searchInput.focus();
      });
    }

    // Popular suggestions keyword triggers
    const suggestions = searchModal.querySelectorAll('.popular-suggestion-trigger');
    suggestions.forEach(s => {
      s.addEventListener('click', () => {
        const term = s.getAttribute('data-term');
        if (searchInput) {
          searchInput.value = term;
          clearInputBtn.classList.remove('hidden');
          renderSearchResults(term, resultsContainer);
          searchInput.focus();
        }
      });
    });
  }

  function openSearchModal() {
    const searchModal = document.querySelector('#search-modal');
    if (searchModal) {
      searchModal.classList.remove('hidden');
      const input = searchModal.querySelector('#search-input-field');
      if (input) {
        input.value = '';
        input.focus();
      }
      const resultsContainer = searchModal.querySelector('#search-results-list');
      if (resultsContainer) {
        renderSearchResults('', resultsContainer);
      }
    }
  }

  function closeSearchModal() {
    const searchModal = document.querySelector('#search-modal');
    if (searchModal) {
      searchModal.classList.add('hidden');
    }
  }

  function renderSearchResults(query, container) {
    const q = query.toLowerCase().trim();
    const catalog = window.SOG_PRODUCTS || [];
    const guides = window.SOG_GUIDES ? Object.values(window.SOG_GUIDES) : [];
    const articles = window.SOG_ARTICLES ? Object.values(window.SOG_ARTICLES) : [];

    if (!q) {
      // Show default recent/popular state
      container.innerHTML = `
        <div class="space-y-4">
          <div>
            <div class="text-xs uppercase tracking-widest text-[#226E56] font-semibold mb-3 flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-gift w-3.5 h-3.5"><path d="M12 22V8"></path><path d="M5 12H19"></path><path d="M19 12V22H5V12"></path><path d="M12 2A5 5 0 0 0 7 7a5 5 0 0 0 5 15"></path></svg>
              <span>Featured Gift Guides</span>
            </div>
            <div class="grid grid-cols-1 gap-2">
              ${guides.slice(0, 3).map(g => `
                <a href="/${g.slug}/" class="p-3 bg-white border border-[#99BFF9]/20 hover:border-[#99BFF9] transition-all flex items-center justify-between group">
                  <div>
                    <h4 class="font-serif-display text-sm text-[#1E232B] group-hover:text-[#2A548E] font-medium">${g.title}</h4>
                    <p class="text-xs text-[#5A6270] mt-0.5 line-clamp-1">${g.deck}</p>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-right w-3.5 h-3.5 text-[#2A548E] opacity-0 group-hover:opacity-100 transition-opacity"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </a>
              `).join('')}
            </div>
          </div>
        </div>
      `;
      return;
    }

    // Run searches
    const matchedGuides = guides.filter(g => 
      (g.title || '').toLowerCase().includes(q) || 
      (g.deck || '').toLowerCase().includes(q) || 
      (g.category || '').toLowerCase().includes(q)
    );

    const matchedArticles = articles.filter(a => 
      (a.title || '').toLowerCase().includes(q) || 
      (a.deck || '').toLowerCase().includes(q) || 
      (a.category || '').toLowerCase().includes(q)
    );

    const matchedProducts = catalog.filter(p => 
      (p.title || '').toLowerCase().includes(q) || 
      (p.tagline || '').toLowerCase().includes(q) || 
      (p.editorialReview || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      (p.vendor || '').toLowerCase().includes(q) ||
      (p.whyItMakesAGreatGift || '').toLowerCase().includes(q) ||
      (p.idealFor || '').toLowerCase().includes(q) ||
      (p.whatMakesItStandOut || '').toLowerCase().includes(q) ||
      (p.thingsToConsider || '').toLowerCase().includes(q) ||
      (Array.isArray(p.interests) && p.interests.some(i => (i || '').toLowerCase().includes(q))) ||
      (Array.isArray(p.recipients) && p.recipients.some(r => (r || '').toLowerCase().includes(q))) ||
      (Array.isArray(p.recipient) && p.recipient.some(r => (r || '').toLowerCase().includes(q))) ||
      (Array.isArray(p.occasions) && p.occasions.some(o => (o || '').toLowerCase().includes(q))) ||
      (Array.isArray(p.personalityStyles) && p.personalityStyles.some(s => (s || '').toLowerCase().includes(q)))
    );

    if (matchedGuides.length === 0 && matchedArticles.length === 0 && matchedProducts.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12 text-[#5A6270]">
          <p class="font-serif-display text-lg text-[#1E232B]">No exact matches found</p>
          <p class="text-xs mt-1">Try broader terms like "history", "reading", "kitchen", or "under $50".</p>
        </div>
      `;
      return;
    }

    // Build Results List HTML
    let html = '<div class="space-y-6">';

    if (matchedGuides.length > 0) {
      html += `
        <div>
          <div class="text-xs uppercase tracking-widest text-[#226E56] font-semibold mb-3 flex items-center gap-1.5">
            <span>Gift Guides (${matchedGuides.length})</span>
          </div>
          <div class="space-y-2">
            ${matchedGuides.map(g => `
              <a href="/${g.slug}/" class="block p-3 bg-white border border-[#99BFF9]/20 hover:border-[#99BFF9] transition-all group">
                <div class="flex items-center justify-between">
                  <h4 class="font-serif-display text-base text-[#1E232B] group-hover:text-[#2A548E]">${g.title}</h4>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-right w-3.5 h-3.5 text-[#2A548E] opacity-0 group-hover:opacity-100 transition-opacity"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </div>
                <p class="text-xs text-[#5A6270] mt-0.5 line-clamp-1">${g.deck}</p>
              </a>
            `).join('')}
          </div>
        </div>
      `;
    }

    if (matchedArticles.length > 0) {
      html += `
        <div>
          <div class="text-xs uppercase tracking-widest text-[#2A548E] font-semibold mb-3 flex items-center gap-1.5">
            <span>Essays & Articles (${matchedArticles.length})</span>
          </div>
          <div class="space-y-2">
            ${matchedArticles.map(a => `
              <a href="/${a.slug}/" class="block p-3 bg-white border border-[#99BFF9]/20 hover:border-[#99BFF9] transition-all group">
                <div class="flex items-center justify-between">
                  <h4 class="font-serif-display text-base text-[#1E232B] group-hover:text-[#2A548E]">${a.title}</h4>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-right w-3.5 h-3.5 text-[#2A548E] opacity-0 group-hover:opacity-100 transition-opacity"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </div>
                <p class="text-xs text-[#5A6270] mt-0.5 line-clamp-1">${a.deck}</p>
              </a>
            `).join('')}
          </div>
        </div>
      `;
    }

    if (matchedProducts.length > 0) {
      html += `
        <div>
          <div class="text-xs uppercase tracking-widest text-[#154D3B] font-semibold mb-3 flex items-center gap-1.5">
            <span>Specific Objects & Recommendations (${matchedProducts.length})</span>
          </div>
          <div class="space-y-2">
            ${matchedProducts.slice(0, 6).map(p => {
              const isSaved = getSavedItems().some(item => item.id === p.id);
              const rawImg = p.image || p.imageType || p.id;
              const { webp, fallback } = getOptimizedImageSources(rawImg, true);
              return `
                <div class="p-3 bg-white border border-[#99BFF9]/20 flex items-center justify-between gap-3">
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="w-12 h-12 shrink-0 bg-[#FAF9F6] border border-[#99BFF9]/30 rounded-sm overflow-hidden">
                      <img
                        src="${webp}"
                        data-fallback="${fallback}"
                        alt="${p.title}"
                        class="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                        onerror="this.onerror=null; this.src=this.dataset.fallback;"
                      >
                    </div>
                    <div class="min-w-0">
                      <h5 class="font-medium text-sm text-[#1E232B] line-clamp-1">${p.title || ''}</h5>
                      <p class="text-xs text-[#5A6270] line-clamp-1 mt-0.5">${p.tagline || p.editorialReview || p.description || ''}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3 shrink-0">
                    <span class="font-mono-code text-xs font-semibold text-[#154D3B]">${p.price}</span>
                    <button class="toggle-save-search-result p-1.5 rounded-full hover:bg-stone-50 cursor-pointer text-[#5A6270] hover:text-[#2A548E]" data-id="${p.id}" aria-label="Save ${p.title}">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${isSaved ? '#226E56' : 'none'}" stroke="${isSaved ? '#226E56' : 'currentColor'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></svg>
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    html += '</div>';
    container.innerHTML = html;

    // Attach click listeners to bookmark buttons in search results
    const saveBtns = container.querySelectorAll('.toggle-save-search-result');
    saveBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-id');
        const prod = catalog.find(item => item.id === id);
        if (prod) {
          toggleSaveProduct(prod);
          // Toggle icon fills
          const isSavedNow = getSavedItems().some(item => item.id === id);
          const svg = btn.querySelector('svg');
          if (svg) {
            svg.setAttribute('fill', isSavedNow ? '#226E56' : 'none');
            svg.setAttribute('stroke', isSavedNow ? '#226E56' : 'currentColor');
          }
        }
      });
    });
  }

  function injectSearchModalTemplate() {
    const modalHtml = `
      <div id="search-modal" class="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 md:p-20 bg-black/40 backdrop-blur-xs hidden" role="dialog" aria-modal="true">
        <div class="absolute inset-0 search-overlay-bg close-search"></div>
        <div class="w-full max-w-2xl bg-[#FAF9F6] border border-[#99BFF9]/40 shadow-xl overflow-hidden flex flex-col max-h-[85vh] relative z-10">
          <!-- Search Input Bar -->
          <div class="p-4 border-b border-[#99BFF9]/30 flex items-center gap-3 bg-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-search w-5 h-5 text-[#2A548E] shrink-0"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input id="search-input-field" type="text" placeholder="Search by recipient, interest, item (e.g. history, books, brass, tea)..." class="w-full bg-transparent border-none outline-none text-sm sm:text-base text-[#1E232B] placeholder:text-[#5A6270]/60" />
            <button id="clear-search-input" class="p-1 text-[#5A6270] hover:text-[#1E232B] hidden" aria-label="Clear search">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <button class="p-1 text-xs text-[#5A6270] hover:text-[#1E232B] px-2 py-1 border border-stone-200 close-search">ESC</button>
          </div>
          <!-- Categories / Quick Suggestions -->
          <div class="px-4 py-2 bg-[#EEF5FF]/80 border-b border-[#99BFF9]/20 flex items-center gap-2 overflow-x-auto text-xs">
            <span class="text-[#5A6270] font-medium shrink-0">Popular:</span>
            <button class="popular-suggestion-trigger text-[#2A548E] hover:underline font-medium shrink-0" data-term="History">History</button>
            <button class="popular-suggestion-trigger text-[#2A548E] hover:underline font-medium shrink-0" data-term="Books">Books</button>
            <button class="popular-suggestion-trigger text-[#2A548E] hover:underline font-medium shrink-0" data-term="Curiosity">Curiosity</button>
            <button class="popular-suggestion-trigger text-[#2A548E] hover:underline font-medium shrink-0" data-term="Science">Science</button>
            <button class="popular-suggestion-trigger text-[#2A548E] hover:underline font-medium shrink-0" data-term="Food">Food</button>
            <button class="popular-suggestion-trigger text-[#2A548E] hover:underline font-medium shrink-0" data-term="Under 50">Under $50</button>
          </div>
          <!-- Results -->
          <div id="search-results-list" class="overflow-y-auto p-4 space-y-6 flex-1"></div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  }

  // --- COMPONENT 3: PAGE-LEVEL BOOKMARKS ---
  function initPageBookmarks() {
    // Find all bookmark trigger buttons on guides or pages
    const bookmarkBtns = document.querySelectorAll('.toggle-product-bookmark');
    bookmarkBtns.forEach(btn => {
      const id = btn.getAttribute('data-id');
      if (!id) return;

      // Update initial visual state of the button
      updatePageBookmarkBtnState(btn, id);

      btn.addEventListener('click', () => {
        const prod = window.SOG_PRODUCTS?.find(p => p.id === id);
        if (prod) {
          toggleSaveProduct(prod);
          updatePageBookmarkBtnState(btn, id);
        }
      });
    });

    // Re-check state if saved items are modified globally
    window.addEventListener('sog:saved_updated', () => {
      bookmarkBtns.forEach(btn => {
        const id = btn.getAttribute('data-id');
        if (id) updatePageBookmarkBtnState(btn, id);
      });
    });
  }

  function updatePageBookmarkBtnState(btn, id) {
    const isSaved = getSavedItems().some(item => item.id === id);
    const labelSpan = btn.querySelector('.bookmark-label');
    const svg = btn.querySelector('svg');

    // Handle normal catalog bookmark card button formats
    if (labelSpan) {
      labelSpan.textContent = isSaved ? 'Saved' : 'Save';
    }
    if (svg) {
      if (isSaved) {
        svg.setAttribute('fill', '#226E56');
        svg.setAttribute('stroke', '#226E56');
        btn.classList.add('bg-[#E8F8F1]', 'border-[#226E56]', 'text-[#154D3B]');
        btn.classList.remove('border-[#99BFF9]/40', 'text-[#5A6270]');
      } else {
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        btn.classList.remove('bg-[#E8F8F1]', 'border-[#226E56]', 'text-[#154D3B]');
        btn.classList.add('border-[#99BFF9]/40', 'text-[#5A6270]');
      }
    }
  }

  function toggleSaveProduct(product) {
    let items = getSavedItems();
    const exists = items.some(p => p.id === product.id);
    if (exists) {
      items = items.filter(p => p.id !== product.id);
    } else {
      items.push(product);
    }
    saveSavedItems(items);
  }

  // --- COMPONENT 4: URL SHORTLIST IMPORT ---
  function checkShortlistImport() {
    const params = new URLSearchParams(window.location.search);
    const shortlistParam = params.get('shortlist');
    
    if (shortlistParam) {
      const ids = shortlistParam.split(',').map(id => id.trim()).filter(Boolean);
      if (ids.length > 0 && window.SOG_PRODUCTS) {
        const matched = ids
          .map(id => window.SOG_PRODUCTS.find(p => p.id === id))
          .filter(Boolean);

        if (matched.length > 0) {
          const current = getSavedItems();
          matched.forEach(prod => {
            if (!current.some(item => item.id === prod.id)) {
              current.push(prod);
            }
          });
          saveSavedItems(current);

          // Remove shortlist query param cleanly from URL
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('shortlist');
          window.history.replaceState({}, '', newUrl.pathname + newUrl.search);

          // Automatically pop open Saved items drawer to showcase imported items
          setTimeout(() => {
            openSavedDrawer();
          }, 400);
        }
      }
    }
  }

  // --- COMPONENT 4.5: GIFT GUIDES, ARTICLES & PRODUCT COLLECTIONS (MEN / WOMEN) ---
  function initGiftGuidesPage() {
    const container = document.querySelector('#gift-guides-page-container') || document.querySelector('#collections-page-container');
    if (!container) return;

    let selectedCategory = 'All Guides';
    let currentPage = 1;
    const itemsPerPage = 6;

    const categoryButtonsContainer = container.querySelector('#gift-guides-category-buttons') || container.querySelector('#collections-category-buttons');
    const gridContainer = container.querySelector('#gift-guides-grid') || container.querySelector('#collections-grid');
    const resultsCountElement = container.querySelector('#gift-guides-results-count') || container.querySelector('#collections-results-count');
    const statusTextElement = container.querySelector('#gift-guides-page-status') || container.querySelector('#collections-page-status');
    const prevBtn = container.querySelector('#gift-guides-prev-btn') || container.querySelector('#collections-prev-btn');
    const nextBtn = container.querySelector('#gift-guides-next-btn') || container.querySelector('#collections-next-btn');

    const allGuides = window.SOG_GUIDES ? Object.values(window.SOG_GUIDES) : [];

    function render() {
      const filtered = allGuides.filter(g => {
        if (selectedCategory === 'All Guides' || selectedCategory === 'All') return true;
        return (g.category || '').toLowerCase() === selectedCategory.toLowerCase();
      });

      const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
      currentPage = Math.min(currentPage, totalPages);

      const startIdx = (currentPage - 1) * itemsPerPage;
      const paginated = filtered.slice(startIdx, startIdx + itemsPerPage);

      if (gridContainer) {
        gridContainer.innerHTML = paginated.map(g => `
          <a
            href="/${g.slug}/"
            class="group cursor-pointer flex flex-col justify-between bg-[#FAF9F6] border border-[#99BFF9]/30 hover:border-[#99BFF9] transition-all p-5 block"
          >
            <div class="space-y-4">
              <div class="overflow-hidden">
                <div class="overflow-hidden group-hover:scale-[1.01] transition-transform duration-300">
                  ${renderEditorialImage(g.heroImageType || g.image || g.slug, g.heroImageAlt || g.title, true, 'aspect-[16/9]')}
                </div>
              </div>
              <div class="space-y-2">
                <div class="flex items-center gap-2 text-xs text-[#5A6270]">
                  <span class="text-[#226E56] font-semibold">${g.category || 'Curation'}</span>
                  <span aria-hidden="true">·</span>
                  <span>${g.readTime || '10 min read'}</span>
                </div>
                <h3 class="font-serif-display text-xl sm:text-2xl text-[#1E232B] font-normal leading-snug group-hover:text-[#2A548E] transition-colors">
                  ${g.title}
                </h3>
                <p class="text-xs sm:text-sm text-[#5A6270] leading-relaxed line-clamp-2">
                  ${g.deck || g.description || ''}
                </p>
              </div>
            </div>
            <div class="pt-4 mt-4 border-t border-[#99BFF9]/20 flex items-center justify-between text-xs text-[#5A6270]">
              <span>Updated ${g.updatedDate || g.lastModifiedDate || 'Autumn 2026'}</span>
              <span class="text-[#2A548E] font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Explore <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-right w-3 h-3"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
              </span>
            </div>
          </a>
        `).join('');
      }

      if (resultsCountElement) {
        resultsCountElement.innerText = `Showing ${filtered.length > 0 ? startIdx + 1 : 0} – ${startIdx + paginated.length} of ${filtered.length} guides`;
      }

      if (statusTextElement) {
        statusTextElement.innerText = `Page ${currentPage} of ${totalPages}`;
      }

      if (prevBtn) {
        prevBtn.disabled = currentPage === 1;
        prevBtn.classList.toggle('opacity-30', currentPage === 1);
      }
      if (nextBtn) {
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.classList.toggle('opacity-30', currentPage === totalPages);
      }

      if (categoryButtonsContainer) {
        const btns = categoryButtonsContainer.querySelectorAll('button');
        btns.forEach(btn => {
          const catName = btn.getAttribute('data-category') || btn.innerText.trim();
          if (catName.toLowerCase() === selectedCategory.toLowerCase()) {
            btn.className = 'guide-cat-btn px-3.5 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer bg-[#2A548E] text-white';
          } else {
            btn.className = 'guide-cat-btn px-3.5 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer text-[#5A6270] hover:text-[#2A548E] hover:bg-[#EEF5FF]';
          }
        });
      }
    }

    if (categoryButtonsContainer) {
      const btns = categoryButtonsContainer.querySelectorAll('button');
      btns.forEach(btn => {
        btn.addEventListener('click', () => {
          selectedCategory = btn.getAttribute('data-category') || btn.innerText.trim();
          currentPage = 1;
          render();
        });
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--;
          render();
          gridContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const filtered = allGuides.filter(g => {
          if (selectedCategory === 'All Guides' || selectedCategory === 'All') return true;
          return (g.category || '').toLowerCase() === selectedCategory.toLowerCase();
        });
        const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
        if (currentPage < totalPages) {
          currentPage++;
          render();
          gridContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }

    render();
  }

  function initArticlesPage() {
    const container = document.querySelector('#articles-page-container');
    if (!container) return;

    let selectedCategory = 'All Articles';
    let currentPage = 1;
    const itemsPerPage = 6;

    const categoryButtonsContainer = container.querySelector('#articles-category-buttons');
    const gridContainer = container.querySelector('#articles-grid');
    const resultsCountElement = container.querySelector('#articles-results-count');
    const statusTextElement = container.querySelector('#articles-page-status');
    const prevBtn = container.querySelector('#articles-prev-btn');
    const nextBtn = container.querySelector('#articles-next-btn');

    const allArticles = window.SOG_ARTICLES ? Object.values(window.SOG_ARTICLES) : [];

    function render() {
      const filtered = allArticles.filter(a => {
        if (selectedCategory === 'All Articles' || selectedCategory === 'All') return true;
        return (a.category || '').toLowerCase() === selectedCategory.toLowerCase();
      });

      const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
      currentPage = Math.min(currentPage, totalPages);

      const startIdx = (currentPage - 1) * itemsPerPage;
      const paginated = filtered.slice(startIdx, startIdx + itemsPerPage);

      if (gridContainer) {
        gridContainer.innerHTML = paginated.map(a => `
          <a
            href="/${a.slug}/"
            class="group cursor-pointer flex flex-col justify-between bg-[#FAF9F6] border border-[#99BFF9]/30 hover:border-[#99BFF9] transition-all p-5 block"
          >
            <div class="space-y-4">
              <div class="overflow-hidden">
                <div class="overflow-hidden group-hover:scale-[1.01] transition-transform duration-300">
                  ${renderEditorialImage(a.heroImageType || a.image || a.slug, a.heroImageAlt || a.title, true, 'aspect-[16/9]')}
                </div>
              </div>
              <div class="space-y-2">
                <div class="flex items-center gap-2 text-xs text-[#5A6270]">
                  <span class="text-[#226E56] font-semibold">${a.category || 'Essay'}</span>
                  <span aria-hidden="true">·</span>
                  <span>${a.readTime || '7 min read'}</span>
                </div>
                <h3 class="font-serif-display text-xl sm:text-2xl text-[#1E232B] font-normal leading-snug group-hover:text-[#2A548E] transition-colors">
                  ${a.title}
                </h3>
                <p class="text-xs sm:text-sm text-[#5A6270] leading-relaxed line-clamp-2">
                  ${a.deck || a.description || ''}
                </p>
              </div>
            </div>
            <div class="pt-4 mt-4 border-t border-[#99BFF9]/20 flex items-center justify-between text-xs text-[#5A6270]">
              <span>${a.publishedDate || 'Autumn 2026'}</span>
              <span class="text-[#2A548E] font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Read Essay <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-right w-3 h-3"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
              </span>
            </div>
          </a>
        `).join('');
      }

      if (resultsCountElement) {
        resultsCountElement.innerText = `Showing ${filtered.length > 0 ? startIdx + 1 : 0} – ${startIdx + paginated.length} of ${filtered.length} essays`;
      }

      if (statusTextElement) {
        statusTextElement.innerText = `Page ${currentPage} of ${totalPages}`;
      }

      if (prevBtn) {
        prevBtn.disabled = currentPage === 1;
        prevBtn.classList.toggle('opacity-30', currentPage === 1);
      }
      if (nextBtn) {
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.classList.toggle('opacity-30', currentPage === totalPages);
      }

      if (categoryButtonsContainer) {
        const btns = categoryButtonsContainer.querySelectorAll('button');
        btns.forEach(btn => {
          const catName = btn.getAttribute('data-category') || btn.innerText.trim();
          if (catName.toLowerCase() === selectedCategory.toLowerCase()) {
            btn.className = 'article-cat-btn px-3.5 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer bg-[#2A548E] text-white';
          } else {
            btn.className = 'article-cat-btn px-3.5 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer text-[#5A6270] hover:text-[#2A548E] hover:bg-[#EEF5FF]';
          }
        });
      }
    }

    if (categoryButtonsContainer) {
      const btns = categoryButtonsContainer.querySelectorAll('button');
      btns.forEach(btn => {
        btn.addEventListener('click', () => {
          selectedCategory = btn.getAttribute('data-category') || btn.innerText.trim();
          currentPage = 1;
          render();
        });
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--;
          render();
          gridContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const filtered = allArticles.filter(a => {
          if (selectedCategory === 'All Articles' || selectedCategory === 'All') return true;
          return (a.category || '').toLowerCase() === selectedCategory.toLowerCase();
        });
        const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
        if (currentPage < totalPages) {
          currentPage++;
          render();
          gridContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }

    render();
  }

  function initProductCollectionPage(type) {
    const container = document.querySelector(type === 'men' ? '#for-men-page-container' : '#for-women-page-container');
    if (!container) return;

    let selectedSlug = 'all';
    let selectedInterest = 'all';
    let selectedSort = 'featured';
    let currentPage = 1;
    const itemsPerPage = 12;

    const categoryButtonsContainer = container.querySelector(type === 'men' ? '#men-category-buttons' : '#women-category-buttons');
    const interestButtonsContainer = container.querySelector(type === 'men' ? '#men-interest-buttons' : '#women-interest-buttons');
    const sortSelect = container.querySelector(type === 'men' ? '#men-sort-select' : '#women-sort-select');
    const gridContainer = container.querySelector(type === 'men' ? '#men-products-grid' : '#women-products-grid');
    const resultsCountElement = container.querySelector(type === 'men' ? '#men-results-count' : '#women-results-count');
    const statusTextElement = container.querySelector(type === 'men' ? '#men-page-status' : '#women-page-status');
    const prevBtn = container.querySelector(type === 'men' ? '#men-prev-btn' : '#women-prev-btn');
    const nextBtn = container.querySelector(type === 'men' ? '#men-next-btn' : '#women-next-btn');

    const allProducts = window.SOG_PRODUCTS || [];

    const recipientMappings = {
      dad: ['dad', 'father', 'parent'],
      husband: ['husband', 'partner'],
      boyfriend: ['boyfriend', 'partner'],
      brother: ['brother', 'sibling'],
      son: ['son'],
      him: ['friend', 'coworker', 'teacher', 'other'],
      mom: ['mom', 'mother', 'parent'],
      wife: ['wife', 'partner'],
      girlfriend: ['girlfriend', 'partner'],
      sister: ['sister', 'sibling'],
      daughter: ['daughter'],
      her: ['friend', 'coworker', 'teacher', 'other']
    };

    function filterAndSortProducts() {
      const activeBtn = categoryButtonsContainer ? categoryButtonsContainer.querySelector(`button[data-slug="${selectedSlug}"]`) : null;
      const dataRec = activeBtn ? activeBtn.getAttribute('data-recipients') : null;

      let filtered = allProducts.filter(p => {
        // Recipient / Category Filter
        if (selectedSlug !== 'all') {
          let targetRecipients = [];
          if (dataRec && dataRec.trim().length > 0) {
            targetRecipients = dataRec.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
          } else {
            targetRecipients = recipientMappings[selectedSlug] || [selectedSlug];
          }
          const pRecipients = (p.recipients || p.recipient || []).map(r => r.toLowerCase());
          if (!targetRecipients.some(r => pRecipients.includes(r))) return false;
        }

        // Interest / Archetype Filter
        if (selectedInterest !== 'all') {
          const pInterests = (p.interests || []).map(i => i.toLowerCase());
          if (!pInterests.includes(selectedInterest.toLowerCase())) return false;
        }

        return true;
      });

      // Price Filters & Sorting
      if (selectedSort === 'under-50') {
        filtered = filtered.filter(p => (p.priceNumber || 0) < 50);
      } else if (selectedSort === '50-100') {
        filtered = filtered.filter(p => (p.priceNumber || 0) >= 50 && (p.priceNumber || 0) <= 100);
      } else if (selectedSort === 'over-100') {
        filtered = filtered.filter(p => (p.priceNumber || 0) > 100);
      } else if (selectedSort === 'price-asc') {
        filtered.sort((a, b) => (a.priceNumber || 0) - (b.priceNumber || 0));
      } else if (selectedSort === 'price-desc') {
        filtered.sort((a, b) => (b.priceNumber || 0) - (a.priceNumber || 0));
      } else {
        // Featured
        filtered.sort((a, b) => {
          if (a.category === 'editors-pick' && b.category !== 'editors-pick') return -1;
          if (b.category === 'editors-pick' && a.category !== 'editors-pick') return 1;
          return 0;
        });
      }

      return filtered;
    }

    function render() {
      const filtered = filterAndSortProducts();
      const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
      currentPage = Math.min(currentPage, totalPages);

      const startIdx = (currentPage - 1) * itemsPerPage;
      const paginated = filtered.slice(startIdx, startIdx + itemsPerPage);

      if (gridContainer) {
        gridContainer.innerHTML = paginated.map(p => renderProductCardHtml(p)).join('');
        bindProductCardBookmarkButtons(gridContainer);
      }

      if (resultsCountElement) {
        resultsCountElement.innerText = `Showing ${filtered.length > 0 ? startIdx + 1 : 0} – ${startIdx + paginated.length} of ${filtered.length} gifts`;
      }

      if (statusTextElement) {
        statusTextElement.innerText = `Page ${currentPage} of ${totalPages}`;
      }

      if (prevBtn) {
        prevBtn.disabled = currentPage === 1;
        prevBtn.classList.toggle('opacity-30', currentPage === 1);
      }
      if (nextBtn) {
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.classList.toggle('opacity-30', currentPage === totalPages);
      }

      if (categoryButtonsContainer) {
        const btns = categoryButtonsContainer.querySelectorAll('button');
        btns.forEach(btn => {
          const slug = btn.getAttribute('data-slug');
          if (slug === selectedSlug) {
            btn.className = `${type}-cat-btn px-3.5 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer bg-[#2A548E] text-white`;
          } else {
            btn.className = `${type}-cat-btn px-3.5 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer text-[#5A6270] hover:text-[#2A548E] hover:bg-[#EEF5FF]`;
          }
        });
      }

      if (interestButtonsContainer) {
        const btns = interestButtonsContainer.querySelectorAll('button');
        btns.forEach(btn => {
          const interest = btn.getAttribute('data-interest');
          if (interest === selectedInterest) {
            btn.className = `${type}-interest-btn px-2.5 py-1 rounded transition-colors whitespace-nowrap cursor-pointer bg-[#2A548E] text-white font-medium`;
          } else {
            btn.className = `${type}-interest-btn px-2.5 py-1 rounded transition-colors whitespace-nowrap cursor-pointer bg-white text-[#5A6270] border border-[#99BFF9]/30 hover:text-[#2A548E] hover:bg-[#EEF5FF]`;
          }
        });
      }
    }

    if (categoryButtonsContainer) {
      const btns = categoryButtonsContainer.querySelectorAll('button');
      btns.forEach(btn => {
        btn.addEventListener('click', () => {
          selectedSlug = btn.getAttribute('data-slug') || 'all';
          currentPage = 1;
          render();
        });
      });
    }

    if (interestButtonsContainer) {
      const btns = interestButtonsContainer.querySelectorAll('button');
      btns.forEach(btn => {
        btn.addEventListener('click', () => {
          selectedInterest = btn.getAttribute('data-interest') || 'all';
          currentPage = 1;
          render();
        });
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        selectedSort = e.target.value;
        currentPage = 1;
        render();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--;
          render();
          gridContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const filtered = filterAndSortProducts();
        const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
        if (currentPage < totalPages) {
          currentPage++;
          render();
          gridContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }

    render();
  }

  function renderProductCardHtml(p) {
    const rawImg = p.image || p.imageType || p.id;
    const { webp, fallback } = getOptimizedImageSources(rawImg, true);
    const relAttr = getVendorRelAttr(p.vendor || p.merchant, p.vendorUrl || p.product_url);
    const vendorName = p.vendor || p.merchant ? (p.vendor || p.merchant).split(',')[0] : 'Store';
    const isSaved = getSavedItems().some(item => item.id === p.id);

    // Derive archetype label based on interests
    let archetypeLabel = '';
    const pInterests = p.interests || [];
    if (pInterests.includes('cooking')) archetypeLabel = 'Curated for Culinary Enthusiasts';
    else if (pInterests.includes('books')) archetypeLabel = 'Curated for Literary Enthusiasts';
    else if (pInterests.includes('art-design')) archetypeLabel = 'Curated for Design Lovers';
    else if (pInterests.includes('food-drink')) archetypeLabel = 'Curated for Entertaining';
    else if (pInterests.includes('history')) archetypeLabel = 'Curated for History Buffs';
    else if (pInterests.includes('stationery')) archetypeLabel = 'Curated for Writing & Stationery';
    else archetypeLabel = p.badgeLabel || 'Handpicked Selection';

    return `
      <div class="bg-white border border-[#99BFF9]/25 p-5 flex flex-col justify-between space-y-4 hover:border-[#99BFF9] transition-all rounded-xs shadow-2xs group" id="${p.id}">
        <div class="space-y-3">
          <div class="relative overflow-hidden bg-[#FAF9F6] border border-[#99BFF9]/25 rounded-sm aspect-[4/3] group-hover:scale-[1.01] transition-transform duration-300">
            <img
              src="${webp}"
              data-fallback="${fallback}"
              alt="${p.title}"
              class="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
              onerror="this.onerror=null; this.src=this.dataset.fallback;"
            >
          </div>

          <div class="flex items-center justify-between gap-2 text-xs pt-1 border-b border-[#99BFF9]/20 pb-2">
            <div class="flex items-center gap-1.5 min-w-0">
              <span class="font-mono-code font-bold text-sm text-[#154D3B] shrink-0">${p.price}</span>
              <span class="text-[#5A6270] truncate text-[11px]">· ${vendorName}</span>
            </div>
            <button data-id="${p.id}" class="toggle-product-bookmark p-1 text-[#5A6270] hover:text-[#2A548E] transition-colors shrink-0 cursor-pointer" title="Save gift">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-[#2A548E]"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></svg>
            </button>
          </div>

          <div class="text-[10px] uppercase tracking-wider font-semibold text-[#226E56] flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3 text-[#226E56]"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z"></path></svg>
            <span>${archetypeLabel}</span>
          </div>

          <h3 class="font-serif-display text-lg text-[#1E232B] font-normal leading-snug group-hover:text-[#2A548E] transition-colors">
            ${p.title}
          </h3>

          ${(p.tagline || p.editorialReview || p.description) ? `<p class="text-xs text-[#5A6270] leading-relaxed line-clamp-2 italic">${p.tagline || p.editorialReview || p.description}</p>` : ''}

          ${(p.whyItMakesAGreatGift || p.why_it_makes_a_great_gift) ? `
            <div class="p-2.5 bg-[#E8F8F1]/80 border-l-3 border-[#226E56] text-[11px] text-[#226E56] leading-tight">
              <strong>Why it's singular:</strong> ${p.whyItMakesAGreatGift || p.why_it_makes_a_great_gift}
            </div>
          ` : ''}
        </div>

        <div class="pt-3 border-t border-[#99BFF9]/20 flex items-center justify-between gap-2">
          <a href="${p.vendorUrl || p.product_url}" ${relAttr} class="w-full justify-center px-4 py-2 bg-white text-black border border-black hover:opacity-80 transition-opacity duration-200 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-2xs rounded-none">
            View on ${vendorName}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5"><path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg>
          </a>
        </div>
      </div>
    `;
  }

  function bindProductCardBookmarkButtons(gridContainer) {
    const btns = gridContainer.querySelectorAll('.toggle-product-bookmark');
    btns.forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        const id = btn.getAttribute('data-id');
        if (!id) return;
        let items = getSavedItems();
        const exists = items.some(i => i.id === id);
        const prod = window.SOG_PRODUCTS ? window.SOG_PRODUCTS.find(p => p.id === id) : null;

        if (exists) {
          items = items.filter(i => i.id !== id);
          saveSavedItems(items);
          const svg = btn.querySelector('svg');
          if (svg) svg.setAttribute('fill', 'none');
          const lbl = btn.querySelector('.save-label');
          if (lbl) lbl.innerText = 'Save';
        } else if (prod) {
          items.push({
            id: prod.id,
            title: prod.title,
            tagline: prod.tagline || '',
            price: prod.price,
            vendor: prod.vendor || prod.merchant,
            vendorUrl: prod.vendorUrl || prod.product_url,
            image: prod.image || prod.imageType || prod.id
          });
          saveSavedItems(items);
          const svg = btn.querySelector('svg');
          if (svg) svg.setAttribute('fill', 'currentColor');
          const lbl = btn.querySelector('.save-label');
          if (lbl) lbl.innerText = 'Saved';
        }
      };
    });
  }

  // --- COMPONENT 4.7: STICKY TOC SCROLLSPY HIGHLIGHT ---
  function initScrollSpy() {
    const tocLinks = document.querySelectorAll('.toc-link');
    if (tocLinks.length === 0) return;

    function getSecId(link) {
      return link.getAttribute('data-section') || (link.getAttribute('href') || '').replace(/^#/, '');
    }

    const sections = Array.from(tocLinks).map(link => {
      const secId = getSecId(link);
      return document.getElementById(secId);
    }).filter(Boolean);

    function highlightLink(activeId) {
      tocLinks.forEach(link => {
        const secId = getSecId(link);
        if (secId === activeId) {
          link.className = 'toc-link block w-full text-left py-1.5 px-2 transition-colors rounded cursor-pointer bg-[#EEF5FF] text-[#2A548E] font-semibold border-l-2 border-[#2A548E] active-toc';
        } else {
          link.className = 'toc-link block w-full text-left py-1.5 px-2 transition-colors rounded cursor-pointer text-[#5A6270] hover:text-[#1E232B] hover:bg-[#EEF5FF]';
        }
      });
    }

    function onScroll() {
      const scrollPos = window.scrollY || window.pageYOffset;
      const triggerOffset = 220; // slightly before section hits top of viewport minus header height

      // If at bottom of page, highlight the last section
      if ((window.innerHeight + scrollPos) >= document.documentElement.scrollHeight - 60) {
        if (sections.length > 0) {
          highlightLink(sections[sections.length - 1].id);
          return;
        }
      }

      let activeSectionId = '';
      for (let i = 0; i < sections.length; i++) {
        const sec = sections[i];
        const secTop = sec.getBoundingClientRect().top + scrollPos;
        if (scrollPos >= secTop - triggerOffset) {
          activeSectionId = sec.id;
        }
      }

      if (activeSectionId) {
        highlightLink(activeSectionId);
      }
    }

    // Add smooth-scrolling click handlers with sticky header offset
    tocLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const secId = getSecId(link);
        const targetSection = document.getElementById(secId);
        if (targetSection) {
          const headerOffset = 100; // Account for sticky header
          const elementPosition = targetSection.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });

          if (window.history && window.history.pushState) {
            window.history.pushState(null, null, '#' + secId);
          }

          highlightLink(secId);
        }
      });
    });

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // initial highlight call on load
  }

  // --- COMPONENT 4.8: FAQ ACCORDION ---
  function initFaqAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
      const trigger = item.querySelector('.faq-trigger');
      const content = item.querySelector('.faq-content');
      const chevron = item.querySelector('.faq-chevron');

      if (trigger && content) {
        trigger.addEventListener('click', (e) => {
          e.preventDefault();
          const isHidden = content.classList.contains('hidden');

          // Close all FAQ items first (accordion style)
          faqItems.forEach(otherItem => {
            const otherContent = otherItem.querySelector('.faq-content');
            const otherChevron = otherItem.querySelector('.faq-chevron');
            const otherTrigger = otherItem.querySelector('.faq-trigger');
            if (otherContent) otherContent.classList.add('hidden');
            if (otherChevron) otherChevron.classList.remove('rotate-180', 'transform');
            if (otherTrigger) otherTrigger.setAttribute('aria-expanded', 'false');
          });

          // Toggle the clicked one
          if (isHidden) {
            content.classList.remove('hidden');
            if (chevron) chevron.classList.add('rotate-180', 'transform');
            trigger.setAttribute('aria-expanded', 'true');
          }
        });
      }
    });
  }

  // --- COMPONENT 5: INTERACTIVE GIFT FINDER ENGINE ---
  function initGiftFinder() {
    const container = document.querySelector('#gift-finder-container');
    if (!container) return;

    // Local questionnaire variables
    let currentStep = 1;
    const totalSteps = 6;
    const answers = {
      recipient: '',
      ageRange: '',
      budget: '',
      interests: [],
      occasion: '',
      personalityStyle: ''
    };

    // DOM Step elements
    const stepsElements = container.querySelectorAll('.finder-step-pane');
    const progressBar = container.querySelector('#finder-progress-bar');
    const stepCountText = container.querySelector('#finder-step-count-text');
    const prevBtn = container.querySelector('#finder-prev-btn');
    const nextBtn = container.querySelector('#finder-next-btn');
    const submitBtn = container.querySelector('#finder-submit-btn');
    const questionnaireFlow = container.querySelector('#finder-questionnaire-flow');
    const resultsView = container.querySelector('#finder-results-view');

    // Go to step function with smooth fluid transitions
    let isTransitioning = false;

    function showStep(stepNum, direction = 'forward') {
      const prevStep = currentStep;
      currentStep = stepNum;

      // Update progress bar based on completed steps (e.g. step 1 = 0% completed, step 6 = 83% completed)
      if (progressBar) {
        const completedSteps = stepNum - 1;
        const percentage = Math.round((completedSteps / totalSteps) * 100);
        progressBar.style.width = `${percentage}%`;
        if (stepCountText) {
          stepCountText.innerText = `Step ${stepNum} of ${totalSteps} · ${percentage}% Complete`;
        }
      }

      // Prev Button Visibility
      if (prevBtn) {
        if (stepNum > 1) {
          prevBtn.classList.remove('invisible');
          prevBtn.classList.add('visible');
        } else {
          prevBtn.classList.remove('visible');
          prevBtn.classList.add('invisible');
        }
      }

      // Next / Submit Button Toggle
      if (nextBtn && submitBtn) {
        if (stepNum === totalSteps) {
          nextBtn.classList.add('hidden');
          submitBtn.classList.remove('hidden');
        } else {
          nextBtn.classList.remove('hidden');
          submitBtn.classList.add('hidden');
        }
      }

      // Identify currently visible pane and target pane
      let currentPane = null;
      let targetPane = null;

      stepsElements.forEach(pane => {
        const paneStep = parseInt(pane.getAttribute('data-step'));
        if (paneStep === prevStep && !pane.classList.contains('hidden')) {
          currentPane = pane;
        }
        if (paneStep === stepNum) {
          targetPane = pane;
        }
      });

      if (currentPane && targetPane && currentPane !== targetPane && direction !== 'none') {
        isTransitioning = true;
        // Smoothly fade & glide out current pane
        currentPane.style.transition = 'opacity 180ms ease-out, transform 180ms ease-out';
        currentPane.style.opacity = '0';
        currentPane.style.transform = direction === 'forward' ? 'translateY(-6px)' : 'translateY(6px)';

        setTimeout(() => {
          currentPane.classList.add('hidden');
          currentPane.style.transition = '';
          currentPane.style.opacity = '';
          currentPane.style.transform = '';

          targetPane.classList.remove('hidden');
          targetPane.style.opacity = '0';
          targetPane.style.transform = direction === 'forward' ? 'translateY(10px)' : 'translateY(-10px)';
          targetPane.style.transition = 'opacity 280ms cubic-bezier(0.16, 1, 0.3, 1), transform 280ms cubic-bezier(0.16, 1, 0.3, 1)';

          // Force reflow
          void targetPane.offsetWidth;

          requestAnimationFrame(() => {
            targetPane.style.opacity = '1';
            targetPane.style.transform = 'translateY(0)';

            // Gently ensure questionnaire card is comfortably in view if scrolled past
            if (questionnaireFlow) {
              const rect = questionnaireFlow.getBoundingClientRect();
              if (rect.top < 60) {
                window.scrollTo({ top: window.scrollY + rect.top - 80, behavior: 'smooth' });
              }
            }

            setTimeout(() => {
              targetPane.style.transition = '';
              targetPane.style.opacity = '';
              targetPane.style.transform = '';
              isTransitioning = false;
            }, 300);
          });
        }, 180);
      } else {
        // Direct initial display or forced step jump
        stepsElements.forEach(pane => {
          const paneStep = parseInt(pane.getAttribute('data-step'));
          if (paneStep === stepNum) {
            pane.classList.remove('hidden');
            pane.style.opacity = '1';
            pane.style.transform = 'translateY(0)';
          } else {
            pane.classList.add('hidden');
          }
        });
      }
    }

    // Initialize option select event listeners
    stepsElements.forEach(pane => {
      const step = parseInt(pane.getAttribute('data-step'));
      const options = pane.querySelectorAll('.finder-option-btn');

      options.forEach(opt => {
        opt.addEventListener('click', () => {
          const value = opt.getAttribute('data-value');

          if (step === 4) {
            // Multi-select for Step 4 (interests)
            if (answers.interests.includes(value)) {
              answers.interests = answers.interests.filter(i => i !== value);
              opt.classList.remove('bg-[#E8F8F1]', 'border-[#226E56]', 'text-[#154D3B]', 'font-semibold', 'ring-1', 'ring-[#226E56]');
              opt.classList.add('bg-[#FAF9F6]', 'border-stone-200');
              const checkIcon = opt.querySelector('.check-icon');
              if (checkIcon) checkIcon.classList.add('hidden');
            } else {
              answers.interests.push(value);
              opt.classList.add('bg-[#E8F8F1]', 'border-[#226E56]', 'text-[#154D3B]', 'font-semibold', 'ring-1', 'ring-[#226E56]');
              opt.classList.remove('bg-[#FAF9F6]', 'border-stone-200');
              const checkIcon = opt.querySelector('.check-icon');
              if (checkIcon) checkIcon.classList.remove('hidden');
            }
          } else {
            // Single-select for other steps
            const field = pane.getAttribute('data-field');
            answers[field] = value;

            // Highlight chosen with smooth subtle visual registration
            options.forEach(o => {
              o.classList.remove('bg-[#EEF5FF]', 'border-[#2A548E]', 'text-[#1B365D]', 'font-semibold', 'ring-1', 'ring-[#2A548E]', 'shadow-xs');
              o.classList.add('bg-[#FAF9F6]', 'border-stone-200');
            });
            opt.classList.add('bg-[#EEF5FF]', 'border-[#2A548E]', 'text-[#1B365D]', 'font-semibold', 'ring-1', 'ring-[#2A548E]', 'shadow-xs');
            opt.classList.remove('bg-[#FAF9F6]', 'border-stone-200');

            // Auto-advance with pleasant, smooth transition on single select except for the final style step
            if (step < totalSteps && step !== 4) {
              setTimeout(() => {
                showStep(currentStep + 1, 'forward');
              }, 340);
            }
          }
        });
      });
    });

    // Navigation buttons binding
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentStep > 1 && !isTransitioning) showStep(currentStep - 1, 'backward');
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (currentStep < totalSteps && !isTransitioning) showStep(currentStep + 1, 'forward');
      });
    }

    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        calculateMatches(answers);
      });
    }

    // Initial show first step
    showStep(1, 'none');

    // --- MATCHING ENGINE LOGIC ---
    function isStrictlyWithinBudget(priceNumber, budget) {
      if (!budget || budget === 'any') return true;
      switch (budget) {
        case 'under-25':
          return priceNumber <= 28;
        case '25-50':
          return priceNumber <= 50;
        case '50-100':
          return priceNumber <= 100 && priceNumber >= 35;
        case '100-plus':
          return priceNumber >= 85;
        default:
          return true;
      }
    }

    function scoreProduct(product, answers) {
      let score = 0;
      const reasons = [];

      // 1. Recipient Match (+15 points)
      if (answers.recipient) {
        const recipients = product.recipients || product.recipient || [];
        if (recipients.includes(answers.recipient)) {
          score += 15;
          reasons.push(`Highly aligned with recipient profile`);
        }
      }

      // 2. Interests Matches (+10 points per interest)
      if (answers.interests && answers.interests.length > 0) {
        const pInterests = product.interests || [];
        answers.interests.forEach(interest => {
          if (pInterests.includes(interest)) {
            score += 10;
            reasons.push(`Perfect match for their passion in ${formatInterestName(interest)}`);
          }
        });
      }

      // 3. Gift Personality Style (+8 points)
      if (answers.personalityStyle) {
        const pStyles = product.personalityStyles || [];
        if (pStyles.includes(answers.personalityStyle)) {
          score += 8;
          reasons.push(`Calibrated to ${formatStyleName(answers.personalityStyle)} preference`);
        }
      }

      // 4. Celebration Occasion (+5 points)
      if (answers.occasion) {
        const pOccasions = product.occasions || [];
        if (pOccasions.includes(answers.occasion)) {
          score += 5;
          reasons.push(`Sized perfectly for their ${formatOccasionName(answers.occasion)} celebration`);
        }
      }

      // 5. Age Suitability (+12 points)
      if (answers.ageRange && answers.ageRange !== 'any') {
        const ageRanges = product.ageRanges || [];
        if (ageRanges.includes(answers.ageRange)) {
          score += 12;
        }
      }

      // 6. Editorial Pedigree (+10 points)
      if (product.category === 'editors-pick') {
        score += 10;
      }

      return { score, reasons };
    }

    function calculateMatches(answers) {
      const allProducts = window.SOG_PRODUCTS || [];

      // Filter by strict budget constraints
      let candidatePool = allProducts;
      if (answers.budget && answers.budget !== 'any') {
        const filtered = allProducts.filter(p => isStrictlyWithinBudget(p.priceNumber, answers.budget));
        if (filtered.length > 0) candidatePool = filtered;
      }

      // Score everything
      const scoredItems = candidatePool.map(p => {
        const { score, reasons } = scoreProduct(p, answers);
        return { product: p, score, matchReasons: reasons };
      });

      // Sort scored items (highest score first)
      scoredItems.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (a.product.category === 'editors-pick' && b.product.category !== 'editors-pick') return -1;
        if (b.product.category === 'editors-pick' && a.product.category !== 'editors-pick') return 1;
        return 0;
      });

      // Complete progress bar to 100% on submission
      if (progressBar) progressBar.style.width = '100%';
      if (stepCountText) stepCountText.innerText = `Step ${totalSteps} of ${totalSteps} · 100% Complete`;

      // Transition smoothly to loading/thinking screen in resultsView
      if (questionnaireFlow && resultsView) {
        questionnaireFlow.style.transition = 'opacity 220ms ease-out, transform 220ms ease-out';
        questionnaireFlow.style.opacity = '0';
        questionnaireFlow.style.transform = 'translateY(-8px)';
        
        setTimeout(() => {
          questionnaireFlow.classList.add('hidden');
          questionnaireFlow.style.transition = '';
          questionnaireFlow.style.opacity = '';
          questionnaireFlow.style.transform = '';

          resultsView.classList.remove('hidden');
          resultsView.style.opacity = '0';
          resultsView.style.transform = 'translateY(10px)';
          resultsView.style.transition = 'opacity 300ms cubic-bezier(0.16, 1, 0.3, 1), transform 300ms cubic-bezier(0.16, 1, 0.3, 1)';
          
          resultsView.innerHTML = `
            <div id="finder-loading-state" class="bg-white border border-[#99BFF9]/35 p-12 text-center space-y-6 shadow-sm flex flex-col items-center justify-center min-h-[350px]">
              <div class="relative w-16 h-16 flex items-center justify-center">
                <div class="absolute inset-0 rounded-full border-4 border-[#2A548E]/10"></div>
                <div class="absolute inset-0 rounded-full border-4 border-[#2A548E] border-t-transparent animate-spin"></div>
              </div>
              <div class="space-y-2 max-w-sm mx-auto">
                <h3 class="font-serif-display text-lg sm:text-xl text-[#1E232B] font-medium">Analyzing Curatorial Matches</h3>
                <p id="finder-loading-text" class="text-xs sm:text-sm text-[#5A6270] font-mono-code leading-relaxed animate-pulse">Calibrating recipient profile...</p>
              </div>
            </div>
          `;

          void resultsView.offsetWidth;
          requestAnimationFrame(() => {
            resultsView.style.opacity = '1';
            resultsView.style.transform = 'translateY(0)';
          });

          window.scrollTo({ top: 0, behavior: 'smooth' });

          const loadingText = resultsView.querySelector('#finder-loading-text');

          // Stage 2: 600ms
          setTimeout(() => {
            if (loadingText) loadingText.innerText = "Evaluating material history and provenance...";
          }, 600);

          // Stage 3: 1200ms
          setTimeout(() => {
            if (loadingText) loadingText.innerText = "Filtering price ceilings and curation indexes...";
          }, 1200);

          // Stage 4: Render results at 1800ms
          setTimeout(() => {
            if (scoredItems.length === 0) {
              renderEmptyResults();
            } else {
              const bestMatch = scoredItems[0];
              const alsoConsider = scoredItems.slice(1, 4);
              const moreIdeas = scoredItems.slice(4, 8);
              renderResultsView(bestMatch, alsoConsider, moreIdeas, answers);
            }
          }, 1800);
        }, 220);
      }
    }

    function renderEmptyResults() {
      if (questionnaireFlow && resultsView) {
        questionnaireFlow.classList.add('hidden');
        resultsView.classList.remove('hidden');
        resultsView.innerHTML = `
          <div class="bg-white border border-[#99BFF9]/35 p-12 text-center space-y-4 shadow-sm">
            <h2 class="font-serif-display text-2xl text-[#1E232B]">No exact matches found for your budget</h2>
            <p class="text-sm text-[#5A6270]">We strictly protected your price ceiling, but our catalog doesn't have matching objects in that exact bracket. Please try adjusting your answers or start over.</p>
            <button id="finder-restart-btn-empty" class="px-6 py-2.5 bg-[#2A548E] text-white text-xs font-semibold uppercase tracking-wider rounded">Start Over</button>
          </div>
        `;
        document.querySelector('#finder-restart-btn-empty').onclick = restartFinder;
      }
    }

    function renderResultsView(best, also, more, answers) {
      questionnaireFlow.classList.add('hidden');
      resultsView.classList.remove('hidden');
      resultsView.style.opacity = '0';
      resultsView.style.transform = 'translateY(10px)';
      resultsView.style.transition = 'opacity 320ms cubic-bezier(0.16, 1, 0.3, 1), transform 320ms cubic-bezier(0.16, 1, 0.3, 1)';

      // Update header titles
      const resultsHeader = document.querySelector('#finder-results-header');
      if (resultsHeader) {
        resultsHeader.innerHTML = `
          <div class="text-center w-full flex flex-col items-center">
            <div class="inline-flex items-center gap-1.5 px-3 py-1 bg-[#E8F8F1] border border-[#226E56]/30 text-[#154D3B] text-xs font-semibold uppercase tracking-wider rounded-full mb-3 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sparkles w-3.5 h-3.5 text-[#226E56]"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z"></path></svg>
              <span>Editorial Gift Matching Engine</span>
            </div>
            <h1 class="font-serif-display text-3xl sm:text-4xl lg:text-5xl text-[#1E232B] font-normal leading-tight text-balance text-center mx-auto">Your Curated Gift Matches</h1>
            <p class="text-base sm:text-lg text-[#5A6270] leading-relaxed max-w-2xl mx-auto mt-2 text-center">Based on your recipient profile, here are the objects in our catalog with the strongest alignment for utility, craftsmanship, and narrative depth.</p>
          </div>
        `;
      }

      // Generate HTML content for results
      let html = `
        <div class="space-y-12">
          <!-- Active Filters & Reset Summary Bar -->
          <div class="bg-white border border-[#99BFF9]/35 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 text-xs shadow-2xs">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-[#5A6270] font-medium flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5 text-[#2A548E]"><path d="M20 7h-9"></path><path d="M14 17H5"></path><circle cx="17" cy="17" r="3"></circle><circle cx="7" cy="7" r="3"></circle></svg>
                <span>Filters:</span>
              </span>
              ${answers.recipient ? `<span class="px-2.5 py-1 bg-[#EEF5FF] text-[#2A548E] rounded border border-[#99BFF9]/30 font-medium">For: ${formatRecipientName(answers.recipient)}</span>` : ''}
              ${answers.budget ? `<span class="px-2.5 py-1 bg-[#EEF5FF] text-[#2A548E] rounded border border-[#99BFF9]/30 font-medium">Budget: ${getBudgetLabel(answers.budget)}</span>` : ''}
              ${answers.interests.length > 0 ? `<span class="px-2.5 py-1 bg-[#E8F8F1] text-[#154D3B] rounded border border-[#226E56]/30 font-medium">Interests: ${answers.interests.map(formatInterestName).join(', ')}</span>` : ''}
              ${answers.occasion ? `<span class="px-2.5 py-1 bg-[#FAF9F6] text-[#5A6270] rounded border border-stone-200">Occasion: ${formatOccasionName(answers.occasion)}</span>` : ''}
              ${answers.personalityStyle ? `<span class="px-2.5 py-1 bg-[#FAF9F6] text-[#5A6270] rounded border border-stone-200">Style: ${formatStyleName(answers.personalityStyle)}</span>` : ''}
            </div>
            
            <div class="flex items-center gap-2.5">
              <button id="finder-adjust-btn" class="px-3 py-1.5 border border-[#2A548E] text-[#2A548E] hover:bg-[#EEF5FF] rounded cursor-pointer font-medium flex items-center gap-1.5">Adjust Answers</button>
              <button id="finder-restart-btn" class="px-3.5 py-1.5 bg-[#2A548E] hover:bg-[#1B365D] text-white rounded cursor-pointer font-medium flex items-center gap-1.5 shadow-2xs">Start Over</button>
            </div>
          </div>

          <!-- Hero Best Match Card -->
          <section class="space-y-4">
            <div class="flex items-center justify-between border-b border-[#99BFF9]/30 pb-2">
              <div>
                <span class="text-xs uppercase tracking-widest text-[#226E56] font-semibold">Top Editorial Match</span>
                <h2 class="font-serif-display text-2xl sm:text-3xl text-[#1E232B] font-normal">Best Recommendation</h2>
              </div>
              <span class="font-mono-code text-xl font-bold text-[#154D3B]">${best.product.price}</span>
            </div>

            <div class="bg-white border-2 border-[#C3F3DF] p-6 sm:p-8 space-y-6 shadow-xs">
              <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div class="md:col-span-5">
                  ${renderEditorialImage(best.product.image || best.product.imageType || best.product.id, best.product.title, false, 'aspect-[4/3]')}
                </div>
                <div class="md:col-span-7 space-y-3">
                  <div class="text-xs font-semibold text-[#226E56] uppercase tracking-wider flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z"></path></svg>
                    <span>Best Match for Your Selections</span>
                  </div>
                  <h3 class="font-serif-display text-2xl text-[#1E232B] font-normal leading-snug">${best.product.title}</h3>
                  ${(best.product.tagline || best.product.editorialReview || best.product.description) ? `<p class="text-xs sm:text-sm text-[#5A6270] italic">${best.product.tagline || best.product.editorialReview || best.product.description}</p>` : ''}

                  <div class="pt-3 flex flex-wrap items-center gap-3">
                    <a href="${best.product.vendorUrl}" ${getVendorRelAttr(best.product.vendor, best.product.vendorUrl)} class="px-5 py-2.5 bg-white text-black border border-black hover:opacity-80 transition-opacity duration-200 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-2xs rounded-none">
                      View on ${best.product.vendor.split(',')[0]} <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5"><path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg>
                    </a>
                    <button class="toggle-finder-result-save px-3 py-2.5 border text-xs font-medium transition-colors inline-flex items-center gap-1.5 rounded cursor-pointer" data-id="${best.product.id}">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></svg>
                      <span class="save-label">Save</span>
                    </button>
                  </div>
                </div>
              </div>

              ${best.matchReasons.length > 0 ? `
                <div class="p-4 bg-[#EEF5FF]/80 border-l-4 border-[#2A548E] space-y-1.5 text-xs">
                  <strong class="text-[#1B365D] block uppercase tracking-wider">Why this matches your criteria:</strong>
                  <ul class="space-y-1 text-[#2A548E]">
                    ${best.matchReasons.map(reason => `<li class="flex items-center gap-1.5">✓ <span>${reason}</span></li>`).join('')}
                  </ul>
                </div>
              ` : ''}

              <div class="pt-2 border-t border-stone-200 space-y-3 text-sm text-[#1E232B] leading-relaxed">
                <p>${best.product.editorialReview}</p>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                <div class="p-3 bg-[#FAF9F6] border border-[#99BFF9]/20">
                  <strong class="text-[#2A548E] block mb-1">Why it makes a great gift:</strong>
                  <p class="text-[#5A6270]">${best.product.whyItMakesAGreatGift}</p>
                </div>
                <div class="p-3 bg-[#FAF9F6] border border-[#99BFF9]/20">
                  <strong class="text-[#226E56] block mb-1">Ideal for:</strong>
                  <p class="text-[#5A6270]">${best.product.idealFor}</p>
                </div>
              </div>
            </div>
          </section>

          <!-- Also Consider Grid -->
          ${also.length > 0 ? `
            <section class="space-y-6">
              <div class="border-b border-[#99BFF9]/30 pb-2">
                <span class="text-xs uppercase tracking-widest text-[#2A548E] font-semibold">Strong Contenders</span>
                <h2 class="font-serif-display text-2xl sm:text-3xl text-[#1E232B] font-normal">Also Consider</h2>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                ${also.map(item => `
                  <div class="bg-white border border-[#99BFF9]/25 p-5 flex flex-col justify-between space-y-4">
                    <div class="space-y-3">
                      ${renderEditorialImage(item.product.image || item.product.imageType || item.product.id, item.product.title, true, 'aspect-[4/3]')}
                      <div class="flex items-center justify-between text-xs">
                        <span class="font-mono-code font-bold text-[#154D3B]">${item.product.price}</span>
                        <button class="toggle-finder-result-save text-[#5A6270] hover:text-[#2A548E] p-1 cursor-pointer" data-id="${item.product.id}">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></svg>
                        </button>
                      </div>
                      <h3 class="font-serif-display text-lg text-[#1E232B] font-normal leading-snug">${item.product.title}</h3>
                      ${(item.product.tagline || item.product.editorialReview || item.product.description) ? `<p class="text-xs text-[#5A6270] leading-relaxed line-clamp-3">${item.product.tagline || item.product.editorialReview || item.product.description}</p>` : ''}
                    </div>
                    <div class="pt-3 border-t border-[#99BFF9]/20">
                      <a href="${item.product.vendorUrl}" ${getVendorRelAttr(item.product.vendor, item.product.vendorUrl)} class="text-xs text-[#2A548E] font-semibold hover:underline flex items-center justify-between">
                        <span>View on ${item.product.vendor.split(',')[0]}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3"><path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg>
                      </a>
                    </div>
                  </div>
                `).join('')}
              </div>
            </section>
          ` : ''}

          <!-- More Ideas list -->
          ${more.length > 0 ? `
            <section class="space-y-6 pt-6 border-t border-[#99BFF9]/30">
              <div class="border-b border-[#99BFF9]/25 pb-2">
                <span class="text-xs uppercase tracking-widest text-[#5A6270] font-semibold">Broaden the Search</span>
                <h2 class="font-serif-display text-2xl text-[#1E232B] font-normal">More Ideas from Our Catalog</h2>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                ${more.map(item => {
                  const rawImg = item.product.image || item.product.imageType || item.product.id;
                  const { webp, fallback } = getOptimizedImageSources(rawImg, true);
                  return `
                  <div class="p-4 bg-white border border-[#99BFF9]/25 flex items-center justify-between gap-3 min-w-0 rounded-xs hover:border-[#99BFF9]/60 transition-colors">
                    <div class="flex items-center gap-3 min-w-0 flex-1">
                      <a href="${item.product.vendorUrl}" ${getVendorRelAttr(item.product.vendor, item.product.vendorUrl)} class="w-14 h-14 shrink-0 bg-[#FAF9F6] border border-[#99BFF9]/30 rounded-sm overflow-hidden block hover:opacity-85 transition-opacity" title="View ${item.product.title}">
                        <img
                          src="${webp}"
                          data-fallback="${fallback}"
                          alt="${item.product.title}"
                          class="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                          onerror="this.onerror=null; this.src=this.dataset.fallback;"
                        >
                      </a>
                      <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-1.5 text-xs min-w-0">
                          <span class="font-mono-code font-bold text-[#154D3B] shrink-0">${item.product.price}</span>
                          <span class="text-[#5A6270] truncate">· ${item.product.vendor ? item.product.vendor.split(',')[0] : ''}</span>
                        </div>
                        <a href="${item.product.vendorUrl}" ${getVendorRelAttr(item.product.vendor, item.product.vendorUrl)} class="font-serif-display text-sm sm:text-base text-[#1E232B] font-medium leading-tight mt-0.5 hover:text-[#2A548E] hover:underline line-clamp-1 block" title="View ${item.product.title}">
                          ${item.product.title}
                        </a>
                        ${(item.product.tagline || item.product.editorialReview || item.product.description) ? `<p class="text-xs text-[#5A6270] line-clamp-1 mt-0.5">${item.product.tagline || item.product.editorialReview || item.product.description}</p>` : ''}
                      </div>
                    </div>
                    <div class="flex items-center gap-1 shrink-0 ml-1">
                      <a href="${item.product.vendorUrl}" ${getVendorRelAttr(item.product.vendor, item.product.vendorUrl)} class="p-2 text-[#2A548E] hover:bg-[#EEF5FF] rounded transition-colors" title="External product link">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg>
                      </a>
                      <button class="toggle-finder-result-save p-2 text-[#5A6270] hover:text-[#2A548E] hover:bg-[#EEF5FF] rounded transition-colors cursor-pointer" data-id="${item.product.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></svg>
                      </button>
                    </div>
                  </div>
                `}).join('')}
              </div>
            </section>
          ` : ''}

          <!-- Restart Callout -->
          <div class="bg-[#FAF9F6] border border-[#99BFF9]/40 p-6 sm:p-8 text-center space-y-4 rounded-xs">
            <div class="w-10 h-10 rounded-full bg-[#EEF5FF] text-[#2A548E] mx-auto flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M16 3h5v5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M8 21H3v-5"></path></svg>
            </div>
            <div>
              <h3 class="font-serif-display text-xl sm:text-2xl text-[#1E232B]">Looking for a different recipient or occasion?</h3>
              <p class="text-xs sm:text-sm text-[#5A6270] max-w-md mx-auto">Start fresh to find recommendations for someone else, or adjust your current filter criteria.</p>
            </div>
            <div class="pt-2">
              <button id="finder-restart-btn-bottom" class="px-6 py-2.5 bg-[#2A548E] hover:bg-[#1B365D] text-white text-xs font-semibold uppercase tracking-wider rounded transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs">
                <span>Start Over</span>
              </button>
            </div>
          </div>
        </div>
      `;

      resultsView.innerHTML = html;

      void resultsView.offsetWidth;
      requestAnimationFrame(() => {
        resultsView.style.opacity = '1';
        resultsView.style.transform = 'translateY(0)';
        setTimeout(() => {
          resultsView.style.transition = '';
          resultsView.style.opacity = '';
          resultsView.style.transform = '';
        }, 340);
      });

      // Initialize results save click hooks
      const saveButtons = resultsView.querySelectorAll('.toggle-finder-result-save');
      saveButtons.forEach(btn => {
        const id = btn.getAttribute('data-id');
        updateSaveBtnVisual(btn, id);
        btn.addEventListener('click', () => {
          const prod = window.SOG_PRODUCTS?.find(item => item.id === id);
          if (prod) {
            toggleSaveProduct(prod);
            updateSaveBtnVisual(btn, id);
          }
        });
      });

      // Bind Adjust / Restart Actions
      document.querySelector('#finder-adjust-btn').onclick = () => {
        resultsView.style.transition = 'opacity 200ms ease-out';
        resultsView.style.opacity = '0';
        setTimeout(() => {
          resultsView.classList.add('hidden');
          resultsView.style.transition = '';
          resultsView.style.opacity = '';
          questionnaireFlow.classList.remove('hidden');
          showStep(totalSteps, 'none');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 200);
      };

      document.querySelector('#finder-restart-btn').onclick = restartFinder;
      document.querySelector('#finder-restart-btn-bottom').onclick = restartFinder;
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function restartFinder() {
      // Clear answers state
      answers.recipient = '';
      answers.ageRange = '';
      answers.budget = '';
      answers.interests = [];
      answers.occasion = '';
      answers.personalityStyle = '';

      // Reset DOM visual highlights
      const options = container.querySelectorAll('.finder-option-btn');
      options.forEach(o => {
        o.classList.remove('bg-[#EEF5FF]', 'border-[#2A548E]', 'text-[#1B365D]', 'font-semibold', 'ring-1', 'ring-[#2A548E]', 'bg-[#E8F8F1]', 'border-[#226E56]', 'text-[#154D3B]');
        o.classList.add('bg-[#FAF9F6]', 'border-stone-200');
        const checkIcon = o.querySelector('.check-icon');
        if (checkIcon) checkIcon.classList.add('hidden');
      });

      resultsView.style.transition = 'opacity 200ms ease-out';
      resultsView.style.opacity = '0';
      setTimeout(() => {
        resultsView.classList.add('hidden');
        resultsView.style.transition = '';
        resultsView.style.opacity = '';
        questionnaireFlow.classList.remove('hidden');
        showStep(1, 'none');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 200);
    }

    function updateSaveBtnVisual(btn, id) {
      const isSaved = getSavedItems().some(item => item.id === id);
      const svg = btn.querySelector('svg');
      const label = btn.querySelector('.save-label');

      if (label) label.textContent = isSaved ? 'Saved' : 'Save';
      if (svg) {
        if (isSaved) {
          svg.setAttribute('fill', '#226E56');
          svg.setAttribute('stroke', '#226E56');
          btn.classList.add('bg-[#E8F8F1]', 'border-[#226E56]', 'text-[#154D3B]');
          btn.classList.remove('border-[#99BFF9]/40', 'text-[#5A6270]');
        } else {
          svg.setAttribute('fill', 'none');
          svg.setAttribute('stroke', 'currentColor');
          btn.classList.remove('bg-[#E8F8F1]', 'border-[#226E56]', 'text-[#154D3B]');
          btn.classList.add('border-[#99BFF9]/40', 'text-[#5A6270]');
        }
      }
    }
  }

  // --- COMPONENT 6: PRODUCT CREATOR STUDIO ---
  function initProductStudio() {
    const container = document.querySelector('#studio-container') || document.querySelector('#product-studio-content');
    if (!container) return;

    // Track state of Visual Form
    const productState = {
      id: '',
      title: '',
      tagline: '',
      price: '$45',
      priceNumber: 45,
      priceRange: '25-50',
      vendor: 'Independent Atelier',
      vendorUrl: 'https://example.com',
      category: 'quick-pick',
      badgeLabel: 'Editor’s Selection',
      imageType: 'brass-compass',
      editorialReview: 'Engineered with exceptional tactile balance and durable materials tested for everyday use.',
      whyItMakesAGreatGift: 'Delivers an immediate sense of craft quality without feeling delicate or disposable.',
      idealFor: 'Enthusiasts who value provenance, material weight, and honest design.',
      whatMakesItStandOut: 'Machined from solid brass with natural finish.',
      thingsToConsider: 'Best maintained with occasional soft cloth polishing.',
      recipients: ['friend', 'partner', 'parent', 'teacher'],
      interests: ['history', 'science', 'curiosities'],
      occasions: ['birthday', 'holidays', 'thank-you'],
      personalityStyles: ['thoughtful', 'practical']
    };

    // DOM bindings
    const inputs = {
      title: container.querySelector('input[placeholder*="Desk Page Anchor"]'),
      tagline: container.querySelector('input[placeholder*="400g brass arc"]'),
      price: container.querySelector('input[placeholder*="$55"]'),
      category: container.querySelector('select'),
      vendor: container.querySelector('input[placeholder*="Craighill Studio"]'),
      vendorUrl: container.querySelector('input[placeholder*="https://"]'),
      imageType: container.querySelector('select:nth-of-type(2)') || container.querySelector('#editorial-photo-style-select'),
      editorialReview: container.querySelector('textarea[placeholder*="Describe the materials"]'),
      whyItMakesAGreatGift: container.querySelector('textarea[placeholder*="Emotional or practical"]'),
      idealFor: container.querySelector('textarea[placeholder*="Specific types"]'),
    };

    const previews = {
      title: container.querySelector('h3.font-serif-display'),
      tagline: container.querySelector('p.italic'),
      priceBadge: container.querySelector('.font-mono-code.font-bold'),
      priceTop: container.querySelector('.sticky span.text-xs.font-mono-code'),
      vendor: container.querySelector('.uppercase.tracking-wider'),
      editorialReview: container.querySelector('.leading-relaxed.pt-2'),
      whyItMakesAGreatGift: container.querySelector('.bg-\\[\\#FAF9F6\\] span'),
      idealFor: container.querySelector('.grid div:nth-child(2) span'),
      imageContainer: container.querySelector('.sticky .editorial-image-placeholder-parent') || container.querySelector('.sticky svg')
    };

    // Update real-time preview card
    function updatePreview() {
      if (previews.title) previews.title.innerText = productState.title || 'Untitled Product';
      if (previews.tagline) previews.tagline.innerText = productState.tagline || 'Tagline here...';
      if (previews.priceBadge) previews.priceBadge.innerText = productState.price;
      if (previews.priceTop) previews.priceTop.innerText = productState.price;
      if (previews.vendor) previews.vendor.innerText = productState.vendor;
      if (previews.editorialReview) previews.editorialReview.innerText = productState.editorialReview;
      if (previews.whyItMakesAGreatGift) previews.whyItMakesAGreatGift.innerText = productState.whyItMakesAGreatGift;
      if (previews.idealFor) previews.idealFor.innerText = productState.idealFor;

      // Update Preview Image Svg dynamically
      if (previews.imageContainer) {
        const pNode = previews.imageContainer.parentNode;
        if (pNode) {
          const newSvgHtml = renderEditorialImageSvg(productState.imageType);
          pNode.innerHTML = newSvgHtml;
          previews.imageContainer = pNode.querySelector('svg');
        }
      }

      // Update visual tags container
      const finderAlignContainer = container.querySelector('.sticky div.flex-wrap');
      if (finderAlignContainer) {
        finderAlignContainer.innerHTML = `
          ${productState.interests.map(i => `<span class="px-2 py-0.5 bg-[#E8F8F1] text-[#154D3B] rounded text-[11px]">#${i}</span>`).join('')}
          ${productState.recipients.map(r => `<span class="px-2 py-0.5 bg-[#EEF5FF] text-[#2A548E] rounded text-[11px]">for:${r}</span>`).join('')}
          ${productState.personalityStyles.map(s => `<span class="px-2 py-0.5 bg-white border border-stone-200 text-[#5A6270] rounded text-[11px]">style:${s}</span>`).join('')}
        `;
      }
    }

    // Attach form input listeners
    if (inputs.title) {
      inputs.title.addEventListener('input', (e) => {
        productState.title = e.target.value;
        productState.id = productState.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const idBadge = container.querySelector('.font-mono-code.text-xs');
        if (idBadge) idBadge.innerText = `ID: ${productState.id || 'auto-generated'}`;
        updatePreview();
      });
    }

    if (inputs.tagline) {
      inputs.tagline.addEventListener('input', (e) => { productState.tagline = e.target.value; updatePreview(); });
    }

    if (inputs.price) {
      inputs.price.addEventListener('input', (e) => {
        let val = e.target.value;
        const num = parseInt(val.replace(/[^0-9]/g, '')) || 0;
        productState.price = val.startsWith('$') ? val : `$${val}`;
        productState.priceNumber = num;
        productState.priceRange = num <= 25 ? 'under-25' : num <= 50 ? '25-50' : num <= 100 ? '50-100' : '100-plus';
        
        const tierBadge = container.querySelector('span.mt-0\\.5');
        if (tierBadge) tierBadge.innerText = `Auto-tier: ${productState.priceRange}`;
        updatePreview();
      });
    }

    if (inputs.vendor) {
      inputs.vendor.addEventListener('input', (e) => { productState.vendor = e.target.value; updatePreview(); });
    }

    if (inputs.vendorUrl) {
      inputs.vendorUrl.addEventListener('input', (e) => { productState.vendorUrl = e.target.value; updatePreview(); });
    }

    if (inputs.editorialReview) {
      inputs.editorialReview.addEventListener('input', (e) => { productState.editorialReview = e.target.value; updatePreview(); });
    }

    if (inputs.whyItMakesAGreatGift) {
      inputs.whyItMakesAGreatGift.addEventListener('input', (e) => { productState.whyItMakesAGreatGift = e.target.value; updatePreview(); });
    }

    if (inputs.idealFor) {
      inputs.idealFor.addEventListener('input', (e) => { productState.idealFor = e.target.value; updatePreview(); });
    }

    // Capture selectors
    const selectElements = container.querySelectorAll('select');
    selectElements.forEach((sel, sIdx) => {
      sel.addEventListener('change', () => {
        if (sIdx === 0) {
          productState.category = sel.value;
        } else {
          productState.imageType = sel.value;
        }
        updatePreview();
      });
    });

    // Interest/Recipient/Style Button toggles
    const filterBtns = container.querySelectorAll('.p-6 .flex-wrap button');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.innerText.toLowerCase().replace(/ & /g, '-').replace(/\//g, '-').replace(/[^a-z0-9]+/g, '-');
        
        // We will classify based on button coloring
        const isInterest = btn.closest('div').previousElementSibling.innerText.includes('PASSIONS');
        const isRecipient = btn.closest('div').previousElementSibling.innerText.includes('RECIPIENTS');
        const isStyle = btn.closest('div').previousElementSibling.innerText.includes('PERSONALITY');

        let targetArray = isInterest ? productState.interests : isRecipient ? productState.recipients : productState.personalityStyles;
        const index = targetArray.indexOf(item);

        if (index > -1) {
          targetArray.splice(index, 1);
          btn.classList.remove('bg-[#E8F8F1]', 'border-[#226E56]', 'text-[#154D3B]', 'bg-[#EEF5FF]', 'border-[#2A548E]', 'text-[#1B365D]', 'font-semibold');
          btn.classList.add('bg-[#FAF9F6]', 'border-stone-200');
        } else {
          targetArray.push(item);
          if (isInterest) {
            btn.classList.add('bg-[#E8F8F1]', 'border-[#226E56]', 'text-[#154D3B]', 'font-semibold');
          } else {
            btn.classList.add('bg-[#EEF5FF]', 'border-[#2A548E]', 'text-[#1B365D]', 'font-semibold');
          }
          btn.classList.remove('bg-[#FAF9F6]', 'border-stone-200');
        }
        updatePreview();
      });
    });

    // Save visual custom product
    const saveStudioBtn = container.querySelector('button.bg-\\[\\#226E56\\]');
    if (saveStudioBtn) {
      saveStudioBtn.addEventListener('click', () => {
        try {
          const customProds = getCustomProducts();
          const filtered = customProds.filter(p => p.id !== productState.id);
          filtered.unshift(productState);
          localStorage.setItem('sog_custom_products', JSON.stringify(filtered));
          
          saveStudioBtn.innerHTML = '✓ Saved to Live Catalog!';
          saveStudioBtn.classList.remove('bg-[#226E56]');
          saveStudioBtn.classList.add('bg-[#154D3B]');
          
          setTimeout(() => {
            saveStudioBtn.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
              <span>Save to Live Catalog</span>
            `;
            saveStudioBtn.classList.remove('bg-[#154D3B]');
            saveStudioBtn.classList.add('bg-[#226E56]');
          }, 2000);
        } catch (err) {
          console.error(err);
        }
      });
    }

    // Generate/Copy Markdown
    const copyMdBtn = container.querySelector('button.border-\\[\\#2A548E\\]');
    if (copyMdBtn) {
      copyMdBtn.addEventListener('click', () => {
        const md = generateProductMarkdown(productState);
        navigator.clipboard?.writeText(md).then(() => {
          copyMdBtn.innerHTML = '✓ Markdown Copied!';
          setTimeout(() => {
            copyMdBtn.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              <span>Copy Markdown</span>
            `;
          }, 2000);
        });
      });
    }

    // Download Markdown file
    const downloadMdBtn = container.querySelector('button[title*="Download"]');
    if (downloadMdBtn) {
      downloadMdBtn.addEventListener('click', () => {
        const md = generateProductMarkdown(productState);
        const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${productState.id || 'product'}.md`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      });
    }

    function getCustomProducts() {
      try {
        const raw = localStorage.getItem('sog_custom_products');
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    }

    function generateProductMarkdown(p) {
      const lines = [
        '---',
        `id: "${p.id}"`,
        `title: "${p.title}"`,
        `tagline: "${p.tagline}"`,
        `price: "${p.price}"`,
        `priceNumber: ${p.priceNumber}`,
        `priceRange: "${p.priceRange}"`,
        `vendor: "${p.vendor}"`,
        `vendorUrl: "${p.vendorUrl}"`,
        `category: "${p.category}"`,
        `imageType: "${p.imageType}"`,
        `recipient: ${JSON.stringify(p.recipients)}`,
        `interests: ${JSON.stringify(p.interests)}`,
        `personalityStyles: ${JSON.stringify(p.personalityStyles)}`,
        `editorialReview: "${p.editorialReview}"`,
        `whyItMakesAGreatGift: "${p.whyItMakesAGreatGift}"`,
        `idealFor: "${p.idealFor}"`,
        '---'
      ];
      return lines.join('\n');
    }

    // Update initial preview cards on load
    updatePreview();
  }

  // --- REPRODUCE EDITORIAL IMAGE ASSETS ON CLIENT ---
  function getOptimizedImageSources(input, isThumb = false) {
    if (!input || input === 'default') {
      input = 'brass-book-weight';
    }

    if (input.startsWith('http://') || input.startsWith('https://')) {
      return { webp: input, fallback: input };
    }

    let dir = '/assets/';
    let clean = input.trim();

    if (clean.startsWith('/')) {
      const lastSlash = clean.lastIndexOf('/');
      dir = clean.substring(0, lastSlash + 1);
      clean = clean.substring(lastSlash + 1);
    } else if (clean.includes('/')) {
      const lastSlash = clean.lastIndexOf('/');
      dir = '/' + clean.substring(0, lastSlash + 1);
      clean = clean.substring(lastSlash + 1);
    }

    let ext = '.jpg';
    let baseName = clean;
    const match = clean.match(/\.(webp|jpg|jpeg|png|svg)$/i);
    if (match) {
      ext = match[0].toLowerCase();
      baseName = clean.substring(0, clean.length - ext.length);
    }

    const thumbSuffix = isThumb && !baseName.endsWith('-thumb') ? '-thumb' : '';
    const webpSrc = `${dir}${baseName}${thumbSuffix}.webp`;
    const fallbackSrc = `${dir}${baseName}${ext === '.webp' ? '.jpg' : ext}`;

    return { webp: webpSrc, fallback: fallbackSrc };
  }

  function renderEditorialImage(type, alt = 'Science of Gifts Curated Item', isThumb = false, aspectClass = 'aspect-[4/3]') {
    const { webp, fallback } = getOptimizedImageSources(type, isThumb);

    return `
      <div class="relative overflow-hidden bg-[#FAF9F6] border border-[#99BFF9]/30 rounded-sm ${aspectClass} shadow-sm" role="img" aria-label="${alt}">
        <img
          src="${webp}"
          data-fallback="${fallback}"
          alt="${alt}"
          class="w-full h-full object-cover transition-opacity duration-300"
          loading="lazy"
          decoding="async"
          onerror="this.onerror=null; this.src=this.dataset.fallback;"
        >
      </div>
    `;
  }

  function renderEditorialImageSvg(type, alt = 'Science of Gifts Curated Item', isThumb = false, aspectClass = 'aspect-[4/3]') {
    return renderEditorialImage(type, alt, isThumb, aspectClass);
  }

  // --- GENERAL TERM MAPPERS FOR STRINGS ---
  function formatInterestName(key) {
    switch (key) {
      case 'history': return 'History';
      case 'books': return 'Books';
      case 'science': return 'Science & Astronomy';
      case 'travel': return 'Travel & Cartography';
      case 'food-drink': return 'Food & Gourmet';
      case 'cooking': return 'Culinary Arts';
      case 'art-design': return 'Art & Design';
      case 'curiosities': return 'Tactile Curiosities';
      case 'stationery': return 'Stationery & Writing';
      case 'philosophy': return 'Philosophy & Ideas';
      default: return key.charAt(0).toUpperCase() + key.slice(1);
    }
  }

  function formatRecipientName(key) {
    switch (key) {
      case 'partner': return 'Partner';
      case 'friend': return 'Friend';
      case 'parent': return 'Parent';
      case 'sibling': return 'Sibling';
      case 'coworker': return 'Colleague';
      case 'teacher': return 'Teacher / Mentor';
      default: return 'Recipient';
    }
  }

  function formatOccasionName(key) {
    switch (key) {
      case 'birthday': return 'Birthday';
      case 'holidays': return 'Holidays';
      case 'anniversary': return 'Anniversary';
      case 'graduation': return 'Graduation';
      case 'parents-day': return "Mother's / Father's Day";
      case 'thank-you': return 'Thank You';
      case 'just-because': return 'Just Because';
      default: return 'Celebration';
    }
  }

  function formatStyleName(key) {
    switch (key) {
      case 'heirloom': return 'Heirloom & Timeless';
      case 'practical': return 'Practical Everyday Upgrade';
      case 'unusual': return 'Conversational & Unusual';
      case 'scholarly': return 'Scholarly & Archival';
      case 'indulgent': return 'Sensual & Indulgent';
      case 'compact': return 'Compact & Minimalist';
      default: return key;
    }
  }

  function getBudgetLabel(budgetKey) {
    switch (budgetKey) {
      case 'under-25': return 'Under $25';
      case '25-50': return '$25–$50';
      case '50-100': return '$50–$100';
      case '100-plus': return '$100+';
      default: return 'Any Budget';
    }
  }
});
