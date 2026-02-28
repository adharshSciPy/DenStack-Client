// src/styles/clinicBackgrounds.ts
export const clinicBackgrounds = {
  light1: `
    linear-gradient(
      135deg,
      #f3e8ff 0%,
      #fce7f3 30%,
      #e0f2fe 60%,
      #ede9fe 100%
    )
  `,
  light2: `
    linear-gradient(
      145deg,
      #f8faff 0%,
      #e0e7ff 20%,
      #c7d2fe 40%,
      #a5b4fc 60%,
      #818cf8 80%,
      #eef2ff 100%
    )
  `,
  light3: `
    linear-gradient(
      140deg,
      #f0f9ff 0%,
      #e0f2fe 25%,
      #dbeafe 50%,
      #c7d2fe 75%,
      #eef2ff 100%
    )
  `,
  light4: `
    linear-gradient(
      120deg,
      #f3e8ff 0%,
      #e9d5ff 25%,
      #ddd6fe 50%,
      #dbeafe 75%,
      #f5f3ff 100%
    )
  `,
  light5: `
    linear-gradient(
      120deg,
      #e0f2fe 0%,
      #dbeafe 25%,
      #bfdbfe 50%,
      #e0f7ff 75%,
      #f0f9ff 100%
    )
  `,
  dark1: `
    linear-gradient(
      120deg,
      #140f2d 0%,
      #1e1b4b 25%,
      #312e81 50%,
      #1e293b 75%,
      #0f172a 100%
    )
  `,
  dark2: `
    linear-gradient(
      120deg,
      #0a192f 0%,
      #0f172a 25%,
      #1e3a8a 50%,
      #0e7490 75%,
      #0b1220 100%
    )
  `,
} as const;

export type ThemeKey = keyof typeof clinicBackgrounds;