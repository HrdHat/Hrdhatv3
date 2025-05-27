# Mobile Components

This directory contains React components specifically designed for mobile devices and touch interfaces.

## Purpose

- Components optimized for smaller screens and touch interactions
- Mobile-specific UI patterns and layouts
- Components that leverage mobile device capabilities

## Current Components

- `ImageUploaderMobile.tsx` - Mobile-optimized image upload component

## Guidelines

- Components should be touch-friendly with appropriate tap targets (≥44px)
- Optimize for mobile viewports (≤768px)
- Consider mobile-specific interactions (swipe, pinch, long press)
- Be mindful of mobile performance and battery usage
- Support both portrait and landscape orientations

## Usage

These components are typically used in the mobile layout shell or conditionally rendered based on screen size detection.

## Mobile-Specific Considerations

- Touch targets should be large enough for finger interaction
- Consider thumb-friendly navigation patterns
- Optimize images and assets for mobile bandwidth
- Use mobile-appropriate input types (tel, email, etc.)
- Consider offline functionality where applicable
