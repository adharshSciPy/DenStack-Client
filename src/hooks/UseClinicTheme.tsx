// hooks/useClinicTheme.ts
import { useEffect } from "react";
import axios from "axios";
import { setClinicThemeGradient } from "../styles/theme";
import baseUrl from "../baseUrl";

export function useClinicTheme( clinicId?: string) {
  // clinicId

  useEffect(() => {
    if (!clinicId) return;

    async function fetchTheme() {
      try {
        const res = await axios.get(
          `${baseUrl}api/v1/auth/clinic/gettheme/${clinicId}`
        );
        const { startColor, endColor, primaryForeground, sidebarForeground,secondary} =
          res.data;

        setClinicThemeGradient({
          start: startColor,
          end: endColor,
          primaryForeground,
          sidebarForeground,
          secondary
        });
        console.log("Clinic theme applied:", res.data);
        
      } catch (err) {
        console.error("Failed to fetch clinic theme", err);
      }
    }

    fetchTheme();
  }, [clinicId]);
}
