import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      rol: string;
      perfilSolicitante: string | null;
      areaId: string;
    } & DefaultSession["user"];
  }

  interface User {
    rol: string;
    perfilSolicitante: string | null;
    areaId: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    rol: string;
    perfilSolicitante: string | null;
    areaId: string;
  }
}
