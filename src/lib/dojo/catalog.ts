import type { Belt, Gender } from "@/types";

export const SITE_NAME = "Hidden Karate Dojo";
export const SITE_SUBTITLE = "Tränarportalen";

export const beltMeta: Record<
  Belt,
  { color: string; textColor: string; label: string }
> = {
  vitt: { color: "#d8d8d8", textColor: "#666666", label: "Vitt bälte" },
  gult: { color: "#f5d000", textColor: "#7a6200", label: "Gult bälte" },
  orange: { color: "#f0821a", textColor: "#ffffff", label: "Orange bälte" },
  grönt: { color: "#2a8a44", textColor: "#ffffff", label: "Grönt bälte" },
  blått: { color: "#1d6fc4", textColor: "#ffffff", label: "Blått bälte" },
  brunt: { color: "#7b4a2d", textColor: "#ffffff", label: "Brunt bälte" },
  svart: { color: "#1a1a1a", textColor: "#ffffff", label: "Svart bälte" },
};

export const avatarPalette = [
  ["#fdecea", "#c0281a"],
  ["#e6f1fb", "#185fa5"],
  ["#edf6f1", "#2d7a4f"],
  ["#fdf5e6", "#c8973a"],
  ["#e1f5ee", "#0f6e56"],
  ["#fbeaf0", "#993556"],
  ["#eeedfe", "#534ab7"],
  ["#f1efe8", "#5f5e5a"],
] as const;

export const statCardAccent = {
  red: "#c0281a",
  gold: "#c8973a",
  green: "#2d7a4f",
  blue: "#1d6fc4",
} as const;

export const genderLabel: Record<Gender, string> = {
  M: "Pojke",
  F: "Flicka",
  "-": "Annat",
};

export const navigationItems = [
  { href: "/dashboard/members", label: "Medlemmar", key: "members" },
  { href: "/dashboard/camps", label: "Läger & tävlingar", key: "camps" },
  { href: "/dashboard/attendance", label: "Närvaro", key: "attendance" },
  { href: "/dashboard/training", label: "Registrera träning", key: "training" },
  { href: "/dashboard/check-in", label: "Checka in", key: "checkin" },
] as const;
