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

// GET /api/cms/posts - List all posts with pagination
router.get('/posts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || null;
    const author = req.query.author || null;
    const offset = (page - 1) * limit;

    // Build query with optional filters
    let whereClause = 'WHERE 1=1';
    const queryParams = [];
    
    if (status) {
      whereClause += ' AND status = $' + (queryParams.length + 1);
      queryParams.push(status);
    }
    
    if (author) {
      whereClause += ' AND author ILIKE $' + (queryParams.length + 1);
      queryParams.push(`%${author}%`);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM blog_posts ${whereClause}`;
    const countResult = await pool.query(countQuery, queryParams);
    const totalPosts = parseInt(countResult.rows[0].count);

    // Get posts with pagination
    const postsQuery = `
      SELECT 
        id, title, slug, excerpt, author, status, 
        featured_image, categories, tags, 
        published_at, created_at, updated_at
      FROM blog_posts 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;
    
    queryParams.push(limit, offset);
    const postsResult = await pool.query(postsQuery, queryParams);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalPosts / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      posts: postsResult.rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalPosts,
        hasNextPage,
        hasPrevPage,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts', details: error.message });
  }
});

// GET /api/cms/posts/:id - Get single post
router.get('/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        id, title, slug, content, excerpt, author, status,
        featured_image, seo_metadata, categories, tags,
        published_at, created_at, updated_at
      FROM blog_posts 
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({ post: result.rows[0] });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Failed to fetch post', details: error.message });
  }
});

// POST /api/cms/posts - Create new post
router.post('/posts', async (req, res) => {
  try {
    const {
      title,
      slug,
      content,
      excerpt,
      author,
      status = 'draft',
      featured_image,
      seo_metadata,
      categories = [],
      tags = []
    } = req.body;

    // Validate required fields
    if (!title || !slug || !content || !author) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        required: ['title', 'slug', 'content', 'author'] 
      });
    }

    // Check if slug already exists
    const slugCheck = await pool.query('SELECT id FROM blog_posts WHERE slug = $1', [slug]);
    if (slugCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Post with this slug already exists' });
    }

    const query = `
      INSERT INTO blog_posts (
        title, slug, content, excerpt, author, status,
        featured_image, seo_metadata, categories, tags,
        published_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      ) RETURNING *
    `;

    const published_at = status === 'published' ? new Date() : null;
    
    const result = await pool.query(query, [
      title,
      slug,
      content,
      excerpt,
      author,
      status,
      featured_image,
      JSON.stringify(seo_metadata),
      categories,
      tags,
      published_at
    ]);

    res.status(201).json({ 
      message: 'Post created successfully', 
      post: result.rows[0] 
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post', details: error.message });
  }
});

// PUT /api/cms/posts/:id - Update post
router.put('/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      slug,
      content,
      excerpt,
      author,
      status,
      featured_image,
      seo_metadata,
      categories,
      tags
    } = req.body;

    // Check if post exists
    const existingPost = await pool.query('SELECT * FROM blog_posts WHERE id = $1', [id]);
    if (existingPost.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if slug conflicts with other posts
    if (slug) {
      const slugCheck = await pool.query('SELECT id FROM blog_posts WHERE slug = $1 AND id != $2', [slug, id]);
      if (slugCheck.rows.length > 0) {
        return res.status(409).json({ error: 'Post with this slug already exists' });
      }
    }

    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    let paramCounter = 1;

    if (title !== undefined) {
      updateFields.push(`title = $${paramCounter++}`);
      updateValues.push(title);
    }
    if (slug !== undefined) {
      updateFields.push(`slug = $${paramCounter++}`);
      updateValues.push(slug);
    }
    if (content !== undefined) {
      updateFields.push(`content = $${paramCounter++}`);
      updateValues.push(content);
    }
    if (excerpt !== undefined) {
      updateFields.push(`excerpt = $${paramCounter++}`);
      updateValues.push(excerpt);
    }
    if (author !== undefined) {
      updateFields.push(`author = $${paramCounter++}`);
      updateValues.push(author);
    }
    if (status !== undefined) {
      updateFields.push(`status = $${paramCounter++}`);
      updateValues.push(status);
      
      // Update published_at when status changes to published
      if (status === 'published' && existingPost.rows[0].status !== 'published') {
        updateFields.push(`published_at = $${paramCounter++}`);
        updateValues.push(new Date());
      }
    }
    if (featured_image !== undefined) {
      updateFields.push(`featured_image = $${paramCounter++}`);
      updateValues.push(featured_image);
    }
    if (seo_metadata !== undefined) {
      updateFields.push(`seo_metadata = $${paramCounter++}`);
      updateValues.push(JSON.stringify(seo_metadata));
    }
    if (categories !== undefined) {
      updateFields.push(`categories = $${paramCounter++}`);
      updateValues.push(categories);
    }
    if (tags !== undefined) {
      updateFields.push(`tags = $${paramCounter++}`);
      updateValues.push(tags);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const query = `
      UPDATE blog_posts 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCounter}
      RETURNING *
    `;
    
    updateValues.push(id);
    const result = await pool.query(query, updateValues);

    res.json({ 
      message: 'Post updated successfully', 
      post: result.rows[0] 
    });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Failed to update post', details: error.message });
  }
});

// DELETE /api/cms/posts/:id - Delete post
router.delete('/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM blog_posts WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({ 
      message: 'Post deleted successfully', 
      deletedPost: result.rows[0] 
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post', details: error.message });
  }
});

// POST /api/cms/posts/:id/publish - Publish/unpublish post
router.post('/posts/:id/publish', async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'publish' or 'unpublish'
    
    if (!action || !['publish', 'unpublish'].includes(action)) {
      return res.status(400).json({ 
        error: 'Invalid action', 
        validActions: ['publish', 'unpublish'] 
      });
    }

    // Check if post exists
    const existingPost = await pool.query('SELECT * FROM blog_posts WHERE id = $1', [id]);
    if (existingPost.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const newStatus = action === 'publish' ? 'published' : 'draft';
    const published_at = action === 'publish' ? new Date() : null;

    const query = `
      UPDATE blog_posts 
      SET status = $1, published_at = $2
      WHERE id = $3
      RETURNING *
    `;
    
    const result = await pool.query(query, [newStatus, published_at, id]);

    res.json({ 
      message: `Post ${action}ed successfully`, 
      post: result.rows[0] 
    });
  } catch (error) {
    console.error(`Error ${req.body.action}ing post:`, error);
    res.status(500).json({ error: `Failed to ${req.body.action} post`, details: error.message });
  }
});

module.exports = router;
