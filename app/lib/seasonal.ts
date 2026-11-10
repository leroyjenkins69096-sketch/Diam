import {useRouteLoaderData} from 'react-router';
import type {RootLoader} from '~/root';

export const DEFAULT_LOGO = '/logo.webp';

export type Season = {
  id: string;
  /** Inclusive start, ISO with explicit offset (Pacific, matching the shop hours). */
  start: string;
  /** Exclusive end: the season is over from this instant on. */
  end: string;
  logo: string;
};

/**
 * Seasonal windows. Checked per request in the root loader, so a season starts
 * and stops on its own with no redeploy. Outside every window the site uses
 * DEFAULT_LOGO and no `data-season` theme.
 */
export const SEASONS: Season[] = [
  {
    id: 'thanksgiving',
    start: '2026-11-01T00:00:00-07:00',
    end: '2026-12-01T00:00:00-08:00',
    logo: '/logo-thanksgiving.webp',
  },
];

export function getActiveSeason(now: Date = new Date()): Season | null {
  const t = now.getTime();
  return SEASONS.find((s) => t >= Date.parse(s.start) && t < Date.parse(s.end)) ?? null;
}

/** Active season as resolved by the root loader (null outside every window). */
export function useSeason(): Season | null {
  return useRouteLoaderData<RootLoader>('root')?.season ?? null;
}

export function useLogo(): string {
  return useSeason()?.logo ?? DEFAULT_LOGO;
}
