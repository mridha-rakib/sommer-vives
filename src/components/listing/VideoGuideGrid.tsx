import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/lib/i18n';

interface ListingVideo {
  id: string;
  sort_order: number;
  thumbnail_url: string | null;
  emoji: string;
  title: string;
  youtube_id: string | null;
  video_url?: string | null;
  video_type?: string | null;
}

const videoGuideCopy = {
  da: {
    eyebrow: 'Videoguides',
    title: 'Alt er gjort nemt for dig',
    subtitle: 'Se vores korte videoer og bliv klar til dit ophold på få minutter',
    more: 'flere',
  },
  en: {
    eyebrow: 'Video guides',
    title: 'Everything is made easy for you',
    subtitle: 'Watch our short videos and get ready for your stay in minutes',
    more: 'more',
  },
};

export function VideoGuideGrid({ videos: videosProp, listingId }: { videos?: ListingVideo[]; listingId?: string }) {
  const { language } = useTranslation();
  const copy = language === 'en' ? videoGuideCopy.en : videoGuideCopy.da;
  const [fetchedVideos, setFetchedVideos] = useState<ListingVideo[]>([]);

  useEffect(() => {
    if (videosProp || !listingId) return;
    supabase
      .from('listing_videos')
      .select('id, sort_order, thumbnail_url, emoji, title, youtube_id, video_url, video_type')
      .eq('listing_id', listingId)
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => setFetchedVideos((data as unknown as ListingVideo[]) || []));
  }, [listingId, videosProp]);

  const videos = videosProp || fetchedVideos;
  const isMobile = useIsMobile();
  const [activeVideo, setActiveVideo] = useState<ListingVideo | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [activePage, setActivePage] = useState(0);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveVideo(null);
    };
    if (activeVideo) {
      document.addEventListener('keydown', handler);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [activeVideo]);

  useEffect(() => { setActivePage(0); }, [videos.length]);

  const getThumb = useCallback((v: ListingVideo): string => {
    if (v.youtube_id) return `https://img.youtube.com/vi/${v.youtube_id}/hqdefault.jpg`;
    return v.thumbnail_url || '/placeholder.svg';
  }, []);

  const canPlay = useCallback((v: ListingVideo) => !!(v.youtube_id || v.video_url), []);

  if (videos.length === 0) return null;

  const perPage = isMobile ? 2 : 4;
  const pageCount = Math.ceil(videos.length / perPage);
  const hasMore = activePage < pageCount - 1;
  const visibleVideos = videos.slice(activePage * perPage, activePage * perPage + perPage);

  return (
    <>
      <section className="relative py-4 lg:py-6">
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6 }}
            className="mb-5 lg:mb-6 text-center"
          >
            <span className="inline-block text-[11px] font-medium tracking-[0.2em] uppercase text-primary/80 mb-2">
              {copy.eyebrow}
            </span>
            <h2 className="font-display text-2xl md:text-3xl font-semibold text-foreground mb-2">
              {copy.title}
            </h2>
            <p className="text-muted-foreground text-sm md:text-base max-w-lg mx-auto">
              {copy.subtitle}
            </p>
          </motion.div>

          <div className="flex items-start justify-center gap-6 md:gap-8 lg:gap-10">
            <AnimatePresence>
              {activePage > 0 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setActivePage(p => Math.max(0, p - 1))}
                  className="mt-6 sm:mt-8 md:mt-10 flex-shrink-0"
                >
                  <div className="w-[50px] h-[50px] sm:w-[60px] sm:h-[60px] rounded-full border border-border/40 bg-card/50 hover:bg-card hover:border-primary/30 transition-all duration-300 flex items-center justify-center">
                    <ChevronLeft className="h-5 w-5 text-muted-foreground" />
                  </div>
                </motion.button>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.div
                key={activePage}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                className="flex items-start justify-center gap-6 md:gap-8 lg:gap-10"
              >
                {visibleVideos.map((video) => {
                  const hasVideo = canPlay(video);
                  const isHovered = hoveredId === video.id;

                  return (
                    <div key={video.id} className="flex flex-col items-center" style={{ width: isMobile ? '120px' : '130px' }}>
                      <button
                        onClick={() => hasVideo && setActiveVideo(video)}
                        onMouseEnter={() => setHoveredId(video.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        className="group relative focus:outline-none"
                      >
                        <div className="relative w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] md:w-[130px] md:h-[130px] rounded-full overflow-hidden bg-card border-2 border-border/30 group-hover:border-primary/40 transition-all duration-500">
                          <img src={getThumb(video)} alt={video.title} className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-110" loading="lazy" />
                          <div className={`absolute inset-0 rounded-full transition-all duration-400 ${isHovered ? 'bg-black/40' : 'bg-black/10'}`} />
                          {hasVideo && (
                            <motion.div
                              initial={false}
                              animate={{ scale: isHovered ? 1 : 0.85, opacity: isHovered ? 1 : 0.6 }}
                              transition={{ duration: 0.3 }}
                              className="absolute inset-0 flex items-center justify-center"
                            >
                              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/25 flex items-center justify-center">
                                <Play className="h-3 w-3 text-white ml-0.5" fill="white" />
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </button>
                      <div className="mt-2 text-center px-0.5">
                        <span className="text-[11px] sm:text-xs font-medium text-foreground/80 leading-tight line-clamp-2">
                          {video.emoji} {video.title}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            </AnimatePresence>

            {hasMore && (
              <motion.button
                onClick={() => setActivePage(p => Math.min(pageCount - 1, p + 1))}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                className="mt-6 sm:mt-8 md:mt-10 flex-shrink-0 group flex flex-col items-center"
              >
                <div className="w-[50px] h-[50px] sm:w-[60px] sm:h-[60px] rounded-full border border-border/40 bg-card/50 hover:bg-card hover:border-primary/30 transition-all duration-300 flex items-center justify-center">
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <span className="mt-2 text-[10px] text-muted-foreground/50 tracking-wide uppercase font-medium">
                  {videos.length - (activePage + 1) * perPage} {copy.more}
                </span>
              </motion.button>
            )}
          </div>

          {pageCount > 1 && (
            <div className="mt-4 flex justify-center gap-1.5">
              {Array.from({ length: pageCount }).map((_, i) => (
                <button key={i} onClick={() => setActivePage(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === activePage ? 'w-5 bg-primary' : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50'}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <AnimatePresence>
        {activeVideo && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8"
            onClick={() => setActiveVideo(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative w-full max-w-4xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => setActiveVideo(null)} className="absolute -top-12 right-0 p-2 rounded-full text-white/50 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
              <div className="mb-3 flex items-center gap-2.5">
                <span className="text-lg">{activeVideo.emoji}</span>
                <span className="text-sm font-medium text-white/80 font-display">{activeVideo.title}</span>
              </div>
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video shadow-2xl ring-1 ring-white/10">
                {activeVideo.youtube_id ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${activeVideo.youtube_id}?autoplay=1&rel=0&modestbranding=1`}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={activeVideo.title}
                  />
                ) : (
                  <video src={activeVideo.video_url || ''} className="w-full h-full" controls autoPlay playsInline />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
