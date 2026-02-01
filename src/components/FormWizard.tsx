import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChevronRight, ChevronLeft, Check, X } from 'lucide-react'
import { cn } from '@/libs/utils'

export interface Step {
    id: string
    title: string
    description?: string
    content: React.ReactNode
    validation?: () => boolean | Promise<boolean>
}

interface FormWizardProps {
    title: string
    description?: string
    steps: Step[]
    onComplete: () => void
    onCancel: () => void
    isOpen?: boolean
}

export function FormWizard({ title, description, steps, onComplete, onCancel }: FormWizardProps) {
    const [currentStepIndex, setCurrentStepIndex] = useState(0)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const currentStep = steps[currentStepIndex]
    const isLastStep = currentStepIndex === steps.length - 1
    const isFirstStep = currentStepIndex === 0

    const handleNext = async () => {
        if (currentStep.validation) {
            const isValid = await currentStep.validation()
            if (!isValid) return
        }

        if (isLastStep) {
            setIsSubmitting(true)
            try {
                await onComplete()
            } finally {
                setIsSubmitting(false)
            }
        } else {
            setCurrentStepIndex(prev => prev + 1)
        }
    }

    const handleBack = () => {
        if (!isFirstStep) {
            setCurrentStepIndex(prev => prev - 1)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <Card className="w-full max-w-2xl shadow-xl border-none">
                <CardHeader className="bg-muted/50 rounded-t-xl border-b">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>{title}</CardTitle>
                            {description && <CardDescription>{description}</CardDescription>}
                        </div>
                        <Button variant="ghost" size="icon" onClick={onCancel}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Progress Indicator */}
                    <div className="flex items-center gap-2 mt-4">
                        {steps.map((step, index) => (
                            <div key={step.id} className="flex items-center flex-1">
                                <div className={cn(
                                    "h-2 rounded-full w-full transition-all",
                                    index <= currentStepIndex ? "bg-primary" : "bg-muted"
                                )} />
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                        <span>{currentStep.title}</span>
                        <span>Step {currentStepIndex + 1} of {steps.length}</span>
                    </div>
                </CardHeader>

                <CardContent className="p-6 min-h-[300px]">
                    {currentStep.content}
                </CardContent>

                <CardFooter className="flex justify-between border-t p-6 bg-muted/20 rounded-b-xl">
                    <Button
                        variant="outline"
                        onClick={handleBack}
                        disabled={isFirstStep || isSubmitting}
                    >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>

                    <Button
                        onClick={handleNext}
                        disabled={isSubmitting}
                    >
                        {isLastStep ? (
                            <>
                                {isSubmitting ? "Completing..." : "Complete Setup"}
                                {!isSubmitting && <Check className="w-4 h-4 ml-2" />}
                            </>
                        ) : (
                            <>
                                Next
                                <ChevronRight className="w-4 h-4 ml-2" />
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
