import React from "react";
import {
  Home,
  ShoppingCart,
  Zap,
  Car,
  HeartPulse,
  Utensils,
  Tv,
  Gamepad2,
  CreditCard,
  ShieldCheck,
  Palmtree,
  Sparkles,
  ShieldAlert,
  Plane,
  Wrench,
  Award,
  Tag,
  DollarSign,
  Wallet,
  Building,
  Fuel,
  Coffee,
  Smartphone,
  BookOpen,
  Gift,
  Briefcase,
  LucideProps,
} from "lucide-react";

interface CategoryIconProps extends LucideProps {
  name: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, ...props }) => {
  const iconMap: Record<string, React.ElementType> = {
    Home,
    ShoppingCart,
    Zap,
    Car,
    HeartPulse,
    Utensils,
    Tv,
    Gamepad2,
    CreditCard,
    ShieldCheck,
    Palmtree,
    Sparkles,
    ShieldAlert,
    Plane,
    Wrench,
    Award,
    Tag,
    DollarSign,
    Wallet,
    Building,
    Fuel,
    Coffee,
    Smartphone,
    BookOpen,
    Gift,
    Briefcase,
  };

  const IconComponent = iconMap[name] || Tag;
  return <IconComponent {...props} />;
};
