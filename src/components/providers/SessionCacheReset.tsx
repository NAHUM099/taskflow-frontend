import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";

/**
 * Vacía la caché de React Query cuando cambia la identidad de la sesión
 * (login, logout, token expirado o cambio desde otra pestaña).
 *
 * Las claves de consulta no incluyen al usuario, así que sin este guard un
 * USER podría ver durante `staleTime` las tareas que quedaron cacheadas con
 * la sesión anterior en la misma pestaña.
 */
export function SessionCacheReset() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const identity = user?.email ?? null;

  // undefined = todavía no se observó ninguna identidad (primer montaje). Así
  // distinguimos "nunca hubo sesión" de "se cerró la sesión" (null).
  const previousIdentity = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const changed =
      previousIdentity.current !== undefined && previousIdentity.current !== identity;

    if (changed) {
      queryClient.clear();
    }

    previousIdentity.current = identity;
  }, [identity, queryClient]);

  return null;
}
