import { CheckCircle2, AlertCircle, MinusCircle } from 'lucide-react';
import { StatusChip, type StatusVariant } from '@/components/admin/ui/StatusChip';
import { cn } from '@/lib/utils';

interface MappingRow {
  internalField: string;
  beds24Field: string;
  value: string | number | null | undefined;
  required: boolean;
}

interface Beds24MappingListing {
  name?: string | null;
  description?: string | null;
  long_description?: string | null;
  max_guests?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  amenities?: string[] | null;
  images?: string[] | null;
  base_price_per_night?: number | null;
  min_nights?: number | null;
  checkin_info?: string | null;
  checkout_info?: string | null;
  check_in_time?: string | null;
  check_out_time?: string | null;
}

function buildMappingRows(listing: Beds24MappingListing): MappingRow[] {
  return [
    { internalField: 'Internt navn', beds24Field: 'propName', value: listing.name, required: true },
    { internalField: 'Offentlig titel', beds24Field: 'propName (public)', value: listing.name, required: true },
    { internalField: 'Kort beskrivelse', beds24Field: 'propDescription', value: listing.description, required: true },
    { internalField: 'Lang beskrivelse', beds24Field: 'propDescription2', value: listing.long_description, required: false },
    { internalField: 'Max gæster', beds24Field: 'maxGuests', value: listing.max_guests, required: true },
    { internalField: 'Soveværelser', beds24Field: 'numBedrooms', value: listing.bedrooms, required: true },
    { internalField: 'Badeværelser', beds24Field: 'numBathrooms', value: listing.bathrooms, required: true },
    { internalField: 'Faciliteter', beds24Field: 'amenities[]', value: listing.amenities?.length ? `${listing.amenities.length} valgt` : null, required: true },
    { internalField: 'Billeder', beds24Field: 'images[]', value: listing.images?.length ? `${listing.images.length} billeder` : null, required: true },
    { internalField: 'Basispris / nat', beds24Field: 'priceDefault', value: listing.base_price_per_night ? `${(listing.base_price_per_night / 100).toLocaleString('da-DK')} kr` : null, required: true },
    { internalField: 'Sæsonpriser', beds24Field: 'priceRules[]', value: null, required: false }, // checked separately
    { internalField: 'Min. ophold', beds24Field: 'minStay', value: listing.min_nights, required: false },
    { internalField: 'Check-in info', beds24Field: 'arrivalInstructions', value: listing.checkin_info || listing.check_in_time, required: false },
    { internalField: 'Check-out info', beds24Field: 'departureInstructions', value: listing.checkout_info || listing.check_out_time, required: false },
  ];
}

function isValid(row: MappingRow): boolean {
  if (row.value === null || row.value === undefined || row.value === '' || row.value === 0) return false;
  return true;
}

interface Props {
  listing: Beds24MappingListing;
}

export function Beds24MappingSection({ listing }: Props) {
  const rows = buildMappingRows(listing);
  const requiredRows = rows.filter(r => r.required);
  const filledRequired = requiredRows.filter(r => isValid(r)).length;
  const allRequiredFilled = filledRequired === requiredRows.length;
  const totalFilled = rows.filter(r => isValid(r)).length;

  let summaryStatus: { label: string; variant: StatusVariant; description: string };
  if (allRequiredFilled) {
    summaryStatus = { label: 'Klar til push', variant: 'success', description: `Alle ${requiredRows.length} påkrævede felter er udfyldt (${totalFilled}/${rows.length} total)` };
  } else {
    const missing = requiredRows.length - filledRequired;
    summaryStatus = { label: `${missing} påkrævede mangler`, variant: 'danger', description: `${filledRequired}/${requiredRows.length} påkrævede felter udfyldt — kan ikke pushes endnu` };
  }

  return (
    <div className="rounded-xl border border-border/40 bg-card/60 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-border/30 flex items-center justify-between">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">Beds24 Mapping</p>
        <StatusChip label={summaryStatus.label} variant={summaryStatus.variant} dot size="md" />
      </div>

      {/* Summary */}
      <div className="px-5 py-2.5 bg-muted/10 border-b border-border/20">
        <p className="text-[11px] text-muted-foreground">{summaryStatus.description}</p>
      </div>

      {/* Mapping table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/20 text-muted-foreground">
              <th className="text-left px-4 py-2 font-medium">SommerVibes felt</th>
              <th className="text-left px-4 py-2 font-medium">Beds24 felt</th>
              <th className="text-left px-4 py-2 font-medium">Værdi</th>
              <th className="text-center px-4 py-2 font-medium w-16">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const valid = isValid(row);
              return (
                <tr key={i} className={cn('border-b border-border/10 transition-colors', !valid && row.required && 'bg-red-500/[0.03]')}>
                  <td className="px-4 py-2 font-medium text-foreground">
                    {row.internalField}
                    {row.required && <span className="text-red-400 ml-0.5">*</span>}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground font-mono text-[11px]">{row.beds24Field}</td>
                  <td className="px-4 py-2 text-muted-foreground max-w-[200px] truncate">
                    {valid
                      ? (typeof row.value === 'string' && row.value.length > 60 ? row.value.slice(0, 60) + '…' : String(row.value))
                      : <span className="italic text-muted-foreground/50">Mangler</span>
                    }
                  </td>
                  <td className="px-4 py-2 text-center">
                    {valid
                      ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mx-auto" />
                      : row.required
                        ? <AlertCircle className="h-3.5 w-3.5 text-red-400 mx-auto" />
                        : <MinusCircle className="h-3.5 w-3.5 text-muted-foreground/40 mx-auto" />
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
