import { avatarPalette, beltMeta, genderLabel } from "@/lib/dojo/catalog";
import type { Belt, Gender } from "@/types";

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function getAvatarColors(seed: string) {
  const code = seed.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return avatarPalette[code % avatarPalette.length];
}

export function formatDateLabel(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(`${value}T00:00:00`));
}

export function getTodayValue() {
  return new Date().toISOString().slice(0, 10);
}

export function getAttendanceColor(percent: number) {
  if (percent >= 80) {
    return "#2d7a4f";
  }

  if (percent >= 60) {
    return "#c8973a";
  }

  return "#c0281a";
}

export function getGenderLabel(value: Gender) {
  return genderLabel[value];
}

export function getBeltLabel(value: Belt) {
  return beltMeta[value].label;
}
