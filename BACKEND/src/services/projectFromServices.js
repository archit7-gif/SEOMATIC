const ExcelService = require('./excelService');
const ApiError = require('../utils/ApiError');

class ProjectFormService {
  /**
   * Parse project form data from Excel
   * Supports auto-fill for: email, website, social links, category, images, tags
   */
  static parseProjectForm(filePath) {
    try {
      const excelData = ExcelService.readExcel(filePath);
      
      if (excelData.length === 0) {
        throw ApiError.badRequest('Excel file is empty');
      }

      // Normalize column names
      const firstRow = excelData[0];
      const normalizedRow = {};
      Object.keys(firstRow).forEach(key => {
        normalizedRow[key.toLowerCase().trim().replace(/\s+/g, '_')] = firstRow[key];
      });

      // Extract project form data
      const projectForm = {
        basics: this.extractBasics(normalizedRow),
        business: this.extractBusiness(normalizedRow),
        social: this.extractSocial(normalizedRow),
        media: this.extractMedia(normalizedRow),
        tags: this.extractTags(normalizedRow)
      };

      return projectForm;

    } catch (error) {
      if (error.isOperational) throw error;
      throw ApiError.internal('Failed to parse project form: ' + error.message);
    }
  }

  /**
   * Extract basic information
   */
  static extractBasics(row) {
    return {
      email: row.email || row.contact_email || '',
      website: row.website || row.website_url || row.url || '',
      category: row.category || row.post_category || '',
      phone: row.phone || row.contact_phone || row.mobile || '',
      address: row.address || row.full_address || '',
      city: row.city || '',
      state: row.state || '',
      country: row.country || '',
      zipCode: row.zip_code || row.zip || row.postal_code || ''
    };
  }

  /**
   * Extract business information
   */
  static extractBusiness(row) {
    return {
      businessName: row.business_name || row.company_name || row.name || '',
      tagline: row.tagline || row.slogan || '',
      description: row.description || row.about || row.business_description || '',
      latitude: row.latitude || row.lat || '',
      longitude: row.longitude || row.lng || row.long || '',
      whatsapp: row.whatsapp || row.whatsapp_number || '',
      claimedSection: row.claimed_section || 'not_claimed',
      youtube: row.youtube || row.youtube_url || ''
    };
  }

  /**
   * Extract social media links
   */
  static extractSocial(row) {
    return {
      facebook: row.facebook || row.facebook_url || '',
      twitter: row.twitter || row.twitter_url || row.x_url || '',
      linkedin: row.linkedin || row.linkedin_url || '',
      instagram: row.instagram || row.instagram_url || '',
      pinterest: row.pinterest || row.pinterest_url || '',
      yelp: row.yelp || row.yelp_url || '',
      googleBusiness: row.google_business || row.google_my_business || ''
    };
  }

  /**
   * Extract media information
   */
  static extractMedia(row) {
    return {
      logo: row.logo || row.brand_logo || row.logo_url || '',
      images: row.images ? this.parseImageList(row.images) : [],
      homePageImages: row.home_page_images || row.homepage_images ? 
        this.parseImageList(row.home_page_images || row.homepage_images) : []
    };
  }

  /**
   * Extract and parse tags
   */
  static extractTags(row) {
    const tagsString = row.tags || row.default_tags || row.keywords || '';
    
    if (!tagsString) {
      return { mode: 'auto', tags: [] };
    }

    // Parse comma-separated or newline-separated tags
    const tags = tagsString
      .split(/[,\n]/)
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    return {
      mode: 'manual',
      tags
    };
  }

  /**
   * Parse image list (comma or newline separated)
   */
  static parseImageList(imagesString) {
    if (!imagesString) return [];
    
    return imagesString
      .split(/[,\n]/)
      .map(img => img.trim())
      .filter(img => img.length > 0);
  }

  /**
   * Validate project form data
   */
  static validateProjectForm(formData) {
    const errors = [];

    // Check required fields
    if (!formData.basics?.email) {
      errors.push('Email is required');
    }

    if (!formData.basics?.website) {
      errors.push('Website URL is required');
    }

    // Validate email format
    if (formData.basics?.email && !this.isValidEmail(formData.basics.email)) {
      errors.push('Invalid email format');
    }

    // Validate URL format
    if (formData.basics?.website && !this.isValidUrl(formData.basics.website)) {
      errors.push('Invalid website URL format');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Email validation
   */
  static isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /**
   * URL validation
   */
  static isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate auto tags based on content
   */
  static generateAutoTags(content, count = 5) {
    // Simple keyword extraction from title and description
    const text = `${content.title} ${content.description}`.toLowerCase();
    const words = text
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);

    // Remove duplicates and common words
    const commonWords = ['this', 'that', 'with', 'from', 'have', 'more', 'will', 'your', 'their'];
    const uniqueWords = [...new Set(words)]
      .filter(word => !commonWords.includes(word));

    return uniqueWords.slice(0, count);
  }

  /**
   * Merge form data with project defaults
   */
  static mergeWithDefaults(formData, defaults = {}) {
    return {
      basics: { ...defaults.basics, ...formData.basics },
      business: { ...defaults.business, ...formData.business },
      social: { ...defaults.social, ...formData.social },
      media: { ...defaults.media, ...formData.media },
      tags: formData.tags || defaults.tags || { mode: 'auto', tags: [] }
    };
  }

  /**
   * Create project form summary
   */
  static createFormSummary(formData) {
    return {
      hasEmail: !!formData.basics?.email,
      hasWebsite: !!formData.basics?.website,
      hasCategory: !!formData.basics?.category,
      socialLinksCount: Object.values(formData.social || {}).filter(v => v).length,
      imagesCount: (formData.media?.images || []).length,
      homePageImagesCount: (formData.media?.homePageImages || []).length,
      tagsCount: (formData.tags?.tags || []).length,
      tagsMode: formData.tags?.mode || 'auto'
    };
  }
}

module.exports = ProjectFormService;