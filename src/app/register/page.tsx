import { RegistrationForm } from "@/components/RegistrationForm";

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="page-heading mb-6">
        <p className="page-eyebrow">SUBMIT INFORMATION</p>
        <h1>投稿祭登録</h1>
        <p className="page-heading-description">
          このサイトに掲載するため、ボカロ・歌ってみたなどの音楽系投稿祭の情報を集めています。
        </p>
        <p className="page-heading-description">
          まだ掲載されていない投稿祭がありましたら、ぜひご登録ください。
        </p>
      </div>
    <section className="rounded-3xl border border-white/80 bg-white/85 p-5 shadow-xl shadow-indigo-100/50 sm:p-8">
      <div className="mt-1"><RegistrationForm /></div>
    </section>
    </div>
  );
}
