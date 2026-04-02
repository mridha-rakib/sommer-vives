import { useState } from 'react';
import { ProfilePopover } from '@/components/admin/ProfilePopover';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { Eye, MoreHorizontal, MessageSquare, Edit, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Booking } from '@/types/admin';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface BookingsTableProps {
  bookings: Booking[];
  compact?: boolean;
  onStatusChange?: (bookingId: string, status: string) => void;
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  checked_in: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  completed: 'bg-gray-100 text-gray-800 border-gray-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

const statusLabels: Record<string, string> = {
  pending: 'Afventer',
  confirmed: 'Bekræftet',
  checked_in: 'Checked-in',
  completed: 'Afsluttet',
  cancelled: 'Annulleret',
};

const channelLabels: Record<string, string> = {
  direct: 'Direkte',
  airbnb: 'Airbnb',
  booking_com: 'Booking.com',
  vrbo: 'VRBO',
  other: 'Anden',
};

export function BookingsTable({ bookings, compact = false, onStatusChange }: BookingsTableProps) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">Sagsnr.</TableHead>
            <TableHead className="font-semibold">Ankomst</TableHead>
            <TableHead className="font-semibold">Afrejse</TableHead>
            {!compact && <TableHead className="font-semibold">Bolig</TableHead>}
            <TableHead className="font-semibold">Gæst</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            {!compact && <TableHead className="font-semibold">Kanal</TableHead>}
            <TableHead className="font-semibold text-right">Total</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.length === 0 ? (
            <TableRow>
              <TableCell colSpan={compact ? 7 : 9} className="text-center py-8 text-muted-foreground">
                Ingen bookinger fundet
              </TableCell>
            </TableRow>
          ) : (
            bookings.map((booking) => (
              <TableRow key={booking.id} className="hover:bg-muted/30">
                <TableCell className="font-mono text-sm">
                  {booking.case_number || booking.id.slice(0, 8)}
                </TableCell>
                <TableCell>
                  {format(new Date(booking.check_in), 'd. MMM yyyy', { locale: da })}
                </TableCell>
                <TableCell>
                  {format(new Date(booking.check_out), 'd. MMM yyyy', { locale: da })}
                </TableCell>
                {!compact && (
                  <TableCell className="max-w-[200px] truncate">
                    {booking.property?.title || 'N/A'}
                  </TableCell>
                )}
                <TableCell>
                  {booking.guest_name || booking.guest?.name || 'N/A'}
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[booking.status]} variant="outline">
                    {statusLabels[booking.status]}
                  </Badge>
                </TableCell>
                {!compact && (
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">
                      {channelLabels[booking.source_channel]}
                    </Badge>
                  </TableCell>
                )}
                <TableCell className="text-right font-medium">
                  {booking.total_amount.toLocaleString('da-DK')} {booking.currency}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/admin/bookings/${booking.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          Se detaljer
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Rediger
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Send besked
                      </DropdownMenuItem>
                      {booking.status !== 'cancelled' && (
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => onStatusChange?.(booking.id, 'cancelled')}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Annuller
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
