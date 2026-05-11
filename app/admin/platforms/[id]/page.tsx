import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PlatformForm } from "@/components/admin/PlatformForm";
import { toPlatform } from "@/types/platform";

type Props = {
  params: { id: string };
};

export default async function EditPlatformPage({ params }: Props) {
  const platform = await prisma.platform.findUnique({
    where: { id: parseInt(params.id, 10) },
    include: { features: true },
  });

  if (!platform) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Edit Platform</h1>
      <p className="mt-1 text-sm text-gray-500">{platform.name}</p>
      <div className="mt-6 max-w-2xl">
        <PlatformForm platform={toPlatform(platform)} />
      </div>
    </div>
  );
}
