import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MapPin, Users, Bed, Bath, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface PropertyCardProps {
  id: string;
  title: string;
  location: string;
  description: string;
  images: string[];
  price: number;
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  tags?: string[];
  isNew?: boolean;
  discount?: number;
}

export function PropertyCard({
  id,
  title,
  location,
  description,
  images,
  price,
  capacity,
  bedrooms,
  bathrooms,
  tags = [],
  isNew,
  discount,
}: PropertyCardProps) {
  const [currentImage, setCurrentImage] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };

  const toggleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  return (
    <Link to={`/property/${id}`}>
      <Card className="group overflow-hidden border-0 shadow-soft hover:shadow-elevated transition-all duration-300 bg-card">
        {/* Image Carousel */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={images[currentImage] || '/placeholder.svg'}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          
          {/* Image Navigation */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-card"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-card"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              
              {/* Image Dots */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.slice(0, 5).map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      idx === currentImage ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            {isNew && (
              <Badge className="bg-accent text-primary font-medium">
                Ny
              </Badge>
            )}
            {discount && (
              <Badge className="bg-destructive text-destructive-foreground font-medium">
                -{discount}%
              </Badge>
            )}
          </div>

          {/* Like Button */}
          <button
            onClick={toggleLike}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-card/80 flex items-center justify-center hover:bg-card transition-colors"
          >
            <Heart
              className={`w-5 h-5 transition-colors ${
                isLiked ? 'fill-destructive text-destructive' : 'text-primary'
              }`}
            />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="font-display text-lg font-semibold text-primary line-clamp-1 group-hover:text-accent transition-colors">
                {title}
              </h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5" />
                {location}
              </p>
            </div>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Details */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {capacity}
            </span>
            <span className="flex items-center gap-1">
              <Bed className="w-4 h-4" />
              {bedrooms}
            </span>
            <span className="flex items-center gap-1">
              <Bath className="w-4 h-4" />
              {bathrooms}
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div>
              <span className="text-xl font-bold text-primary">
                {price.toLocaleString('da-DK')} kr.
              </span>
              <span className="text-sm text-muted-foreground"> / nat</span>
            </div>
            <Button variant="gold" size="sm">
              Se detaljer
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  );
}
