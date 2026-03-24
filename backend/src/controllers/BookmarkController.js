const BookmarkRepository = require('../repositories/BookmarkRepository');
const LocationRepository = require('../repositories/LocationRepository');

// ─── BookmarkController ─────────────────────────────────────────
// Handles save, retrieve, and delete operations for user bookmarks.

class BookmarkController {
  /**
   * POST /api/bookmarks
   * Save a new bookmark for a user + location pair.
   *
   * Request body: { userId, locationId, label? }
   * - 409 if bookmark already exists for this user + location
   * - label defaults to location.placeName if not provided
   *
   * Response: 201 { success, bookmark }
   */
  async save(req, res) {
    try {
      const { userId, locationId, label } = req.body;

      // ── Validate required fields ──
      if (!userId || !locationId) {
        return res.status(400).json({
          success: false,
          error: '"userId" and "locationId" are required.',
        });
      }

      const parsedUserId = parseInt(userId, 10);
      const parsedLocationId = parseInt(locationId, 10);

      if (isNaN(parsedUserId) || parsedUserId <= 0 || isNaN(parsedLocationId) || parsedLocationId <= 0) {
        return res.status(400).json({
          success: false,
          error: '"userId" and "locationId" must be positive integers.',
        });
      }

      // ── Check for duplicate bookmark ──
      const alreadyExists = await BookmarkRepository.exists(parsedUserId, parsedLocationId);
      if (alreadyExists) {
        return res.status(409).json({
          success: false,
          error: 'Bookmark already exists for this user and location.',
        });
      }

      // ── Resolve default label from location if not provided ──
      let resolvedLabel = label || null;
      if (!resolvedLabel) {
        const location = await LocationRepository.findById(parsedLocationId);
        if (location) {
          resolvedLabel = location.placeName || location.address || null;
        }
      }

      // ── Persist bookmark ──
      const bookmark = await BookmarkRepository.save(parsedUserId, parsedLocationId, resolvedLabel);

      return res.status(201).json({
        success: true,
        bookmark,
      });

    } catch (err) {
      console.error('🔴 BookmarkController.save unexpected error:', err);
      return res.status(500).json({
        success: false,
        error: 'An unexpected error occurred while saving the bookmark.',
      });
    }
  }

  /**
   * GET /api/bookmarks/:userId
   * Retrieve all bookmarks for a user, including full location data.
   *
   * Response: { success, count, bookmarks }
   */
  async getByUserId(req, res) {
    try {
      const { userId } = req.params;
      const parsedUserId = parseInt(userId, 10);

      if (isNaN(parsedUserId) || parsedUserId <= 0) {
        return res.status(400).json({
          success: false,
          error: '"userId" must be a positive integer.',
        });
      }

      const bookmarks = await BookmarkRepository.findByUserId(parsedUserId);

      return res.status(200).json({
        success: true,
        count: bookmarks.length,
        bookmarks,
      });

    } catch (err) {
      console.error('🔴 BookmarkController.getByUserId unexpected error:', err);
      return res.status(500).json({
        success: false,
        error: 'An unexpected error occurred while fetching bookmarks.',
      });
    }
  }

  /**
   * DELETE /api/bookmarks/:id
   * Delete a bookmark by ID, verifying ownership via userId in the body.
   *
   * Request body: { userId }
   * - 403 if userId does not match the bookmark owner
   *
   * Response: { success, message }
   */
  async delete(req, res) {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      const parsedId = parseInt(id, 10);
      const parsedUserId = parseInt(userId, 10);

      if (isNaN(parsedId) || parsedId <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Bookmark "id" must be a positive integer.',
        });
      }

      if (!userId || isNaN(parsedUserId) || parsedUserId <= 0) {
        return res.status(400).json({
          success: false,
          error: '"userId" is required in the request body and must be a positive integer.',
        });
      }

      // ── Ownership-verified delete (returns false if not owner or not found) ──
      const deleted = await BookmarkRepository.delete(parsedId, parsedUserId);

      if (!deleted) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: bookmark not found or does not belong to this user.',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Bookmark deleted successfully.',
      });

    } catch (err) {
      console.error('🔴 BookmarkController.delete unexpected error:', err);
      return res.status(500).json({
        success: false,
        error: 'An unexpected error occurred while deleting the bookmark.',
      });
    }
  }
}

module.exports = new BookmarkController();
