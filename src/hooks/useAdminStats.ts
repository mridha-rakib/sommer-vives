import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminStats } from '@/types/admin';
import { addDays, differenceInCalendarDays, subDays } from 'date-fns';

const ACTIVE_PROPERTY_STATUSES = new Set(['published', 'active']);
const OCCUPANCY_BOOKING_STATUSES = new Set(['confirmed', 'completed', 'checked_in', 'checked_out']);

function getOverlappingNights(checkIn: string, checkOut: string, rangeStart: Date, rangeEnd: Date) {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const overlapStart = start > rangeStart ? start : rangeStart;
  const overlapEnd = end < rangeEnd ? end : rangeEnd;

  if (overlapEnd <= overlapStart) return 0;
  return differenceInCalendarDays(overlapEnd, overlapStart);
}

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const thirtyDaysAgo = subDays(today, 30);
      const thirtyDaysFromNow = addDays(today, 30);

      // Fetch all data in parallel
      const [
        propertiesRes,
        bookingsRes,
        guestsRes,
        ownersRes,
        damagePoolRes
      ] = await Promise.all([
        supabase.from('properties').select('id, status'),
        supabase.from('bookings').select('id, status, check_in, check_out, total_amount, platform_earnings, created_at'),
        supabase.from('guests').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('damage_pool').select('amount')
      ]);

      const properties = propertiesRes.data || [];
      const bookings = bookingsRes.data || [];
      const guestCount = guestsRes.count || 0;
      const ownerCount = ownersRes.count || 0;
      const damagePoolEntries = damagePoolRes.data || [];

      // Calculate stats
      const activeProperties = properties.filter(p => ACTIVE_PROPERTY_STATUSES.has(p.status || '')).length;
      const inactiveProperties = properties.length - activeProperties;

      const upcomingBookings = bookings.filter(b => 
        new Date(b.check_in) >= today && 
        new Date(b.check_in) <= thirtyDaysFromNow &&
        b.status !== 'cancelled'
      ).length;

      const pastBookings = bookings.filter(b => 
        new Date(b.check_out) < today && 
        new Date(b.check_out) >= thirtyDaysAgo &&
        b.status !== 'cancelled'
      ).length;

      const cancelledBookings = bookings.filter(b => 
        b.status === 'cancelled' &&
        new Date(b.created_at) >= thirtyDaysAgo
      ).length;

      const totalRevenue = bookings
        .filter(b => b.status !== 'cancelled')
        .reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);

      const platformEarnings = bookings
        .filter(b => b.status !== 'cancelled')
        .reduce((sum, b) => sum + (Number(b.platform_earnings) || 0), 0);

      const damagePoolTotal = damagePoolEntries.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
      const bookedNightsLast30 = bookings
        .filter(b => OCCUPANCY_BOOKING_STATUSES.has(b.status || ''))
        .reduce((sum, b) => sum + getOverlappingNights(b.check_in, b.check_out, thirtyDaysAgo, today), 0);
      const availableNightsLast30 = activeProperties * 30;
      const occupancyRate = availableNightsLast30 > 0
        ? Math.round((bookedNightsLast30 / availableNightsLast30) * 100)
        : 0;

      setStats({
        totalProperties: properties.length,
        activeProperties,
        inactiveProperties,
        totalBookings: bookings.length,
        upcomingBookings,
        pastBookings,
        cancelledBookings,
        totalGuests: guestCount,
        totalOwners: ownerCount,
        totalRevenue,
        platformEarnings,
        damagePoolTotal,
        occupancyRate
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return { stats, loading, error, refresh: loadStats };
}
