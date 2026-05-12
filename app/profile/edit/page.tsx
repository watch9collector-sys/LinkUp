import type { Metadata } from "next";
import { EditProfileForm } from "./EditProfileForm";

export const metadata: Metadata = {
  title: "Edit profile",
};

export default function EditProfilePage() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <EditProfileForm />
    </div>
  );
}
