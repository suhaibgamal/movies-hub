// app/login/page.jsx (Server Component)
import LoginClient from "@/app/login/LoginClient";

export const metadata = {
  title: "Movies Hub - Login",
  description: "Login to your Movies Hub account.",
  alternates: { canonical: "https://movies.suhaeb.com/login" },
};

export default function LoginPage() {
  return <LoginClient />;
}
