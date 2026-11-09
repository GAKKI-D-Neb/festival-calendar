type RelatedLink = {
  name: string;
  description: string;
  url: string;
};

// 関連する投稿祭まとめを追加するときは、この配列に項目を追加してください。
// name: リンク先の名前 / description: 簡単な紹介 / url: リンク先URL
const relatedLinks: RelatedLink[] = [
  // {
  //   name: "投稿祭まとめの名前",
  //   description: "このサイトの紹介文をここに記載します。",
  //   url: "https://example.com"
  // }
  {
     name: "ボカロ投稿祭スケジュールまとめ！！",
     description: "NorthP様が作成しているボカロ投稿祭まとめ",
     url: "https://note.com/northgazemusic/n/n1e334e5738f5"
  },
  {
     name: "ボカロ投稿祭・イベントスケジュールまとめ【日程表＋概要】",
     description: "おゆひよこ様が作成しているボカロ投稿祭まとめ",
     url: "https://oyu-sound.com/vocaloid-event-matome/"
  },
  {
     name: "【2026年版】ニコニコで実施の投稿祭スケジュール",
     description: "ニコニコインフォの投稿祭スケジュールの紹介",
     url: "https://blog.nicovideo.jp/niconews/271837.html"
  }
];

export default function LinksPage() {
  const contactUrl = process.env.NEXT_PUBLIC_CONTACT_X_URL || "https://x.com/GAKKI_D_Neb";
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="page-heading">
        <p className="page-eyebrow">ABOUT & LINKS</p>
        <h1>関連情報</h1>
        <p className="page-heading-description">関連する投稿祭まとめや、このサイトについての情報をご案内します。</p>
      </div>
      <section className="rounded-3xl border border-white/80 bg-white/90 p-6 shadow-xl shadow-indigo-100/50 sm:p-9">
        <p className="text-xs font-extrabold tracking-[0.2em] text-indigo-600">ABOUT THIS SITE</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">このサイトについて</h2>
        <p className="mt-4 text-sm leading-8 text-slate-600">
          このサイトは、ニコニコ動画などのボカロ・音楽関連の投稿祭の日程を探しやすくするために、個人（D-Neb GAKKI）が作成した非公式のまとめページです。
        </p>
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-950">
          <p className="font-extrabold">掲載情報についてのご注意</p>
          <p className="mt-1">本サイトは非公式のものであり、掲載内容には誤りや更新の遅れが含まれる可能性があります。参加方法・開催日時・応募条件などの正確な情報は、必ず各投稿祭の公式ページや主催者からの案内をご確認ください。</p>
        </div>
      </section>
      <section className="grid gap-5 md:grid-cols-2">
        <div className="rounded-3xl border border-white bg-white/90 p-6 shadow-lg shadow-indigo-100/40">
          <p className="text-xs font-black tracking-widest text-indigo-600">RELATED LINKS</p>
          <h3 className="mt-2 text-xl font-black text-slate-900">その他の投稿祭まとめ</h3>
          <p className="mt-2 text-sm leading-7 text-slate-600">他の方が作成されている投稿祭まとめへのリンクです。</p>
          {relatedLinks.length ? <ul className="mt-5 space-y-3">{relatedLinks.map((link) => (
            <li key={link.url}>
              <a href={link.url} target="_blank" rel="noreferrer"
                className="group flex items-center justify-between gap-4 rounded-xl border border-indigo-100 bg-indigo-50/70 px-4 py-3 transition hover:border-indigo-300 hover:bg-indigo-100">
                <span className="min-w-0">
                  <span className="block text-sm font-extrabold text-indigo-800">{link.name}</span>
                  <span className="mt-1 block text-xs leading-6 text-slate-600">{link.description}</span>
                </span>
                <span className="shrink-0 text-indigo-700 transition group-hover:translate-x-0.5">↗</span>
              </a>
            </li>
          ))}</ul> : <p className="mt-4 text-sm text-slate-400">関連リンクはまだ登録されていません。</p>}
        </div>
        <div className="rounded-3xl border border-white bg-white/90 p-6 shadow-lg shadow-indigo-100/40">
          <p className="text-xs font-black tracking-widest text-indigo-600">CONTACT</p>
          <h3 className="mt-2 text-xl font-black text-slate-900">お問い合わせ</h3>
          <p className="mt-2 text-sm leading-7 text-slate-600">掲載内容の誤りや追加情報、このサイトへの要望などがありましたら、作成者（D-Neb GAKKI）までご連絡ください。</p>
          <a href={contactUrl} target="_blank" rel="noreferrer"
            className="mt-5 flex items-center gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-3 transition hover:border-indigo-300 hover:bg-indigo-100">
            <img
              src="/festival-calendar/organizer-icon.png"
              alt="D-Neb GAKKIのアイコン"
              className="h-14 w-14 shrink-0 rounded-full object-cover"
            />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-extrabold text-indigo-900">D-Neb GAKKI｜つたないP</span>
              <span className="mt-1 block text-xs text-slate-600">Xプロフィールを見る</span>
            </span>
            <span className="shrink-0 font-bold text-indigo-700">↗</span>
          </a>
        </div>
      </section>
    </div>
  );
}
