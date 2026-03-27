export default function Head() {
  const title = 'SIL Assessment vs HAZOP: Understanding the Difference | TouchTeq Insights';
  const description =
    'SIL assessments and HAZOPs are both essential but serve different purposes. This guide explains the difference in plain terms for process safety professionals.';
  const url = 'https://touchteq.co.za/insights/sil-assessment-vs-hazop';
  const image = 'https://touchteq.co.za/SIL-HAZOP.jpeg';

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="article" />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="Touch Teq Engineering" />
      <meta property="og:locale" content="en_ZA" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </>
  );
}
