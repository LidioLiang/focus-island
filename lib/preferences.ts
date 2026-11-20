import { z } from "zod";
const sounds = z.object({ ambient: z.boolean(), white: z.boolean(), music: z.boolean() });
const volumes = z.object({ ambient: z.number().int().min(0).max(100), white: z.number().int().min(0).max(100), music: z.number().int().min(0).max(100) });
const track = z.enum(["rainy-notes", "warm-reverie", "moonlit-walk", "island-breeze"]);
const view = z.string().regex(/^[a-z][a-z0-9-]{0,39}$/);
const sceneAudio = z.object({ sounds, soundVolumes: volumes, musicTrack: track }).strict();
export const preferencesSchema = z.object({
  defaultTimerMode: z.union([z.literal(0), z.literal(25), z.literal(50)]).optional(),
  reduceMotion: z.boolean().optional(), motionEffects: z.boolean().optional(), hudAutoHide: z.boolean().optional(),
  autoSceneSwitch: z.boolean().optional(), completionSound: z.boolean().optional(),
  rememberLastSound: z.boolean().optional(), rememberLastFocusView: z.boolean().optional(),
  sounds: sounds.optional(), soundVolumes: volumes.optional(), musicTrack: track.optional(),
  lastFocusView: view.optional(),
  sceneViews: z.object({ cafe: view.optional(), library: view.optional(), forest: view.optional() }).strict().optional(),
  sceneAudio: z.object({ cafe: sceneAudio.optional(), library: sceneAudio.optional(), forest: sceneAudio.optional() }).strict().optional(),
}).strict();
// Device permissions and current/running sessions intentionally do not synchronize as preferences.
