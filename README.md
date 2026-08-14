# Ignite Fitness Tracker

Build a premium, mobile-responsive fitness tracker application with a modern, dark-themed athletic aesthetic and electric teal accents. 

Include a persistent header displaying a "Daily Consistency Streak" module featuring a flaming fire icon, current streak count (e.g., "7 Days Active"), and a micro-calendar checklist showing the last 7 days with checked/unchecked status based on whether the user has logged data.

Create three primary features organized into navigation tabs:

1. Daily Log of Workout Sessions: A dashboard containing a "Log Session" button that opens a clean modal form. The form should have input fields for Workout Name (dropdown with cardio, strength, flexibility), Duration (minutes), and custom fields for Exercises, Sets, Reps, and Weights used. Include a beautiful timeline component showing a historical feed of completed workouts for the day. Include a "Share Workout" button on each logged session that opens a native-looking share preview modal with formatted text summary.

2. Step and Running Distance Tracker: A prominent daily activity dashboard. Display two large visual progress rings—one for Steps (with a default goal of 10,000) and one for Running Distance (in kilometers/miles). Include simple increment buttons (+1000 steps, +0.5 km) for manual logging, alongside an elegant line chart showcasing weekly distance and step trends.

3. Daily Log Picture Progress: A dedicated visual grid gallery module named "Progress Photo Journal." Include a "Take/Upload Today's Photo" action component. Allow users to add a brief text caption or weight entry under each uploaded picture. Order the gallery chronologically by date. Add a "Side-by-Side Comparison" toggle that lets users select any two historical photos to see them side by side. Add a prominent "Share Transformation" button on the comparison view that generates a clean social media mockup card (showing the two photos stacked with "Before" and "After" text watermarks).

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://streak-forge-50.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/99ce16d4-cc2d-4ab8-89fc-addd764bd4d8).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
