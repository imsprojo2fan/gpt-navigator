import { PlatformForm } from "@/components/admin/PlatformForm";

export default function NewPlatformPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">添加平台</h1>
      <p className="mt-1 text-sm text-gray-500">手动录入一个新平台。</p>
      <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/50 p-3 text-sm text-blue-800">
        填写平台基本信息。<strong>Slug</strong> 是 URL 标识（如 freecash），<strong>Status 选 active</strong> 才会在前台显示。
        如果有 Affiliate 链接填上，没有则留空会自动用 website_url 作为跳转链接。
      </div>
      <div className="mt-6 max-w-2xl">
        <PlatformForm />
      </div>
    </div>
  );
}
