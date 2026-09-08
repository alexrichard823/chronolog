import { logout } from "@/lib/auth/actions";
import { Button } from "@/components/ui";

export default function LogoutButton() {
  return (
    <form action={logout}>
      <Button type="submit" variant="secondary">
        Log out
      </Button>
    </form>
  );
}
