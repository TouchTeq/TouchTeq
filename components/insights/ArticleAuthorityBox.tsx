type ArticleAuthorityBoxProps = {
  updated: string;
  topics: string[];
};

export default function ArticleAuthorityBox({
  updated,
  topics,
}: ArticleAuthorityBoxProps) {
  return (
    <section className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-6 md:p-8">
      <p className="text-[11px] font-black uppercase tracking-[0.3em] text-orange-500">
        Reviewed by a qualified engineer
      </p>
      <h3 className="mt-3 text-2xl font-black uppercase tracking-tight text-[#1A2B4C]">
        Thabo Matona
      </h3>
      <p className="mt-2 text-sm font-bold uppercase tracking-widest text-slate-500">
        Founder and Principal Engineer, Touch Teq Engineering
      </p>
      <p className="mt-4 text-sm leading-relaxed text-slate-600">
        This article is published by Touch Teq Engineering and reviewed for
        technical accuracy by an engineer overseeing industrial fire and gas
        detection, control and instrumentation, hazardous area classification,
        and electrical engineering work in Southern Africa.
      </p>
      <div className="mt-6 text-sm text-slate-600">
        <p>
          <span className="font-bold text-[#1A2B4C]">Last reviewed:</span> {updated}
        </p>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-slate-600">
        <span className="font-bold text-[#1A2B4C]">Relevant domains:</span>{" "}
        {topics.join(", ")}.
      </p>
    </section>
  );
}
