type ArticleAuthorityBoxProps = {
  updated: string;
  topics: string[];
  variant?: 'engineer-review' | 'source-review';
};

export default function ArticleAuthorityBox({
  updated,
  topics,
  variant = 'engineer-review',
}: ArticleAuthorityBoxProps) {
  const isSourceReview = variant === 'source-review';

  return (
    <section className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-6 md:p-8">
      <p className="text-[11px] font-black uppercase tracking-[0.3em] text-orange-500">
        {isSourceReview ? 'Research status' : 'Reviewed by a qualified engineer'}
      </p>
      <h3 className="mt-3 text-2xl font-black uppercase tracking-tight text-[#1A2B4C]">
        {isSourceReview ? 'Source-led technical briefing' : 'Thabo Matona'}
      </h3>
      <p className="mt-2 text-sm font-bold uppercase tracking-widest text-slate-500">
        {isSourceReview
          ? 'Primary standards and South African regulatory sources checked'
          : 'Founder and Principal Engineer, Touch Teqniques Engineering'}
      </p>
      <p className="mt-4 text-sm leading-relaxed text-slate-600">
        {isSourceReview
          ? 'This article was rebuilt from a consolidated technical research pack and checked against current IEC catalogue pages and published South African regulatory material. It is general information and does not replace a site-specific engineering, legal or approved-inspection-authority assessment.'
          : 'This article is published by Touch Teqniques Engineering and reviewed for technical accuracy by an engineer overseeing industrial fire and gas detection, control and instrumentation, hazardous area classification, and electrical engineering work in Southern Africa.'}
      </p>
      <div className="mt-6 text-sm text-slate-600">
        <p>
          <span className="font-bold text-[#1A2B4C]">
            {isSourceReview ? 'Research updated:' : 'Last reviewed:'}
          </span>{' '}
          {updated}
        </p>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-slate-600">
        <span className="font-bold text-[#1A2B4C]">Relevant domains:</span>{" "}
        {topics.join(", ")}.
      </p>
    </section>
  );
}
