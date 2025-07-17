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

// GET /api/cms/pages/:slug/sections - Get page sections
router.get('/pages/:slug/sections', async (req, res) => {
  try {
    const { slug } = req.params;
    const sectionFilter = req.query.section || null;

    // Build query with optional section filter
    let query = `
      SELECT 
        id, page_slug, section_name, content, metadata, updated_at
      FROM cms_pages 
      WHERE page_slug = $1
    `;
    
    const queryParams = [slug];
    
    if (sectionFilter) {
      query += ' AND section_name = $2';
      queryParams.push(sectionFilter);
    }
    
    query += ' ORDER BY section_name ASC';
    
    const result = await pool.query(query, queryParams);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'No sections found for this page',
        page_slug: slug,
        available_sections: await getAvailableSections(slug)
      });
    }

    // Transform sections into a more usable format
    const sections = result.rows.reduce((acc, row) => {
      acc[row.section_name] = {
        id: row.id,
        content: row.content,
        metadata: row.metadata,
        updated_at: row.updated_at
      };
      return acc;
    }, {});

    res.json({
      page_slug: slug,
      sections,
      total_sections: result.rows.length,
      last_updated: Math.max(...result.rows.map(row => new Date(row.updated_at).getTime()))
    });
  } catch (error) {
    console.error('Error fetching page sections:', error);
    res.status(500).json({ error: 'Failed to fetch page sections', details: error.message });
  }
});

