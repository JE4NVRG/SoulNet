import express, { type Request, type Response } from 'express';
import { requireAuth, userScopedClient } from '../middleware/auth';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

type AuthenticatedRequest = Request & { user: { id: string; email: string }; token: string };

// Initialize Supabase admin client for push subscriptions
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface PushSubscriptionRequest {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * POST /api/push/subscribe
 * Save or update user's push notification subscription
 */
router.post('/subscribe', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { endpoint, keys }: PushSubscriptionRequest = req.body;

    // Validate required fields
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: endpoint, keys.p256dh, keys.auth'
      });
    }

    // Upsert push subscription (insert or update if exists)
    const { data, error } = await supabaseAdmin
      .from('user_push_subscriptions')
      .upsert(
        {
          user_id: user.id,
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
        },
        {
          onConflict: 'user_id,endpoint',
          ignoreDuplicates: false
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error saving push subscription:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to save push subscription'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Push subscription saved successfully',
      data: {
        id: data.id,
        created_at: data.created_at
      }
    });

  } catch (error) {
    console.error('Error in push subscribe endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/push/subscriptions
 * Get user's push notification subscriptions
 */
router.get('/subscriptions', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;

    const { data, error } = await supabaseAdmin
      .from('user_push_subscriptions')
      .select('id, endpoint, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching push subscriptions:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch push subscriptions'
      });
    }

    res.status(200).json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('Error in push subscriptions endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * DELETE /api/push/unsubscribe
 * Remove user's push notification subscription
 */
router.delete('/unsubscribe', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: endpoint'
      });
    }

    const { error } = await supabaseAdmin
      .from('user_push_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('endpoint', endpoint);

    if (error) {
      console.error('Error removing push subscription:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to remove push subscription'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Push subscription removed successfully'
    });

  } catch (error) {
    console.error('Error in push unsubscribe endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;