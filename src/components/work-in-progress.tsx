
import React from 'react'
import { Construction, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface FullPageWorkInProgressProps {
  title?: string
  message?: string
  ctaText?: string
  ctaLink?: string
}

export function WorkInProgress({
  title = 'Work in Progress',
  message = "We're working hard to bring you something amazing. Please check back soon!",
  ctaText = 'Learn More',
  ctaLink = undefined,
}: FullPageWorkInProgressProps) {

  return (
    <div className="h-[80vh] flex items-center justify-center p-4 w-full">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-2xl p-8 text-center space-y-6">
        <Construction className="w-20 h-20 mx-auto text-blue-500" aria-hidden="true" />
        <h1 className="text-4xl font-bold text-gray-900">{title}</h1>
        <p className="text-xl text-gray-600">{message}</p>
        
        {ctaText && ctaLink && (
            <Button asChild className="mt-4">
            <a href={ctaLink}>
                {ctaText} <ArrowRight className="ml-2 h-4 w-4" />
            </a>
            </Button>
        )}
        
        <div className="pt-6">
          <p className="text-sm text-gray-400 flex items-center justify-center">
            I am working tirelessly
          </p>
        </div>
      </div>
    </div>
  )
}