// PUT /api/cms/pages/:slug/sections/:section - Update section content
router.put('/pages/:slug/sections/:section', async (req, res) => {
  try {
    const { slug, section } = req.params;
    const { content, metadata } = req.body;

    // Validate required fields
    if (!content) {
      return res.status(400).json({ 
        error: 'Missing required field: content' 
      });
    }

    // Validate section name (alphanumeric, hyphens, underscores only)
    if (!/^[a-zA-Z0-9_-]+$/.test(section)) {
      return res.status(400).json({
        error: 'Invalid section name. Use only letters, numbers, hyphens, and underscores.'
      });
    }

    // Check if the section already exists
    const existingSection = await pool.query(
      'SELECT id FROM cms_pages WHERE page_slug = $1 AND section_name = $2',
      [slug, section]
    );

    let result;
    
    if (existingSection.rows.length > 0) {
      // Update existing section
      const updateQuery = `
        UPDATE cms_pages 
        SET content = $3, metadata = $4, updated_at = CURRENT_TIMESTAMP
        WHERE page_slug = $1 AND section_name = $2
        RETURNING *
      `;
      
      result = await pool.query(updateQuery, [
        slug, 
        section, 
        content, 
        metadata ? JSON.stringify(metadata) : null
      ]);
    } else {
      // Create new section
      const insertQuery = `
        INSERT INTO cms_pages (page_slug, section_name, content, metadata)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      
      result = await pool.query(insertQuery, [
        slug, 
        section, 
        content, 
        metadata ? JSON.stringify(metadata) : null
      ]);
    }

    const updatedSection = result.rows[0];

    res.json({
      message: `Section '${section}' updated successfully`,
      section: {
        id: updatedSection.id,
        page_slug: updatedSection.page_slug,
        section_name: updatedSection.section_name,
        content: updatedSection.content,
        metadata: updatedSection.metadata,
        updated_at: updatedSection.updated_at
      }
    });
  } catch (error) {
    console.error('Error updating section content:', error);
    res.status(500).json({ error: 'Failed to update section content', details: error.message });
  }
});

// GET /api/cms/pages - List all pages with their sections
router.get('/pages', async (req, res) => {
  try {
    const query = `
      SELECT 
        page_slug, 
        array_agg(section_name ORDER BY section_name) as sections,
        COUNT(*) as section_count,
        MAX(updated_at) as last_updated
      FROM cms_pages 
      GROUP BY page_slug
      ORDER BY page_slug ASC
    `;
    
    const result = await pool.query(query);

    res.json({
      pages: result.rows.map(row => ({
        page_slug: row.page_slug,
        sections: row.sections,
        section_count: parseInt(row.section_count),
        last_updated: row.last_updated
      })),
      total_pages: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching pages:', error);
    res.status(500).json({ error: 'Failed to fetch pages', details: error.message });
  }
});

// DELETE /api/cms/pages/:slug/sections/:section - Delete a section
router.delete('/pages/:slug/sections/:section', async (req, res) => {
  try {
    const { slug, section } = req.params;
    
    const result = await pool.query(
      'DELETE FROM cms_pages WHERE page_slug = $1 AND section_name = $2 RETURNING *',
      [slug, section]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Section not found',
        page_slug: slug,
        section_name: section
      });
    }

    res.json({
      message: `Section '${section}' deleted successfully`,
      deleted_section: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting section:', error);
    res.status(500).json({ error: 'Failed to delete section', details: error.message });
  }
});

// POST /api/cms/pages/:slug/sections - Create a new section
router.post('/pages/:slug/sections', async (req, res) => {
  try {
    const { slug } = req.params;
    const { section_name, content, metadata } = req.body;

    // Validate required fields
    if (!section_name || !content) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        required: ['section_name', 'content'] 
      });
    }

    // Validate section name
    if (!/^[a-zA-Z0-9_-]+$/.test(section_name)) {
      return res.status(400).json({
        error: 'Invalid section name. Use only letters, numbers, hyphens, and underscores.'
      });
    }

    // Check if section already exists
    const existingSection = await pool.query(
      'SELECT id FROM cms_pages WHERE page_slug = $1 AND section_name = $2',
      [slug, section_name]
    );

    if (existingSection.rows.length > 0) {
      return res.status(409).json({ 
        error: 'Section already exists',
        page_slug: slug,
        section_name: section_name
      });
    }

    // Create new section
    const insertQuery = `
      INSERT INTO cms_pages (page_slug, section_name, content, metadata)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const result = await pool.query(insertQuery, [
      slug, 
      section_name, 
      content, 
      metadata ? JSON.stringify(metadata) : null
    ]);

    const newSection = result.rows[0];

    res.status(201).json({
      message: `Section '${section_name}' created successfully`,
      section: {
        id: newSection.id,
        page_slug: newSection.page_slug,
        section_name: newSection.section_name,
        content: newSection.content,
        metadata: newSection.metadata,
        updated_at: newSection.updated_at
      }
    });
  } catch (error) {
    console.error('Error creating section:', error);
    res.status(500).json({ error: 'Failed to create section', details: error.message });
  }
});

// PUT /api/cms/pages/:slug/sections - Bulk update multiple sections
router.put('/pages/:slug/sections', async (req, res) => {
  try {
    const { slug } = req.params;
    const { sections } = req.body;

    if (!sections || typeof sections !== 'object') {
      return res.status(400).json({ 
        error: 'Invalid sections data. Expected an object with section names as keys.' 
      });
    }

    const client = await pool.connect();
    const updatedSections = {};

    try {
      await client.query('BEGIN');

      for (const [sectionName, sectionData] of Object.entries(sections)) {
        // Validate section name
        if (!/^[a-zA-Z0-9_-]+$/.test(sectionName)) {
          throw new Error(`Invalid section name: ${sectionName}`);
        }

        if (!sectionData.content) {
          throw new Error(`Missing content for section: ${sectionName}`);
        }

        // Check if section exists
        const existingSection = await client.query(
          'SELECT id FROM cms_pages WHERE page_slug = $1 AND section_name = $2',
          [slug, sectionName]
        );

        let result;
        
        if (existingSection.rows.length > 0) {
          // Update existing section
          result = await client.query(`
            UPDATE cms_pages 
            SET content = $3, metadata = $4, updated_at = CURRENT_TIMESTAMP
            WHERE page_slug = $1 AND section_name = $2
            RETURNING *
          `, [
            slug, 
            sectionName, 
            sectionData.content, 
            sectionData.metadata ? JSON.stringify(sectionData.metadata) : null
          ]);
        } else {
          // Create new section
          result = await client.query(`
            INSERT INTO cms_pages (page_slug, section_name, content, metadata)
            VALUES ($1, $2, $3, $4)
            RETURNING *
          `, [
            slug, 
            sectionName, 
            sectionData.content, 
            sectionData.metadata ? JSON.stringify(sectionData.metadata) : null
          ]);
        }

        updatedSections[sectionName] = {
          id: result.rows[0].id,
          content: result.rows[0].content,
          metadata: result.rows[0].metadata,
          updated_at: result.rows[0].updated_at
        };
      }

      await client.query('COMMIT');

      res.json({
        message: `${Object.keys(sections).length} section(s) updated successfully`,
        page_slug: slug,
        sections: updatedSections
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error bulk updating sections:', error);
    res.status(500).json({ error: 'Failed to bulk update sections', details: error.message });
  }
});

// Helper function to get available sections for a page
async function getAvailableSections(pageSlug) {
  try {
    const result = await pool.query(
      'SELECT section_name FROM cms_pages WHERE page_slug = $1 ORDER BY section_name',
      [pageSlug]
    );
    return result.rows.map(row => row.section_name);
  } catch (error) {
    console.error('Error fetching available sections:', error);
    return [];
  }
}

module.exports = router;
