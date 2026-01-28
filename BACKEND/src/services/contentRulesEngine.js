

const { CONTENT_MOODS, TITLE_LENGTHS, CONTENT_SOURCES } = require('../config/constants');

class ContentRulesEngine {
  /**
   * Build AI prompt based on project rules and content data
   * @param {object} rules - Project content rules
   * @param {object} contentData - Individual content item data
   * @returns {string} - Complete AI prompt
   */
  static buildPrompt(rules, contentData) {
    const sections = [];

    // 1. Role and Task Definition
    sections.push(this._buildRoleSection(contentData.taskType));

    // 2. Content Source Instructions
    sections.push(this._buildSourceSection(rules.contentSource, contentData));

    // 3. Content Structure
    sections.push(this._buildStructureSection(rules, contentData));

    // 4. Tone and Style
    sections.push(this._buildToneSection(rules));

    // 5. Keyword Integration
    sections.push(this._buildKeywordSection(rules, contentData));

    // 6. Formatting Options
    sections.push(this._buildFormattingSection(rules.formatting));

    // 7. Brand/Domain Integration
    if (rules.brandSettings?.includeBrand) {
      sections.push(this._buildBrandSection(rules.brandSettings));
    }

    // 8. Custom Instructions
    if (rules.customInstructions) {
      sections.push(this._buildCustomSection(rules.customInstructions));
    }

    // 9. Output Requirements
    sections.push(this._buildOutputSection(rules));

    return sections.filter(Boolean).join('\n\n');
  }

  /**
   * Build role section based on task type
   */
  static _buildRoleSection(taskType) {
    const taskDescriptions = {
      classified: 'classified advertisement',
      profile: 'professional profile or company bio',
      guest_posting: 'guest blog post article',
      business_listing: 'business listing description',
      blog_commenting: 'thoughtful blog comment',
      social_bookmarking: 'social bookmark description',
      pdf_submission: 'PDF document content',
      org_link: 'organizational content',
      net_link: 'network resource description',
      info_link: 'informational content'
    };

    return `You are an expert SEO content writer. Your task is to create a ${taskDescriptions[taskType] || 'SEO content piece'} that is engaging, informative, and optimized for search engines.`;
  }

  /**
   * Build content source section
   */
  static _buildSourceSection(contentSource, contentData) {
    switch (contentSource) {
      case CONTENT_SOURCES.FULL_GPT:
        return `Generate complete content including title and description based on the following keyword: "${contentData.keyword}"`;
      
      case CONTENT_SOURCES.MIXED:
        return `Use the following information as a base:
Title: ${contentData.title}
Description: ${contentData.description}
Keyword: ${contentData.keyword}

Expand this into comprehensive content while maintaining the core message.`;
      
      case CONTENT_SOURCES.EXCEL_BASED:
        return `Strictly use the following information:
Title: ${contentData.title}
Description: ${contentData.description}
Keyword: ${contentData.keyword}

Expand only the description into full content. Keep the title exactly as provided.`;
      
      default:
        return '';
    }
  }

  /**
   * Build structure section
   */
  static _buildStructureSection(rules, contentData) {
    const sections = [];

    // Word limit
    const wordLimit = contentData.wordLimit || 300;
    sections.push(`Word Count: Write approximately ${wordLimit} words.`);

    // Paragraph structure
    sections.push(`Paragraph Length: Each paragraph should be around ${rules.wordsPerParagraph || 100} words.`);

    // Content depth
    const depthGuide = {
      shallow: 'Keep content brief and to the point with basic information.',
      medium: 'Provide moderate detail with explanations and examples.',
      deep: 'Include comprehensive details, in-depth analysis, and extensive examples.'
    };
    sections.push(`Content Depth: ${depthGuide[rules.contentDepth || 'medium']}`);

    // Conclusion
    if (rules.includeConclusion) {
      sections.push('Include a conclusion: End with a brief concluding paragraph that summarizes key points.');
    }

    return `Content Structure:\n${sections.join('\n')}`;
  }

  /**
   * Build tone section
   */
  static _buildToneSection(rules) {
    const toneGuides = {
      informational: 'Write in an informative, educational tone. Focus on providing valuable information and insights.',
      promotional: 'Write in a promotional, persuasive tone. Highlight benefits and encourage action.',
      neutral: 'Write in a neutral, objective tone. Present facts without strong opinions.',
      professional: 'Write in a professional, formal tone. Use industry-standard language and maintain credibility.',
      marketing: 'Write in an engaging marketing tone. Use compelling language that drives interest and conversions.'
    };

    const mood = rules.contentMood || 'informational';
    const language = rules.language || 'english';

    return `Tone and Language:
${toneGuides[mood]}
Write in ${language} language.`;
  }

