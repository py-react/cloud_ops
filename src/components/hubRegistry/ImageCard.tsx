import React from 'react';
import { Star, Package, Download, ArrowDownToLine } from 'lucide-react';
import { DockerImage } from './types';
import { toast } from 'sonner';

interface ImageCardProps {
  image: DockerImage;
}

export function ImageCard({ image }: ImageCardProps) {

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow flex items-center gap-2">
      <div className="w-32 h-32 p-6">
        {image.logo_url ? (
          <img className={`w-full h-full`} src={image.logo_url.small} />
        ) : (
          <Package className="w-full h-full text-blue-500" />
        )}
      </div>
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex item-center gap-2">{image.name}
              <span className="cursor-pointer" onClick={async()=>{
                toast.info(`${image.name} started pulling`);
                const reasponse = await fetch("/api/packges", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    action: "pull",
                    pull_config: {
                      image: image.name,
                      registry: "docker.io",
                    },
                  }),

                }                
              );
              const responseData = await reasponse.json();
              if (responseData.error) {
                toast.error(responseData.message);
                return;
              }
              toast.success(responseData.message);
              }}>
                <ArrowDownToLine />
              </span>
            </h2>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              {image.publisher.name}
              {image.source === "verified_publisher" && (
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  Verified
                </span>
              )}
            </p>
          </div>
        </div>

        <p className="text-gray-600 mt-4 line-clamp-2">
          {image.short_description || "No description available"}
        </p>

        <div className="flex items-center gap-6 mt-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500" />
            <span>{image.star_count.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Download className="w-4 h-4 text-green-500" />
            <span>
              {image.rate_plans[0].repositories[0].pull_count.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}