const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'neff_paving_admin',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

// GET /api/cms/seo/:page - Get SEO metadata
router.get('/seo/:page', async (req, res) => {
  try {
    const { page } = req.params;
    const { page_type = 'cms_page', page_id } = req.query;

    let query;
    let queryParams;

    if (page_id) {
      // Search by specific page_id and page_type
      query = `
        SELECT 
          id, page_type, page_id, title, description, keywords,
          og_data, twitter_data, schema_markup, created_at, updated_at
        FROM seo_metadata 
        WHERE page_type = $1 AND page_id = $2
      `;
      queryParams = [page_type, page_id];
    } else {
      // Search by page identifier (could be slug, name, etc.)
      // First, try to find matching records by correlating with other tables
      if (page_type === 'blog_post') {
        query = `
          SELECT 
            s.id, s.page_type, s.page_id, s.title, s.description, s.keywords,
            s.og_data, s.twitter_data, s.schema_markup, s.created_at, s.updated_at,
            b.title as page_title, b.slug as page_slug
          FROM seo_metadata s
          JOIN blog_posts b ON s.page_id = b.id::text
          WHERE s.page_type = 'blog_post' 
          AND (b.slug = $1 OR b.title ILIKE $2)
        `;
        queryParams = [page, `%${page}%`];
      } else if (page_type === 'cms_page') {
        query = `
          SELECT 
            s.id, s.page_type, s.page_id, s.title, s.description, s.keywords,
            s.og_data, s.twitter_data, s.schema_markup, s.created_at, s.updated_at,
            c.page_slug
          FROM seo_metadata s
          JOIN cms_pages c ON s.page_id = c.id::text
          WHERE s.page_type = 'cms_page' 
          AND c.page_slug = $1
          GROUP BY s.id, s.page_type, s.page_id, s.title, s.description, s.keywords,
                   s.og_data, s.twitter_data, s.schema_markup, s.created_at, s.updated_at, c.page_slug
        `;
        queryParams = [page];
      } else {
        // Generic search for other page types
        query = `
          SELECT 
            id, page_type, page_id, title, description, keywords,
            og_data, twitter_data, schema_markup, created_at, updated_at
          FROM seo_metadata 
          WHERE page_type = $1 AND page_id = $2
        `;
        queryParams = [page_type, page];
      }
    }

    const result = await pool.query(query, queryParams);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'SEO metadata not found',
        page_identifier: page,
        page_type: page_type,
        suggestions: await getSEOSuggestions(page, page_type)
      });
    }

    // Return the first match (or only match)
    const seoData = result.rows[0];

    res.json({
      seo: {
        id: seoData.id,
        page_type: seoData.page_type,
        page_id: seoData.page_id,
        title: seoData.title,
        description: seoData.description,
        keywords: seoData.keywords,
        og_data: seoData.og_data,
        twitter_data: seoData.twitter_data,
        schema_markup: seoData.schema_markup,
        created_at: seoData.created_at,
        updated_at: seoData.updated_at
      },
      page_info: {
        page_title: seoData.page_title,
        page_slug: seoData.page_slug
      }
    });
  } catch (error) {
    console.error('Error fetching SEO metadata:', error);
    res.status(500).json({ error: 'Failed to fetch SEO metadata', details: error.message });
  }
});

