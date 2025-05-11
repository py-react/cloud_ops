import React from 'react';
import { DockerImage } from './types';
import { ImageCard } from './ImageCard';

interface ImageListProps {
  images: DockerImage[];
}

export function ImageList({ images }: ImageListProps) {
  if (images.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No images found matching your search.
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {images.map((image) => (
        <ImageCard 
          key={image.name} 
          image={image} 
        />
      ))}
    </div>
  );
}