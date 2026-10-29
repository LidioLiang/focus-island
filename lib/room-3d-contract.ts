export const ROOM_3D_CONTRACT_VERSION = 1 as const;

export const ROOM_3D_EVENT_TYPES = [
  "seat_intent",
  "seat_reservation_granted",
  "seat_reservation_denied",
  "seat_sequence_started",
  "seat_contact_completed",
  "seat_occupation_confirmed",
  "seat_occupation_failed",
  "activity_setup_completed",
  "focus_autostart_requested",
  "focus_autostart_confirmed",
  "focus_autostart_failed",
  "seat_sequence_failed",
  "seat_release_requested",
] as const;

export type Room3DEventType = (typeof ROOM_3D_EVENT_TYPES)[number];

export type Room3DInteractionEnvelope<TPayload extends Record<string, unknown> = Record<string, unknown>> = {
  contract_version: typeof ROOM_3D_CONTRACT_VERSION;
  event_type: Room3DEventType;
  interaction_id: string;
  room_id: string;
  seat_id: string;
  look_id: string;
  lease_revision: number;
  event_sequence: number;
  server_time: number;
  payload: TPayload;
};

export const ROOM_3D_REQUIRED_FIELDS = [
  "contract_version",
  "event_type",
  "interaction_id",
  "room_id",
  "seat_id",
  "look_id",
  "lease_revision",
  "event_sequence",
  "server_time",
  "payload",
] as const;

export function isRoom3DInteractionEnvelope(value: unknown): value is Room3DInteractionEnvelope {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return candidate.contract_version === ROOM_3D_CONTRACT_VERSION
    && ROOM_3D_EVENT_TYPES.includes(candidate.event_type as Room3DEventType)
    && typeof candidate.interaction_id === "string"
    && candidate.interaction_id.length > 0
    && typeof candidate.room_id === "string"
    && candidate.room_id.length > 0
    && typeof candidate.seat_id === "string"
    && candidate.seat_id.length > 0
    && typeof candidate.look_id === "string"
    && candidate.look_id.length > 0
    && Number.isSafeInteger(candidate.lease_revision)
    && Number.isSafeInteger(candidate.event_sequence)
    && typeof candidate.server_time === "number"
    && candidate.server_time > 0
    && typeof candidate.payload === "object"
    && candidate.payload !== null;
}
