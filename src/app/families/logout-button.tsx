import { logout } from "@/lib/auth/actions";

export default function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="mt-6 rounded bg-black px-4 py-2 text-white"
      >
        Log out
      </button>
    </form>
  );
}