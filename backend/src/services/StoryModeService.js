const Category = require('../constants/Category');

// ─── StoryModeService ───────────────────────────────────────────
// Converts a structured timeline into a readable historical
// narrative paragraph for a given location.

// Human-readable category labels and narrative phrasing
const CATEGORY_LABELS = {
  [Category.WAR_BATTLE]: { label: 'war & battle', adverb: 'Militarily', noun: 'conflicts' },
  [Category.POLITICS]: { label: 'political', adverb: 'Politically', noun: 'political events' },
  [Category.SCIENCE_INNOVATION]: { label: 'science & innovation', adverb: 'Scientifically', noun: 'innovations and discoveries' },
  [Category.CULTURE_ART]: { label: 'culture & art', adverb: 'Culturally', noun: 'cultural and artistic milestones' },
  [Category.DISASTER]: { label: 'disaster', adverb: 'Tragically', noun: 'disasters' },
  [Category.FAMOUS_BIRTH_DEATH]: { label: 'famous figures', adverb: 'Notably', noun: 'events involving famous figures' },
};

// Human-readable dominant category labels for the closing sentence
const DOMINANT_LABELS = {
  [Category.WAR_BATTLE]: 'military',
  [Category.POLITICS]: 'political',
  [Category.SCIENCE_INNOVATION]: 'science and innovation',
  [Category.CULTURE_ART]: 'culture and art',
  [Category.DISASTER]: 'disaster',
  [Category.FAMOUS_BIRTH_DEATH]: 'notable figures',
  [Category.UNKNOWN]: 'historically diverse',
};

class StoryModeService {
  /**
   * Generate a readable narrative paragraph from a Timeline object.
   * @param {Timeline} timeline - Built timeline with events and location
   * @returns {string} Multi-sentence narrative paragraph
   */
  static generateNarrative(timeline) {
    if (!timeline || !timeline.events || timeline.events.length === 0) {
      return 'No significant historical events were found for this location.';
    }

    const events = timeline.events;
    const totalCount = events.length;
    const placeName = StoryModeService._getPlaceName(timeline);

    // Extract all events into a flat usable format (handle ScoredEvent wrapping)
    const flatEvents = events.map(e => e.event || e);

    // Collect years (filter nulls)
    const years = flatEvents.map(e => e.year).filter(y => y != null);
    const hasYears = years.length > 0;

    // Collect unique categories (exclude UNKNOWN)
    const categorySet = new Set(flatEvents.map(e => e.category).filter(c => c && c !== Category.UNKNOWN));
    const categoryCount = categorySet.size || 1;

    // ── Opening sentence ──
    const sentences = [];
    let opening = `${placeName} has a recorded history`;

    if (hasYears) {
      const minYear = Math.min(...years);
      const maxYear = Math.max(...years);
      const yearSpan = maxYear - minYear;
      if (yearSpan > 0) {
        opening += ` spanning ${yearSpan} years`;
      }
    }

    opening += `, with ${totalCount} significant ${totalCount === 1 ? 'event' : 'events'} documented across ${categoryCount} ${categoryCount === 1 ? 'domain' : 'domains'}.`;
    sentences.push(opening);

    // ── Per-category sentences ──
    const categoryGroups = StoryModeService._groupByCategory(flatEvents);

    for (const [cat, catEvents] of Object.entries(categoryGroups)) {
      if (cat === Category.UNKNOWN || catEvents.length === 0) continue;

      const meta = CATEGORY_LABELS[cat];
      if (!meta) continue;

      const count = catEvents.length;
      const catYears = catEvents.map(e => e.year).filter(y => y != null).sort((a, b) => a - b);

      if (count === 1) {
        // Single event — singular grammar
        const event = catEvents[0];
        let sentence = `${meta.adverb}, the region experienced 1 ${meta.noun.replace(/s$/, '').replace(/ies$/, 'y')}`;
        if (event.title) {
          sentence += `: "${event.title}"`;
        }
        if (event.year != null) {
          sentence += ` in ${event.year}`;
        }
        sentence += '.';
        sentences.push(sentence);
      } else {
        // Multiple events
        let sentence = `${meta.adverb}, the region saw ${count} ${meta.noun}.`;

        if (catYears.length >= 2) {
          const earliest = catEvents.find(e => e.year === catYears[0]);
          const latest = catEvents.find(e => e.year === catYears[catYears.length - 1]);

          const earliestPart = earliest && earliest.title
            ? `The earliest was "${earliest.title}" in ${earliest.year}`
            : `The earliest was in ${catYears[0]}`;

          const latestPart = latest && latest.title
            ? `the most recent was "${latest.title}" in ${latest.year}`
            : `the most recent was in ${catYears[catYears.length - 1]}`;

          sentence += ` ${earliestPart}, ${latestPart}.`;
        }

        sentences.push(sentence);
      }
    }

    // ── Closing sentence ──
    const dominant = timeline.getDominantCategory
      ? timeline.getDominantCategory()
      : StoryModeService._getDominantCategory(flatEvents);

    if (dominant && dominant !== Category.UNKNOWN) {
      const dominantLabel = DOMINANT_LABELS[dominant] || dominant.toLowerCase().replace(/_/g, ' ');
      sentences.push(`The history of this region is predominantly ${dominantLabel}-related.`);
    }

    return sentences.join(' ');
  }

  /**
   * Extract place name from timeline's location.
   */
  static _getPlaceName(timeline) {
    if (timeline.location) {
      return timeline.location.placeName || timeline.location.address || 'This location';
    }
    return 'This location';
  }

  /**
   * Group flat events by category.
   */
  static _groupByCategory(events) {
    const groups = {};
    for (const event of events) {
      const cat = event.category || Category.UNKNOWN;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(event);
    }
    return groups;
  }

  /**
   * Fallback dominant category calculation.
   */
  static _getDominantCategory(events) {
    const counts = {};
    for (const e of events) {
      const cat = e.category || Category.UNKNOWN;
      counts[cat] = (counts[cat] || 0) + 1;
    }

    let dominant = null;
    let max = 0;
    for (const [cat, count] of Object.entries(counts)) {
      if (count > max) {
        max = count;
        dominant = cat;
      }
    }
    return dominant;
  }
}

module.exports = StoryModeService;
