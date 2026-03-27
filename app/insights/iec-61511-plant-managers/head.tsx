export default function Head() {
  const title =
    'Understanding IEC 61511: What Plant Managers in South Africa Need to Know | TouchTeq Insights';
  const description =
    'IEC 61511 governs safety instrumented systems across South African process plants. Learn what plant managers need to know about SIL, SIS design, and OHS Act compliance.';
  const url = 'https://touchteq.co.za/insights/iec-61511-plant-managers';
  const image = 'https://touchteq.co.za/IEC.jpeg';

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
