import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, User, Mail, Phone, Shield, Crown, Briefcase, UserCheck, ClipboardCheck } from 'lucide-react';
import emilAvatar from '@/assets/emil-klockmann.jpg';

interface StaffAssignment {
  id?: string;
  listing_id: string;
  staff_role: string;
  staff_name: string;
  staff_email: string | null;
  staff_phone: string | null;
}

const STAFF_ROLES = [
  {
    key: 'annoncerende_raadgiver',
    label: 'Annoncerende udlejningsrådgiver',
    description: 'Den person som vises på listingen som kontaktperson for gæster',
    icon: User,
    color: 'bg-blue-500/10 text-blue-600',
    editable: true,
  },
  {
    key: 'kommissionerende_raadgiver',
    label: 'Kommissionerende udlejningsrådgiver',
    description: 'Personen der har taget ejendommen i kommission – bruges til provisionsberegning og statistik',
    icon: Briefcase,
    color: 'bg-amber-500/10 text-amber-600',
    editable: true,
  },
  {
    key: 'ansvarlig_raadgiver',
    label: 'Ansvarlig udlejningsrådgiver',
    description: 'Altid den samme som kommissionerende rådgiver',
    icon: UserCheck,
    color: 'bg-emerald-500/10 text-emerald-600',
    editable: false,
    mirrorOf: 'kommissionerende_raadgiver',
  },
  {
    key: 'udlejningschef',
    label: 'Udlejningschef',
    description: 'Altid Emil W. Klockmann',
    icon: Crown,
    color: 'bg-primary/10 text-primary',
    editable: false,
    fixed: { name: 'Emil W. Klockmann', email: 'info@sommervibes.dk', phone: '+45 12 34 56 78' },
  },
  {
    key: 'sagsbehandler',
    label: 'Sagsbehandler',
    description: 'Den person som har behandlet sagen i før-salg fasen',
    icon: ClipboardCheck,
    color: 'bg-purple-500/10 text-purple-600',
    editable: true,
  },
];

const DEFAULT_STAFF: Record<string, { name: string; email: string; phone: string }> = {
  udlejningschef: { name: 'Emil W. Klockmann', email: 'info@sommervibes.dk', phone: '+45 12 34 56 78' },
};