// PUT /api/cms/seo/:page - Update SEO metadata
router.put('/seo/:page', async (req, res) => {
  try {
    const { page } = req.params;
    const { 
      page_type = 'cms_page', 
      page_id,
      title, 
      description, 
      keywords, 
      og_data, 
      twitter_data, 
      schema_markup 
    } = req.body;

    // Validate required fields
    if (!page_id && !page) {
      return res.status(400).json({ 
        error: 'Either page_id or page identifier is required' 
      });
    }

    let targetPageId = page_id;

    // If page_id is not provided, try to resolve it from the page identifier
    if (!targetPageId) {
      targetPageId = await resolvePageId(page, page_type);
      if (!targetPageId) {
        return res.status(404).json({ 
          error: 'Cannot resolve page identifier to page_id',
          page_identifier: page,
          page_type: page_type
        });
      }
    }

    // Check if SEO metadata already exists
    const existingSEO = await pool.query(
      'SELECT id FROM seo_metadata WHERE page_type = $1 AND page_id = $2',
      [page_type, targetPageId]
    );

    let result;

    if (existingSEO.rows.length > 0) {
      // Update existing SEO metadata
      const updateFields = [];
      const updateValues = [];
      let paramCounter = 3; // Start from 3 because $1 and $2 are page_type and page_id

      if (title !== undefined) {
        updateFields.push(`title = $${paramCounter++}`);
        updateValues.push(title);
      }
      if (description !== undefined) {
        updateFields.push(`description = $${paramCounter++}`);
        updateValues.push(description);
      }
      if (keywords !== undefined) {
        updateFields.push(`keywords = $${paramCounter++}`);
        updateValues.push(keywords);
      }
      if (og_data !== undefined) {
        updateFields.push(`og_data = $${paramCounter++}`);
        updateValues.push(JSON.stringify(og_data));
      }
      if (twitter_data !== undefined) {
        updateFields.push(`twitter_data = $${paramCounter++}`);
        updateValues.push(JSON.stringify(twitter_data));
      }
      if (schema_markup !== undefined) {
        updateFields.push(`schema_markup = $${paramCounter++}`);
        updateValues.push(JSON.stringify(schema_markup));
      }

      if (updateFields.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      const updateQuery = `
        UPDATE seo_metadata 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE page_type = $1 AND page_id = $2
        RETURNING *
      `;

      result = await pool.query(updateQuery, [page_type, targetPageId, ...updateValues]);
    } else {
      // Create new SEO metadata
      const insertQuery = `
        INSERT INTO seo_metadata (
          page_type, page_id, title, description, keywords,
          og_data, twitter_data, schema_markup
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8
        ) RETURNING *
      `;

      result = await pool.query(insertQuery, [
        page_type,
        targetPageId,
        title,
        description,
        keywords,
        og_data ? JSON.stringify(og_data) : null,
        twitter_data ? JSON.stringify(twitter_data) : null,
        schema_markup ? JSON.stringify(schema_markup) : null
      ]);
    }

    const updatedSEO = result.rows[0];

    res.json({
      message: 'SEO metadata updated successfully',
      seo: {
        id: updatedSEO.id,
        page_type: updatedSEO.page_type,
        page_id: updatedSEO.page_id,
        title: updatedSEO.title,
        description: updatedSEO.description,
        keywords: updatedSEO.keywords,
        og_data: updatedSEO.og_data,
        twitter_data: updatedSEO.twitter_data,
        schema_markup: updatedSEO.schema_markup,
        created_at: updatedSEO.created_at,
        updated_at: updatedSEO.updated_at
      }
    });
  } catch (error) {
    console.error('Error updating SEO metadata:', error);
    res.status(500).json({ error: 'Failed to update SEO metadata', details: error.message });
  }
});

// DELETE /api/cms/seo/:page - Delete SEO metadata
router.delete('/seo/:page', async (req, res) => {
  try {
    const { page } = req.params;
    const { page_type = 'cms_page', page_id } = req.query;

    let targetPageId = page_id;

    if (!targetPageId) {
      targetPageId = await resolvePageId(page, page_type);
      if (!targetPageId) {
        return res.status(404).json({ 
          error: 'Cannot resolve page identifier to page_id',
          page_identifier: page,
          page_type: page_type
        });
      }
    }

    const result = await pool.query(
      'DELETE FROM seo_metadata WHERE page_type = $1 AND page_id = $2 RETURNING *',
      [page_type, targetPageId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'SEO metadata not found',
        page_type: page_type,
        page_id: targetPageId
      });
    }

    res.json({
      message: 'SEO metadata deleted successfully',
      deleted_seo: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting SEO metadata:', error);
    res.status(500).json({ error: 'Failed to delete SEO metadata', details: error.message });
  }
});

// GET /api/cms/seo - List all SEO metadata with pagination
router.get('/seo', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const page_type = req.query.page_type || null;
    const offset = (page - 1) * limit;

    // Build query with optional filters
    let whereClause = 'WHERE 1=1';
    const queryParams = [];
    
    if (page_type) {
      whereClause += ' AND page_type = $' + (queryParams.length + 1);
      queryParams.push(page_type);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM seo_metadata ${whereClause}`;
    const countResult = await pool.query(countQuery, queryParams);
    const totalRecords = parseInt(countResult.rows[0].count);

    // Get SEO metadata with pagination
    const seoQuery = `
      SELECT 
        id, page_type, page_id, title, description, keywords,
        og_data, twitter_data, schema_markup, created_at, updated_at
      FROM seo_metadata 
      ${whereClause}
      ORDER BY updated_at DESC 
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;
    
    queryParams.push(limit, offset);
    const seoResult = await pool.query(seoQuery, queryParams);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalRecords / limit);

    res.json({
      seo_metadata: seoResult.rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalRecords,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching SEO metadata list:', error);
    res.status(500).json({ error: 'Failed to fetch SEO metadata list', details: error.message });
  }
});

// POST /api/cms/seo - Create new SEO metadata
router.post('/seo', async (req, res) => {
  try {
    const { 
      page_type, 
      page_id,
      title, 
      description, 
      keywords, 
      og_data, 
      twitter_data, 
      schema_markup 
    } = req.body;

    // Validate required fields
    if (!page_type || !page_id) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        required: ['page_type', 'page_id'] 
      });
    }

    // Check if SEO metadata already exists
    const existingSEO = await pool.query(
      'SELECT id FROM seo_metadata WHERE page_type = $1 AND page_id = $2',
      [page_type, page_id]
    );

    if (existingSEO.rows.length > 0) {
      return res.status(409).json({ 
        error: 'SEO metadata already exists for this page',
        page_type: page_type,
        page_id: page_id
      });
    }

    const insertQuery = `
      INSERT INTO seo_metadata (
        page_type, page_id, title, description, keywords,
        og_data, twitter_data, schema_markup
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8
      ) RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      page_type,
      page_id,
      title,
      description,
      keywords,
      og_data ? JSON.stringify(og_data) : null,
      twitter_data ? JSON.stringify(twitter_data) : null,
      schema_markup ? JSON.stringify(schema_markup) : null
    ]);

    res.status(201).json({
      message: 'SEO metadata created successfully',
      seo: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating SEO metadata:', error);
    res.status(500).json({ error: 'Failed to create SEO metadata', details: error.message });
  }
});

// Helper function to resolve page identifier to page_id
async function resolvePageId(pageIdentifier, pageType) {
  try {
    let query;
    let queryParams = [pageIdentifier];

    switch (pageType) {
      case 'blog_post':
        query = 'SELECT id FROM blog_posts WHERE slug = $1 OR title = $1';
        break;
      case 'cms_page':
        // For CMS pages, we need to get a representative page_id from cms_pages
        query = 'SELECT id FROM cms_pages WHERE page_slug = $1 LIMIT 1';
        break;
      case 'category':
        query = 'SELECT id FROM content_categories WHERE slug = $1 OR name = $1';
        break;
      default:
        // For other types, assume pageIdentifier is already the page_id
        return pageIdentifier;
    }

    const result = await pool.query(query, queryParams);
    return result.rows.length > 0 ? result.rows[0].id : null;
  } catch (error) {
    console.error('Error resolving page ID:', error);
    return null;
  }
}

// Helper function to get SEO suggestions
async function getSEOSuggestions(pageIdentifier, pageType) {
  try {
    const suggestions = {
      available_pages: [],
      available_page_types: ['cms_page', 'blog_post', 'category'],
      existing_seo_count: 0
    };

    // Get existing SEO count
    const countResult = await pool.query('SELECT COUNT(*) FROM seo_metadata');
    suggestions.existing_seo_count = parseInt(countResult.rows[0].count);

    // Get available pages based on type
    switch (pageType) {
      case 'blog_post':
        const blogResult = await pool.query('SELECT id, title, slug FROM blog_posts ORDER BY title LIMIT 10');
        suggestions.available_pages = blogResult.rows.map(row => ({
          id: row.id,
          title: row.title,
          slug: row.slug
        }));
        break;
      case 'cms_page':
        const pagesResult = await pool.query('SELECT DISTINCT page_slug FROM cms_pages ORDER BY page_slug LIMIT 10');
        suggestions.available_pages = pagesResult.rows.map(row => ({
          slug: row.page_slug
        }));
        break;
      case 'category':
        const categoryResult = await pool.query('SELECT id, name, slug FROM content_categories ORDER BY name LIMIT 10');
        suggestions.available_pages = categoryResult.rows.map(row => ({
          id: row.id,
          name: row.name,
          slug: row.slug
        }));
        break;
    }

    return suggestions;
  } catch (error) {
    console.error('Error getting SEO suggestions:', error);
    return {
      available_pages: [],
      available_page_types: ['cms_page', 'blog_post', 'category'],
      existing_seo_count: 0
    };
  }
}

module.exports = router;
