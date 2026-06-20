import {
  Tent, Backpack, Compass, Map, Utensils, Droplets,
  Sun, Heart, Shield, Music, Users, Phone, HeartPulse, Zap,
  Ticket
} from 'lucide-react';

const ICON_MAP = {
  tent: Tent,
  backpack: Backpack,
  compass: Compass,
  map: Map,
  utensils: Utensils,
  droplets: Droplets,
  sun: Sun,
  heart: Heart,
  shield: Shield,
  music: Music,
  users: Users,
  phone: Phone,
  'heart-pulse': HeartPulse,
  zap: Zap,
  ticket: Ticket,
};

export function getGuideIcon(iconId) {
  return ICON_MAP[iconId] || Compass;
}
