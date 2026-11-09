export function RegistrationForm() {
  const formUrl = process.env.NEXT_PUBLIC_GOOGLE_FORM_EMBED_URL;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">投稿祭登録フォーム</h2>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          投稿祭一覧に掲載するため、投稿祭の情報提供を下記の
          <a
            href={formUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-blue-700 underline underline-offset-2 hover:text-blue-900"
          >
            情報提供フォーム
          </a>
          から受け付けています。
          お寄せいただいた情報は確認のうえ、一覧に反映します。
        </p>
      </div>
      {formUrl ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <iframe
            title="投稿祭情報提供フォーム"
            src={formUrl}
            className="h-[1100px] w-full"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="font-semibold text-slate-700">Googleフォームは未設定です。</p>
          <p className="mt-2 text-sm text-slate-500">
            .env.local の NEXT_PUBLIC_GOOGLE_FORM_EMBED_URL に埋め込みURLを設定してください。
          </p>
        </div>
      )}
    </section>
  );
}
