"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useEffect, useMemo } from "react";

type Props = { url?: string; publishableKey?: string };

export function RealtimeBridge({ url, publishableKey }: Props) {
  const supabase = useMemo(() => url && publishableKey ? createBrowserClient(url, publishableKey) : null, [url, publishableKey]);

  useEffect(() => {
    if (!supabase) return;
    let subscriptionRevision=0;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    const subscribe = async (event: Event) => {
      const revision=++subscriptionRevision;
      const roomId = (event as CustomEvent<{ roomId?: string }>).detail?.roomId;
      if (channel) await supabase.removeChannel(channel);
      if (revision!==subscriptionRevision) return;
      channel = null;
      if (!roomId) return;
      channel = supabase.channel(`room:${roomId}:leases`, { config: { private: true, broadcast: { self: false } } })
        .on("broadcast", { event: "room_changed" }, () => {
          window.dispatchEvent(new CustomEvent("focus-island:room-change", { detail: { roomId } }));
        })
        .subscribe((status) => {
          if (status === "SUBSCRIBED") window.dispatchEvent(new CustomEvent("focus-island:realtime-ready", { detail: { roomId } }));
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") window.dispatchEvent(new CustomEvent("focus-island:realtime-offline", { detail: { roomId } }));
        });
    };
    window.addEventListener("focus-island:subscribe-room", subscribe);
    return () => {
      subscriptionRevision++;
      window.removeEventListener("focus-island:subscribe-room", subscribe);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [supabase]);

  return null;
}
