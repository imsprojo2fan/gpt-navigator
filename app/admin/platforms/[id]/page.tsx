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
      <h1 className="text-2xl font-bold text-gray-900">编辑平台</h1>
      <p className="mt-1 text-sm text-gray-500">{platform.name}</p>
      <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/50 p-3 text-sm text-blue-800">
        修改平台信息后点保存。<strong>Status 设为 inactive 可以从首页隐藏。</strong>评分（rating）和 Trustpilot 评分可手动填。
      </div>
      <div className="mt-6 max-w-2xl">
        <PlatformForm platform={toPlatform(platform)} />
      </div>
    </div>
  );
}
