import { PlatformForm } from "@/components/admin/PlatformForm";

export default function NewPlatformPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Add Platform</h1>
      <p className="mt-1 text-sm text-gray-500">
        Manually add a new platform to the database.
      </p>
      <div className="mt-6 max-w-2xl">
        <PlatformForm />
      </div>
    </div>
  );
}
