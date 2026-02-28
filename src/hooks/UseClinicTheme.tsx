// src/hooks/useClinicTheme.ts
import { useEffect } from "react";
import axios from "axios";
import baseUrl from "../baseUrl";
import { clinicBackgrounds, ThemeKey } from "../styles/clinicBackgrounds";
import { setClinicThemeGradient } from "../styles/theme";

export function useClinicTheme(clinicId?: string) {
  useEffect(() => {
    if (!clinicId) return;

    const fetchTheme = async () => {
      try {
        const res = await axios.get(
          `${baseUrl}api/v1/auth/clinic/gettheme/${clinicId}`,
        );
        console.log("assaAS", res);

        // 👇 backend value (unknown type)
        const rawKey = res.data.key;

        // ✅ convert to ThemeKey safely
        const themeKey: ThemeKey =
          rawKey && rawKey in clinicBackgrounds ? rawKey : "light3";

        const background = clinicBackgrounds[themeKey];

        setClinicThemeGradient({
          background,
          isDark: themeKey.startsWith("dark"),
        });
        console.log("Applying clinic theme", {
          background: clinicBackgrounds[themeKey]
        });
      } catch (err) {
        console.error("Theme fetch failed", err);
      }
    };

    fetchTheme();
  }, [clinicId]);
}
