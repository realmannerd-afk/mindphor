import React from "react";
import { Avatar, AvatarFallback } from "../ui/avatar";

interface UserAvatarReactProps {
  name: string;
  className?: string;
}

export default function UserAvatarReact({ name, className }: UserAvatarReactProps) {
  const initial = name ? name.charAt(0).toUpperCase() : "U";
  
  return (
    <Avatar className={className}>
      <AvatarFallback className="bg-accent/10 text-accent font-medium text-[13px]">
        {initial}
      </AvatarFallback>
    </Avatar>
  );
}
