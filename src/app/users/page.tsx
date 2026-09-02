import { UsersView } from "@/components/users/UsersView";
import { permissionService } from "@/server/authorization/permission.service";
import { userService } from "@/server/services/user.service";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const { users } = await userService.list();
  const matrix = permissionService.matrix();

  return (
    <UsersView
      initialUsers={users}
      permissionMatrix={matrix}
      devUserId={process.env.DEV_SIMULATED_USER_ID ?? "usr-admin"}
    />
  );
}