export function ListingStaffTab({ listingId }: { listingId: string }) {
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Record<string, StaffAssignment>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => { loadStaff(); }, [listingId]);

  const loadStaff = async () => {
    setLoading(true);
    const { data } = await supabase.from('listing_staff').select('*').eq('listing_id', listingId);
    const map: Record<string, StaffAssignment> = {};

    // Set defaults
    STAFF_ROLES.forEach(role => {
      if (role.fixed) {
        map[role.key] = {
          listing_id: listingId, staff_role: role.key,
          staff_name: role.fixed.name, staff_email: role.fixed.email, staff_phone: role.fixed.phone,
        };
      }
    });

    // Load from DB
    data?.forEach(row => {
      map[row.staff_role] = row as StaffAssignment;
    });

    // Mirror: ansvarlig = kommissionerende
    if (map['kommissionerende_raadgiver']) {
      map['ansvarlig_raadgiver'] = {
        ...map['ansvarlig_raadgiver'],
        listing_id: listingId, staff_role: 'ansvarlig_raadgiver',
        staff_name: map['kommissionerende_raadgiver'].staff_name,
        staff_email: map['kommissionerende_raadgiver'].staff_email,
        staff_phone: map['kommissionerende_raadgiver'].staff_phone,
      };
    }

    setAssignments(map);
    setLoading(false);
    setDirty(false);
  };

  const updateField = (roleKey: string, field: keyof StaffAssignment, value: string) => {
    setAssignments(prev => {
      const updated = { ...prev };
      if (!updated[roleKey]) {
        updated[roleKey] = { listing_id: listingId, staff_role: roleKey, staff_name: '', staff_email: null, staff_phone: null };
      }
      updated[roleKey] = { ...updated[roleKey], [field]: value || null };

      // Mirror ansvarlig = kommissionerende
      if (roleKey === 'kommissionerende_raadgiver') {
        updated['ansvarlig_raadgiver'] = {
          ...updated['ansvarlig_raadgiver'] || { listing_id: listingId, staff_role: 'ansvarlig_raadgiver', staff_name: '', staff_email: null, staff_phone: null },
          staff_name: updated[roleKey].staff_name,
          staff_email: updated[roleKey].staff_email,
          staff_phone: updated[roleKey].staff_phone,
        };
      }

      return updated;
    });
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const role of STAFF_ROLES) {
        const assignment = assignments[role.key];
        if (!assignment || !assignment.staff_name) continue;

        if (assignment.id) {
          await supabase.from('listing_staff').update({
            staff_name: assignment.staff_name,
            staff_email: assignment.staff_email,
            staff_phone: assignment.staff_phone,
          }).eq('id', assignment.id);
        } else {
          await supabase.from('listing_staff').upsert({
            listing_id: listingId,
            staff_role: role.key,
            staff_name: assignment.staff_name,
            staff_email: assignment.staff_email,
            staff_phone: assignment.staff_phone,
          }, { onConflict: 'listing_id,staff_role' });
        }
      }
      toast({ title: 'Medarbejdere gemt' });
      setDirty(false);
      loadStaff();
    } catch (e) {
      toast({ title: 'Fejl ved gemning', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-base font-semibold text-foreground">Medarbejdere på sagen</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Tildel roller og ansvar til medarbejdere</p>
        </div>
        {dirty && (
          <Button size="sm" onClick={handleSave} disabled={saving} className="rounded-xl gap-1.5">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Gem ændringer
          </Button>
        )}
      </div>

      {/* Role cards */}
      <div className="space-y-4">
        {STAFF_ROLES.map(role => {
          const Icon = role.icon;
          const assignment = assignments[role.key];
          const isFixed = !!role.fixed;
          const isMirror = !!role.mirrorOf;
          const isEditable = role.editable && !isFixed && !isMirror;

          return (
            <div key={role.key} className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 ${role.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{role.label}</span>
                    {isFixed && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">Fast</Badge>}
                    {isMirror && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">Auto-synk</Badge>}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{role.description}</p>
                </div>

                {/* Avatar for fixed/assigned */}
                {(isFixed || assignment?.staff_name) && (
                  <div className="flex items-center gap-2 shrink-0">
                    {isFixed && role.key === 'udlejningschef' ? (
                      <img src={emilAvatar} alt="Emil" className="w-8 h-8 rounded-full object-cover border border-primary/20" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                        {(assignment?.staff_name || '?')[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {isEditable ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-muted/20 rounded-xl p-3">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Navn</Label>
                    <Input
                      className="rounded-lg h-8 text-sm"
                      placeholder="Medarbejdernavn"
                      value={assignment?.staff_name || ''}
                      onChange={e => updateField(role.key, 'staff_name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Email</Label>
                    <Input
                      className="rounded-lg h-8 text-sm"
                      placeholder="email@sommervibes.dk"
                      value={assignment?.staff_email || ''}
                      onChange={e => updateField(role.key, 'staff_email', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Telefon</Label>
                    <Input
                      className="rounded-lg h-8 text-sm"
                      placeholder="+45 ..."
                      value={assignment?.staff_phone || ''}
                      onChange={e => updateField(role.key, 'staff_phone', e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-muted/10 rounded-xl p-3">
                  <div>
                    <p className="text-[11px] text-muted-foreground">Navn</p>
                    <p className="text-sm font-medium">{assignment?.staff_name || '—'}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-muted-foreground" />
                    <div>
                      <p className="text-[11px] text-muted-foreground">Email</p>
                      <p className="text-sm">{assignment?.staff_email || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-muted-foreground" />
                    <div>
                      <p className="text-[11px] text-muted-foreground">Telefon</p>
                      <p className="text-sm">{assignment?.staff_phone || '—'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
