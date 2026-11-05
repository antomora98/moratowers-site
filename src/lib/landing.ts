import raw from '../data/landing.json';
import rawTimeline from '../data/timeline.json';
import { landingSchema, timelineSchema } from './schema';

// Parsing here means a bad data file fails the build.
export const landing = landingSchema.parse(raw);
export const timeline = timelineSchema.parse(rawTimeline);
