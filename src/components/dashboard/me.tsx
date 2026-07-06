import { createContext, useContext } from "react";

export type Role = "admin" | "teacher" | "parent";

export type Me = {
  userId: string;
  email: string | null;
  roles: Role[];
  primary: Role;
  profile: {
    id: string;
    full_name: string | null;
    phone: string | null;
    child_name: string | null;
    class_name: string | null;
    avatar_url: string | null;
  } | null;
};

export const MeContext = createContext<Me | null>(null);

export function useMe(): Me {
  const me = useContext(MeContext);
  if (!me) throw new Error("useMe must be inside DashboardLayout");
  return me;
}
