import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { TreePine, Flame, UtensilsCrossed, Bed, Mountain, Sparkles } from 'lucide-react';

export interface ContentSection {
  title: string;
  body: string;
  image?: string;
}

interface ContentCarouselProps {
  sections: ContentSection[];
}

const sectionDecoIcons = [TreePine, Flame, UtensilsCrossed, Bed, Mountain, Sparkles];

function DecorativeBackground({ index, inView }: { index: number; inView: boolean }) {
  const Icon = sectionDecoIcons[index % sectionDecoIcons.length];
  return (
    <>
      <motion.div
        className="absolute -right-4 -bottom-4 pointer-events-none select-none"
        initial={{ opacity: 0, scale: 0.8, rotate: -15 }}
        animate={inView ? { opacity: 1, scale: 1, rotate: 0 } : {}}
        transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
      >
        <Icon className="h-28 w-28 text-primary/[0.04]" strokeWidth={1} />
      </motion.div>
      <motion.div
        className="absolute top-0 left-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="w-8 h-px bg-gradient-to-r from-primary/20 to-transparent" />
        <div className="w-px h-8 bg-gradient-to-b from-primary/20 to-transparent" />
      </motion.div>
    </>
  );
}

function BodyText({ body, inView }: { body: string; inView?: boolean }) {
  const lines = body.split('\n');
  let bulletIndex = 0;

  return (
    <div className="text-muted-foreground text-sm leading-relaxed space-y-1">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return null;

        if (/^[•–-]/.test(trimmed)) {
          const idx = bulletIndex++;
          return (
            <motion.div
              key={i}
              className="flex items-baseline gap-2.5 pl-0.5"
              initial={{ opacity: 0, x: -8 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.35, delay: 0.15 + idx * 0.04, ease: 'easeOut' }}
            >
              <span className="text-primary/60 text-[5px] mt-[5px] shrink-0">◆</span>
              <span>{trimmed.replace(/^[•–-]\s*/, '')}</span>
            </motion.div>
          );
        }

        const emojiMatch = trimmed.match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)\s+/u);
        if (emojiMatch) {
          return (
            <motion.div
              key={i}
              className="flex items-start gap-2.5 mt-3 first:mt-0"
              initial={{ opacity: 0, y: 6 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <span className="text-base leading-none mt-0.5">{emojiMatch[0].trim()}</span>
              <span className="font-medium text-foreground text-sm">
                {trimmed.replace(emojiMatch[0], '').split('\n')[0]}
              </span>
            </motion.div>
          );
        }

        if (trimmed.endsWith(':')) {
          return (
            <div key={i} className="mt-6 mb-2 first:mt-0">
              <motion.p
                className="font-semibold text-foreground/90 text-[10px] tracking-[0.18em] uppercase flex items-center gap-2"
                initial={{ opacity: 0, x: -6 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.35, delay: 0.1 }}
              >
                <span className="w-3 h-px bg-primary/30" />
                {trimmed}
              </motion.p>
            </div>
          );
        }

        return <p key={i}>{trimmed}</p>;
      })}
    </div>
  );
}

function SectionBadge({ index }: { index: number }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-[10px] text-primary/40 tracking-[0.25em] uppercase font-medium tabular-nums">
        {String(index + 1).padStart(2, '0')}
      </span>
      <span className="h-px w-6 bg-primary/15" />
    </div>
  );
}

function FeatureBlock({
  section,
  index,
  flip,
  fallbackImages,
}: {
  section: ContentSection;
  index: number;
  flip: boolean;
  fallbackImages: string[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });

  const img = section.image || fallbackImages[index % fallbackImages.length] || '/placeholder.svg';

  return (
    <div ref={ref} className="grid grid-cols-1 lg:grid-cols-[7fr_5fr] gap-5 lg:gap-10 items-center">
      <motion.div
        className={`relative overflow-hidden rounded-xl ${flip ? 'lg:order-1' : 'lg:order-2'}`}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.img
          src={img}
          alt={section.title}
          className="w-full aspect-[16/10] object-cover rounded-xl"
          loading="lazy"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </motion.div>

      <motion.div
        className={`relative overflow-hidden ${flip ? 'lg:order-2 lg:pl-4' : 'lg:order-1 lg:pr-4'}`}
        initial={{ opacity: 0, y: 12 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      >
        <DecorativeBackground index={index} inView={isInView} />
        <div className="relative z-10">
          <SectionBadge index={index} />
          <h3 className="font-display text-2xl md:text-3xl font-semibold text-primary mb-3 leading-snug">
            {section.title}
          </h3>
          <BodyText body={section.body} inView={isInView} />
        </div>
      </motion.div>
    </div>
  );
}

function PairedBlock({
  sections,
  startIndex,
  fallbackImages,
}: {
  sections: [ContentSection, ContentSection];
  startIndex: number;
  fallbackImages: string[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-8">
      {sections.map((section, i) => {
        const globalIdx = startIndex + i;
        const img = section.image || fallbackImages[globalIdx % fallbackImages.length] || '/placeholder.svg';

        return (
          <motion.div
            key={globalIdx}
            className="group relative overflow-hidden"
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative overflow-hidden rounded-lg mb-4">
              <motion.img
                src={img}
                alt={section.title}
                className="w-full aspect-[16/9] object-cover rounded-lg"
                loading="lazy"
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
            <div className="relative">
              <DecorativeBackground index={globalIdx} inView={isInView} />
              <div className="relative z-10">
                <SectionBadge index={globalIdx} />
                <h3 className="font-display text-2xl md:text-3xl font-semibold text-primary mb-2 leading-snug">
                  {section.title}
                </h3>
                <BodyText body={section.body} inView={isInView} />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export const ContentCarousel = ({ sections }: ContentCarouselProps) => {
  if (sections.length === 0) return null;

  const fallbackImages = sections.map((s) => s.image).filter(Boolean) as string[];

  const groups: React.ReactNode[] = [];
  let i = 0;
  let flipFeature = false;

  while (i < sections.length) {
    if (groups.length % 2 === 0 || i + 1 >= sections.length) {
      groups.push(
        <FeatureBlock
          key={`f-${i}`}
          section={sections[i]}
          index={i}
          flip={flipFeature}
          fallbackImages={fallbackImages}
        />
      );
      flipFeature = !flipFeature;
      i += 1;
    } else {
      groups.push(
        <PairedBlock
          key={`p-${i}`}
          sections={[sections[i], sections[i + 1]]}
          startIndex={i}
          fallbackImages={fallbackImages}
        />
      );
      i += 2;
    }
  }

  return (
    <div className="space-y-8 lg:space-y-12">
      {groups}
    </div>
  );
};
