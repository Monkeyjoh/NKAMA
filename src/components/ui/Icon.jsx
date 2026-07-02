/**
 * NKAMA — Wrapper d'icône autour de `lucide-react`.
 *
 * Permet un usage piloté par chaîne (`<Icon name="Home" />`), pratique pour
 * les listes de données (navigation, menus). Les composants peuvent aussi
 * importer directement depuis lucide-react si besoin.
 */
import {
  Home, Building2, UserPlus, Wallet, ClipboardList, Bell, ShieldAlert,
  AlertTriangle, Wrench, Inbox, Clock, ChevronRight, ChevronLeft,
  TrendingUp, TrendingDown, CheckCircle2, Send, MoreHorizontal, Image,
  Camera, MapPin, Plus, MessageCircle, Phone, Mail, X, Check, ArrowRight,
  AlertCircle, FileText, FileWarning, Download, User, Lock, RotateCcw,
  Hammer, FileSignature, Settings, Users, LogOut,
} from "lucide-react";

const REGISTRY = {
  Home, Building2, UserPlus, Wallet, ClipboardList, Bell, ShieldAlert,
  AlertTriangle, Wrench, Inbox, Clock, ChevronRight, ChevronLeft,
  TrendingUp, TrendingDown, CheckCircle2, Send, MoreHorizontal, Image,
  Camera, MapPin, Plus, MessageCircle, Phone, Mail, X, Check, ArrowRight,
  AlertCircle, FileText, FileWarning, Download, User, Lock, RotateCcw,
  Hammer, FileSignature, Settings, Users, LogOut,
};

/**
 * @param {{ name: string, size?: number, strokeWidth?: number, color?: string, style?: object }} props
 */
export default function Icon({ name, size = 18, strokeWidth = 1.75, color, style }) {
  const Cmp = REGISTRY[name];
  if (!Cmp) return null;
  return <Cmp size={size} strokeWidth={strokeWidth} color={color} style={style} />;
}
