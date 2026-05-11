import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  CheckCircle2, Circle, Clock, ArrowRight, Sparkles, 
  FileSignature, Camera, Key, Globe, CalendarDays, CreditCard,
  Upload, Wifi, BedDouble, Star, Rocket, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getOwnerPhotoCount,
  getOwnerTaskCompletion,
  getOwnerTaskSignals,
  type OwnerTaskCompletion,
  type OwnerTaskSignals,
} from '@/lib/owner-tasks-api';
import { useTranslation } from '@/lib/i18n';

interface SmartTask {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  done: boolean;
  href: string;
  category: 'setup' | 'listing' | 'operations';
  priority: number;
}

export default function OwnerTasks() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [signals, setSignals] = useState<OwnerTaskSignals | null>(null);
  const [completion, setCompletion] = useState<OwnerTaskCompletion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    try {
      const data = await getOwnerTaskSignals(user.id);
      setSignals(data);
      setCompletion(getOwnerTaskCompletion(data));
    } finally {
      setLoading(false);
    }
  };

  const photoCount = signals ? getOwnerPhotoCount(signals) : 0;
  const done = completion || {
    profile: false,
    property: false,
    agreement: false,
    bank: false,
    photos: false,
    description: false,
    calendar: false,
    keybox: false,
    wifi: false,
    publish: false,
  };

  const tasks: SmartTask[] = [
    {
      id: 'profile', label: t('owner.tasks.profile.label'), description: t('owner.tasks.profile.description'),
      icon: Star, done: done.profile, href: '/owner/settings', category: 'setup', priority: 1,
    },
    {
      id: 'property', label: t('owner.tasks.property.label'), description: t('owner.tasks.property.description'),
      icon: BedDouble, done: done.property, href: '/owner/property', category: 'setup', priority: 2,
    },
    {
      id: 'agreement', label: t('owner.tasks.agreement.label'), description: t('owner.tasks.agreement.description'),
      icon: FileSignature, done: done.agreement, href: '/owner/agreement', category: 'setup', priority: 3,
    },
    {
      id: 'bank', label: t('owner.tasks.bank.label'), description: t('owner.tasks.bank.description'),
      icon: CreditCard, done: done.bank, href: '/owner/settings', category: 'setup', priority: 4,
    },
    {
      id: 'photos', label: t('owner.tasks.photos.label'), description: t('owner.tasks.photos.description').replace('{count}', String(photoCount)),
      icon: Camera, done: done.photos, href: '/owner/property', category: 'listing', priority: 5,
    },
    {
      id: 'description', label: t('owner.tasks.description.label'), description: t('owner.tasks.description.description'),
      icon: Upload, done: done.description, href: '/owner/property', category: 'listing', priority: 6,
    },
    {
      id: 'calendar', label: t('owner.tasks.calendar.label'), description: t('owner.tasks.calendar.description'),
      icon: CalendarDays, done: done.calendar, href: '/owner/calendar', category: 'operations', priority: 7,
    },
    {
      id: 'keybox', label: t('owner.tasks.keybox.label'), description: t('owner.tasks.keybox.description'),
      icon: Key, done: done.keybox, href: '/owner/support', category: 'operations', priority: 8,
    },
    {
      id: 'wifi', label: t('owner.tasks.wifi.label'), description: t('owner.tasks.wifi.description'),
      icon: Wifi, done: done.wifi, href: '/owner/property', category: 'operations', priority: 9,
    },
    {
      id: 'publish', label: t('owner.tasks.publish.label'), description: t('owner.tasks.publish.description'),
      icon: Globe, done: done.publish, href: '/owner/property', category: 'operations', priority: 10,
    },
  ];

  const completedCount = tasks.filter(t => t.done).length;
  const progress = Math.round((completedCount / tasks.length) * 100);
  const nextTask = tasks.find(t => !t.done);

  const categories = [
    { key: 'setup', label: t('owner.tasks.category.setup'), tasks: tasks.filter(t => t.category === 'setup') },
    { key: 'listing', label: t('owner.tasks.category.listing'), tasks: tasks.filter(t => t.category === 'listing') },
    { key: 'operations', label: t('owner.tasks.category.operations'), tasks: tasks.filter(t => t.category === 'operations') },
  ];

  if (loading) {
    return (
      <OwnerLayout>
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">{t('owner.tasks.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('owner.tasks.subtitle')}</p>
        </div>

        {/* Progress header */}
        <Card className="border-accent/20 overflow-hidden">
          <div className="bg-gradient-to-br from-accent/10 via-accent/5 to-transparent">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                    <Rocket className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{t('owner.tasks.progressTitle')}</div>
                    <div className="text-xs text-muted-foreground">{t('owner.tasks.progressText').replace('{completed}', String(completedCount)).replace('{total}', String(tasks.length))}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-3xl font-bold text-accent">{progress}%</div>
                </div>
              </div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div 
                  className="h-full rounded-full bg-accent transition-all duration-500" 
                  style={{ width: `${progress}%` }} 
                />
              </div>

              {/* Next recommended action */}
              {nextTask && (
                <Link to={nextTask.href}>
                  <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-accent/10 border border-accent/20 hover:bg-accent/15 transition-colors cursor-pointer group">
                    <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                      <nextTask.icon className="w-4 h-4 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-accent">{t('owner.tasks.nextRecommended')}</div>
                      <div className="text-xs text-foreground">{nextTask.label}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-accent group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </div>
                </Link>
              )}
            </CardContent>
          </div>
        </Card>

        {/* Task categories */}
        {categories.map(cat => {
          const catDone = cat.tasks.filter(t => t.done).length;
          return (
            <Card key={cat.key}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{cat.label}</CardTitle>
                  <Badge variant="outline" className="text-[10px]">
                    {catDone}/{cat.tasks.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="space-y-1">
                  {cat.tasks.map((task) => {
                    const isNext = task === nextTask;
                    return (
                      <Link key={task.id} to={task.href}>
                        <div className={cn(
                          'flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer group',
                          task.done ? 'opacity-50' : isNext ? 'bg-accent/5 border border-accent/20' : 'hover:bg-muted/30'
                        )}>
                          {task.done ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                          ) : (
                            <Circle className={cn('w-5 h-5 shrink-0', isNext ? 'text-accent' : 'text-muted-foreground/30')} />
                          )}
                          <task.icon className={cn(
                            'w-4 h-4 shrink-0',
                            task.done ? 'text-muted-foreground' : isNext ? 'text-accent' : 'text-muted-foreground/50'
                          )} />
                          <div className="flex-1 min-w-0">
                            <div className={cn(
                              'text-sm',
                              task.done ? 'text-muted-foreground line-through' : 'text-foreground font-medium'
                            )}>
                              {task.label}
                            </div>
                            <div className="text-[11px] text-muted-foreground">{task.description}</div>
                          </div>
                          {isNext && (
                            <Badge className="bg-accent text-accent-foreground border-0 text-[10px] shrink-0">
                              {t('owner.tasks.next')}
                            </Badge>
                          )}
                          {!task.done && !isNext && (
                            <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground shrink-0" />
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Completion message */}
        {progress === 100 && (
          <Card className="border-emerald-400/30 bg-emerald-400/5">
            <CardContent className="p-6 text-center">
              <Sparkles className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <h3 className="font-display text-xl font-bold text-foreground mb-2">{t('owner.tasks.completeTitle')}</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                {t('owner.tasks.completeDescription')}
              </p>
              <Link to="/owner">
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                  {t('owner.tasks.goDashboard')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </OwnerLayout>
  );
}
