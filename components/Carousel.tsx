'use client'

import React, { useState } from 'react'

interface CarouselProps {
  children: React.ReactNode[]
}

const Carousel = ({ children }: CarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const items = React.Children.toArray(children)

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? items.length - 1 : prevIndex - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex === items.length - 1 ? 0 : prevIndex + 1))
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  if (!items || items.length === 0) {
    return null
  }

  return (
    <div className="relative mx-auto my-8 max-w-4xl">
      {/* Carousel Container */}
      <div className="relative overflow-hidden rounded-lg shadow-lg">
        {/* Image Container */}
        <div className="relative aspect-video bg-gray-100 dark:bg-gray-800">
          {items[currentIndex]}
        </div>

        {/* Navigation Buttons */}
        {items.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/75"
              aria-label="Imagen anterior"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5L8.25 12l7.5-7.5"
                />
              </svg>
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/75"
              aria-label="Imagen siguiente"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 4.5l7.5 7.5-7.5 7.5"
                />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Dot Indicators */}
      {items.length > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-3 w-3 rounded-full transition ${
                index === currentIndex
                  ? 'bg-primary-500'
                  : 'bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500'
              }`}
              aria-label={`Ir a imagen ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Counter */}
      {items.length > 1 && (
        <div className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          {currentIndex + 1} / {items.length}
        </div>
      )}
    </div>
  )
}

export default Carousel
