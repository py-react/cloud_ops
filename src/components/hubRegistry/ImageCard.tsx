import React from 'react';
import { Star, Package, Download, ArrowDownToLine, CheckCircle2 } from 'lucide-react';
import { DockerImage } from './types';
import { toast } from 'sonner';
import { Button } from '../ui/button';

interface ImageCardProps {
  image: DockerImage;
}

export function ImageCard({ image }: ImageCardProps) {
  const handlePull = async () => {
    toast.info(`${image.name} started pulling`);
    try {
      const response = await fetch("/api/packges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "pull",
          pull_config: {
            image: image.name,
            registry: "docker.io",
          },
        }),
      });
      const responseData = await response.json();
      if (responseData.error) {
        toast.error(responseData.message);
        return;
      }
      toast.success(responseData.message);
    } catch (e) {
      toast.error("Failed to initiate pull");
    }
  };

  return (
    <div className="group bg-background border border-border/40 rounded-xl overflow-hidden hover:border-primary/30 hover:shadow-sm transition-all duration-300">
      <div className="flex items-stretch gap-0">
        <div className="w-40 bg-muted/30 flex items-center justify-center p-8 shrink-0 border-r border-border/10">
          {image.logo_url ? (
            <img className="w-full h-full object-contain" src={image.logo_url.small} alt={image.name} />
          ) : (
            <Package className="w-12 h-12 text-muted-foreground/40 group-hover:text-primary/40 transition-colors" />
          )}
        </div>

        <div className="flex-1 p-6 flex flex-col justify-between min-w-0">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-foreground truncate">{image.name}</h2>
                  {image.source === "verified_publisher" && (
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 capitalize">
                  {image.publisher.name}
                  {image.source === "verified_publisher" && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-border" />
                      <span className="text-primary font-semibold">Verified Publisher</span>
                    </>
                  )}
                </p>
              </div>

              <Button
                onClick={handlePull}
                variant="secondary"
                size="sm"
                className="h-8 rounded-md font-bold gap-2 bg-primary/5 hover:bg-primary/10 text-primary border border-primary/10"
              >
                <ArrowDownToLine className="h-3.5 w-3.5" />
                Pull
              </Button>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 font-medium">
              {image.short_description || "No registry description provided for this image."}
            </p>
          </div>

          <div className="flex items-center gap-5 pt-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">
            <div className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-yellow-500/80 fill-yellow-500/10" />
              <span>{image.star_count.toLocaleString()} stars</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-blue-500/80" />
              <span>
                {image.rate_plans[0].repositories[0].pull_count.toLocaleString()} pulls
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}