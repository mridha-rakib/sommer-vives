import { Check, Star, Shield, Heart, MessageCircle } from 'lucide-react';

const badges = [
  { icon: Star, label: 'Fremragende', sublabel: '4.8 på Trustpilot' },
  { icon: Shield, label: 'Dansk virksomhed' },
  { icon: Check, label: 'Gratis afbestilling' },
  { icon: Heart, label: 'Ingen depositum' },
  { icon: MessageCircle, label: 'Dansk support' },
];

interface TrustBadgesProps {
  variant?: 'light' | 'dark';
  className?: string;
}

export function TrustBadges({ variant = 'dark', className = '' }: TrustBadgesProps) {
  const textColor = variant === 'dark' ? 'text-foreground' : 'text-foreground';
  const mutedColor = variant === 'dark' ? 'text-foreground/70' : 'text-muted-foreground';
  const bgColor = variant === 'dark' ? 'bg-card' : 'bg-card';
  const borderColor = variant === 'dark' ? 'border-foreground/20' : 'border-border';

  return (
    <div className={`${bgColor} py-4 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-6 md:gap-10 overflow-x-auto">
          {badges.map((badge, index) => (
            <div
              key={index}
              className={`flex items-center gap-2 whitespace-nowrap ${
                index > 0 ? `border-l ${borderColor} pl-6 md:pl-10` : ''
              }`}
            >
              <badge.icon className={`w-4 h-4 ${textColor}`} />
              <div className="flex flex-col">
                <span className={`text-sm font-medium ${textColor}`}>{badge.label}</span>
                {badge.sublabel && (
                  <span className={`text-xs ${mutedColor}`}>{badge.sublabel}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
