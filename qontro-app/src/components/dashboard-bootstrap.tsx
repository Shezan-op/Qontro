'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store';
import { createClient } from '@/lib/supabase/client';

/**
 * DashboardBootstrap
 *
 * Mounts once in the dashboard layout. Fetches the authenticated user's
 * workspace from Supabase and loads all 13 tables of workspace data into the Zustand store.
 *
 * This is the boundary between:
 *   DATABASE (source of truth) → ZUSTAND (local cache / UI state)
 *
 * It renders nothing. Any loading UI is handled by individual pages.
 */
export function DashboardBootstrap() {
  const router = useRouter();
  const { loadWorkspaceData, setWorkspace } = useAppStore();
  const hasBootstrapped = useRef(false);

  useEffect(() => {
    // Only run once per mount — avoids duplicate fetches on re-renders
    if (hasBootstrapped.current) return;
    hasBootstrapped.current = true;

    async function bootstrap() {
      const supabase = createClient();

      // 1. Get authenticated user (client-side session read)
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        // Not authenticated, redirect to login
        router.push('/login');
        return;
      }

      // 2. Find the user's workspace membership
      const { data: membership, error: membershipError } = await supabase
        .from('workspace_members')
        .select('workspace_id, role')
        .eq('user_id', user.id)
        .order('joined_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (membershipError || !membership) {
        // User has no workspace yet — redirect to onboarding to create one
        console.warn('[Bootstrap] No workspace membership found for user:', user.id);
        router.push('/onboarding');
        return;
      }

      const workspaceId = membership.workspace_id;

      // 3. Fetch workspace details
      const { data: workspace, error: wsError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', workspaceId)
        .single();

      if (wsError || !workspace) {
        console.error('[Bootstrap] Could not fetch workspace:', wsError?.message);
        return;
      }

      // 4. Set workspace in store
      setWorkspace({
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        logo: workspace.logo,
        owner_id: workspace.owner_id,
        currency: workspace.currency ?? 'USD',
        created_at: workspace.created_at,
      });

      // 5. Load all workspace data from DB into the Zustand cache
      await loadWorkspaceData(workspaceId);
    }

    bootstrap().catch((err) => {
      console.error('[Bootstrap] Unexpected error in bootstrap:', err);
    });
  }, [loadWorkspaceData, setWorkspace, router]);

  // This component renders nothing — it is a side-effect-only bootstrap
  return null;
}