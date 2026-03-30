import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Circle, CheckCircle2, Clock } from 'lucide-react';

const onboardingTasks = [
  { label: 'Udfyld dine oplysninger', done: true },
  { label: 'Tilføj boliginformation', done: true },
  { label: 'Underskriv formidlingsaftale', done: false },
  { label: 'Tilføj bankoplysninger', done: false },
  { label: 'Upload billeder af boligen', done: false },
  { label: 'Godkend listing-tekst', done: false },
  { label: 'Bekræft sæsonkalender', done: false },
  { label: 'Klargør bolig til første gæst', done: false },
];

export default function OwnerTasks() {
  const completedCount = onboardingTasks.filter(t => t.done).length;
  const progress = Math.round((completedCount / onboardingTasks.length) * 100);

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Opgaver</h1>
          <p className="text-sm text-muted-foreground mt-1">Ting der mangler for at komme i gang</p>
        </div>

        {/* Progress */}
        <Card className="border-accent/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-foreground">Onboarding-fremskridt</span>
              <span className="text-sm font-bold text-accent">{progress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">{completedCount} af {onboardingTasks.length} opgaver afsluttet</p>
          </CardContent>
        </Card>

        {/* Task list */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Opgaveliste</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {onboardingTasks.map((task, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${task.done ? 'opacity-60' : 'hover:bg-muted/30'}`}>
                  {task.done ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground/40 shrink-0" />
                  )}
                  <span className={`text-sm ${task.done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {task.label}
                  </span>
                  {!task.done && i === completedCount && (
                    <Badge variant="outline" className="ml-auto text-[10px] bg-accent/15 text-accent border-accent/20">Næste</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </OwnerLayout>
  );
}
