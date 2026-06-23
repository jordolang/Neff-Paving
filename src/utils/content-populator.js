/**
 * Content Populator - Loads CMS content from JSON and updates DOM
 */

export class ContentPopulator {
  constructor() {
    this.content = {
      homepage: null,
      services: null,
      gallery: null
    };
  }

  /**
   * Load all content from JSON files
   */
  async loadContent() {
    try {
      const [homepage, services, gallery] = await Promise.all([
        fetch('/content/homepage.json').then(r => r.json()),
        fetch('/content/services.json').then(r => r.json()),
        fetch('/content/gallery.json').then(r => r.json())
      ]);

      this.content.homepage = homepage;
      this.content.services = services;
      this.content.gallery = gallery;

      return this.content;
    } catch (error) {
      console.error('Failed to load content:', error);
      throw error;
    }
  }

  /**
   * Populate all dynamic content on the page
   */
  async populate() {
    await this.loadContent();

    this.populateHero();
    this.populateStats();
    this.populateIntroduction();

    console.log('✅ Dynamic content loaded successfully');
  }

  /**
   * Populate hero section
   */
  populateHero() {
    const { hero } = this.content.homepage;
    if (!hero) return;

    // Update hero badge
    const heroBadge = document.querySelector('.hero-badge');
    if (heroBadge) heroBadge.textContent = hero.badge;

    // Update hero eyebrow
    const heroEyebrow = document.querySelector('.hero-eyebrow');
    if (heroEyebrow) heroEyebrow.textContent = hero.eyebrow;

    // Update hero title
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) heroTitle.innerHTML = hero.title;

    // Update hero subtitle
    const heroSubtitle = document.querySelector('.hero-subtitle');
    if (heroSubtitle) heroSubtitle.innerHTML = hero.subtitle;

    // Update hero motto
    const heroMotto = document.querySelector('.hero-motto');
    if (heroMotto) heroMotto.textContent = hero.motto;

    // Update CTA buttons
    const primaryCta = document.querySelector('.hero-cta .btn-primary');
    if (primaryCta && hero.cta?.primary) {
      primaryCta.textContent = hero.cta.primary.text;
      primaryCta.href = hero.cta.primary.link;
    }

    const secondaryCta = document.querySelector('.hero-cta .btn-outline');
    if (secondaryCta && hero.cta?.secondary) {
      secondaryCta.textContent = hero.cta.secondary.text;
      secondaryCta.href = hero.cta.secondary.link;
    }

    // Update social proof items
    if (hero.socialProof && Array.isArray(hero.socialProof)) {
      const socialProofContainer = document.querySelector('.hero-social');
      if (socialProofContainer) {
        // Clear existing items
        socialProofContainer.innerHTML = '';

        // Add new items from JSON
        hero.socialProof.forEach(item => {
          const itemDiv = document.createElement('div');
          itemDiv.className = 'item';

          if (item.type === 'rating') {
            itemDiv.innerHTML = `
              <span class="stars">${item.stars}</span>
              <span class="lbl">${item.label}</span>
            `;
          } else if (item.type === 'stat') {
            itemDiv.innerHTML = `
              <span class="num">${item.number}</span>
              <span class="lbl">${item.label}</span>
            `;
          }

          socialProofContainer.appendChild(itemDiv);
        });
      }
    }

    // NOTE: The hero <video> source and poster are intentionally NOT updated from
    // content JSON. Those assets are fingerprinted by the Vite build (e.g.
    // neff-paving-1080p.<hash>.mp4), and the markup already references the correct
    // hashed URL. Overwriting them with the raw JSON paths
    // (/assets/videos/optimized/neff-paving-1080p.mp4) points at files that do not
    // exist in the production build, which 404s and leaves the hero blank. Let the
    // build pipeline own the video/poster paths.
  }

  /**
   * Populate stats section
   */
  populateStats() {
    const { stats } = this.content.homepage;
    if (!stats || !Array.isArray(stats)) return;

    const statsSection = document.querySelector('.stats-grid');
    if (!statsSection) return;

    // Clear existing stats
    statsSection.innerHTML = '';

    // Add new stats from JSON
    stats.forEach(stat => {
      const statCard = document.createElement('div');
      statCard.className = 'stat-card';
      statCard.setAttribute('data-aos', 'fade-up');

      statCard.innerHTML = `
        <div class="stat-number">${stat.number}</div>
        <div class="stat-label">${stat.label}</div>
        <div class="stat-description">${stat.description}</div>
      `;

      statsSection.appendChild(statCard);
    });
  }

  /**
   * Populate introduction section
   */
  populateIntroduction() {
    const { introduction } = this.content.homepage;
    if (!introduction) return;

    // Update eyebrow
    const eyebrow = document.querySelector('.introduction .eyebrow');
    if (eyebrow) eyebrow.textContent = introduction.eyebrow;

    // Update title
    const title = document.querySelector('.introduction .section-title');
    if (title) title.textContent = introduction.title;

    // Update lead paragraph
    const lead = document.querySelector('.introduction .lead');
    if (lead) lead.textContent = introduction.lead;

    // Update feature points
    if (introduction.points && Array.isArray(introduction.points)) {
      const pointsContainer = document.querySelector('.feature-points');
      if (pointsContainer) {
        pointsContainer.innerHTML = '';

        introduction.points.forEach(point => {
          const pointDiv = document.createElement('div');
          pointDiv.className = 'point';
          pointDiv.setAttribute('data-aos', 'fade-up');

          const iconSvg = this.getIconSvg(point.icon);

          pointDiv.innerHTML = `
            <div class="point-icon">
              ${iconSvg}
            </div>
            <div class="point-content">
              <h3>${point.title}</h3>
              <p>${point.description}</p>
            </div>
          `;

          pointsContainer.appendChild(pointDiv);
        });
      }
    }

    // Update CTA
    if (introduction.cta?.button) {
      const ctaButton = document.querySelector('.introduction .cta-button');
      if (ctaButton) {
        ctaButton.textContent = introduction.cta.button.text;
        ctaButton.href = introduction.cta.button.link;
      }
    }

    if (introduction.cta?.note) {
      const ctaNote = document.querySelector('.introduction .cta-note');
      if (ctaNote) {
        ctaNote.innerHTML = `${introduction.cta.note.icon} ${introduction.cta.note.text}`;
      }
    }
  }

  /**
   * Get SVG icon markup based on icon name
   */
  getIconSvg(iconName) {
    const icons = {
      'star': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
      'check-circle': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
      'fast': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 5H11l5 7-3.5 1-8-6h11l3 2 2 1-3 3h3l4-4-5.5-4z"/></svg>'
    };
    return icons[iconName] || icons['check-circle'];
  }
}
