import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const TAX_FREE_AMOUNT = 50200; // 2026 bundfradrag

function calculateTax(annualIncome: number) {
  const taxFree = Math.min(annualIncome, TAX_FREE_AMOUNT);
  const remaining = Math.max(0, annualIncome - TAX_FREE_AMOUNT);
  const taxFreeProfit = remaining * 0.4; // 40% skattefri
  const taxableProfit = remaining * 0.6;
  const tax = taxableProfit * 0.34; // Gns. 34% skat
  const netFromTaxable = taxableProfit - tax;

  return {
    taxFree,
    taxFreeProfit,
    netFromTaxable,
    tax,
    afterTax: taxFree + taxFreeProfit + netFromTaxable,
  };
}

export function TaxBenefitSection() {
  const [income] = useState(60000);
  const result = calculateTax(income);

  const chartData = [
    { name: 'Skattefrit fradrag', value: result.taxFree, color: 'hsl(var(--primary))' },
    { name: '40% skattefri fortjeneste', value: result.taxFreeProfit, color: 'hsl(158 40% 35%)' },
    { name: 'Gevinst af de sidste 60%', value: result.netFromTaxable, color: 'hsl(158 40% 55%)' },
    { name: 'Gns. 34% beskatning', value: result.tax, color: 'hsl(15 60% 40%)' },
  ];

  const formatDKK = (n: number) =>
    new Intl.NumberFormat('da-DK', { maximumFractionDigits: 0 }).format(n);

  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container mx-auto px-4 md:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-6">
            Tjen {formatDKK(TAX_FREE_AMOUNT)} kr. skattefrit
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mb-12 leading-relaxed">
            Når du lejer ud gennem SommerVibes, kan du udnytte bundfradraget og få mere
            ud af dine udlejninger. Hvis din årlige indtjening er{' '}
            <strong className="text-primary">{formatDKK(income)} DKK</strong>, vil du
            typisk tjene omkring{' '}
            <strong className="text-primary">{formatDKK(result.afterTax)} DKK</strong>{' '}
            efter skat.
          </p>

          <div className="flex flex-col md:flex-row items-center gap-12">
            {/* Donut Chart */}
            <div className="w-64 h-64 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={110}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1">
              {chartData.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div
                    className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <div>
                    <div className="font-semibold text-primary">
                      {formatDKK(item.value)} DKK
                    </div>
                    <div className="text-sm text-muted-foreground">{item.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10">
            <Link to="/beregn-lejeindtaegt">
              <Button variant="link" className="text-primary gap-2 p-0 text-base font-medium">
                Se beregning
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