  /**
   * Build keyword section
   */
  static _buildKeywordSection(rules, contentData) {
    const keywordCount = rules.keywordsPerArticle || 3;
    const reuseAllowed = rules.keywordReuse !== false;

    return `Keyword Integration:
Primary Keyword: "${contentData.keyword}"
Usage: Include the keyword naturally ${keywordCount} times throughout the content.
${reuseAllowed ? 'You may use variations or related terms naturally.' : 'Use the exact keyword as provided.'}
Placement: Integrate keywords naturally in different sections, not just at the beginning.`;
  }

  /**
   * Build formatting section
   */
  static _buildFormattingSection(formatting = {}) {
    const sections = [];

    if (formatting.useBulletPoints) {
      sections.push('- Use bullet points or numbered lists where appropriate to organize information');
    }

    if (formatting.useTables) {
      sections.push('- Include tables to present data or comparisons when relevant');
    }

    if (formatting.useEmojis) {
      sections.push('- Use relevant emojis sparingly to enhance readability (1-3 emojis max)');
    }

    if (formatting.useBoxes) {
      sections.push('- Use special formatting like [IMPORTANT] or [TIP] boxes for key information');
    }

    if (formatting.useQuotes) {
      sections.push('- Include relevant quotes or highlighted statements to emphasize important points');
    }

    if (formatting.includeFAQ) {
      sections.push('- Include a brief FAQ section (2-3 questions) at the end');
    }

    if (sections.length === 0) {
      return 'Formatting: Use standard paragraph formatting without special elements.';
    }

    return `Formatting Options:\n${sections.join('\n')}`;
  }

  /**
   * Build brand section
   */
  static _buildBrandSection(brandSettings) {
    const sections = [];

    if (brandSettings.brandName) {
      sections.push(`Brand Name: ${brandSettings.brandName}`);
    }

    if (brandSettings.domainName) {
      sections.push(`Domain: ${brandSettings.domainName}`);
    }

    sections.push('Integrate the brand name naturally in the conclusion or throughout the content where relevant.');

    return `Brand Integration:\n${sections.join('\n')}`;
  }

  /**
   * Build custom instructions section
   */
  static _buildCustomSection(customInstructions) {
    return `Additional Instructions:\n${customInstructions}`;
  }

  /**
   * Build output requirements section
   */
  static _buildOutputSection(rules) {
    return `Output Requirements:
- Write clean, well-structured content
- Ensure natural flow and readability
- Include the target link naturally where appropriate: ${rules.targetLink || '[link will be provided]'}
- Maintain SEO best practices
- Output only the content body, no meta descriptions or additional notes
- Do not include phrases like "Here's the content" or "Based on your requirements"`;
  }

  /**
   * Generate title based on rules
   * @param {object} rules - Project rules
   * @param {string} keyword - Primary keyword
   * @returns {string} - AI prompt for title generation
   */
  static buildTitlePrompt(rules, keyword) {
    const lengthGuide = {
      short: '30-40 characters',
      medium: '40-60 characters',
      long: '60-80 characters'
    };

    const length = lengthGuide[rules.titleLength] || lengthGuide.medium;

    return `Generate an SEO-optimized title for content about "${keyword}".
Requirements:
- Length: ${length}
- Include the keyword naturally
- Make it engaging and click-worthy
- Use ${rules.language || 'english'} language
- Tone: ${rules.contentMood || 'informational'}

Output only the title, nothing else.`;
  }

  /**
   * Validate that generated content meets requirements
   * @param {string} content - Generated content
   * @param {number} targetWordCount - Expected word count
   * @returns {object} - { valid: boolean, wordCount: number, deviation: number }
   */
  static validateContent(content, targetWordCount) {
    const words = content.trim().split(/\s+/);
    const actualWordCount = words.length;
    const deviation = Math.abs(actualWordCount - targetWordCount);
    const deviationPercent = (deviation / targetWordCount) * 100;

    return {
      valid: deviationPercent <= 20, // Allow 20% deviation
      wordCount: actualWordCount,
      targetWordCount,
      deviation,
      deviationPercent: deviationPercent.toFixed(2)
    };
  }
}

module.exports = ContentRulesEngine;