// app/register/page.jsx
import RegisterClient from "@/app/register/RegisterClient";

export const metadata = {
  title: "Movies Hub - Register",
  description: "Create a new Movies Hub account.",
  alternates: { canonical: "https://movies-hub-explore.vercel.app/register" },
};

export default function RegisterPage() {
  return <RegisterClient />;
}
