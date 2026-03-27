export default function Head() {
  const title = 'A Guide to Hazardous Area Classification in Southern Africa | TouchTeq Insights';
  const description =
    'A practical guide to hazardous area classification for Southern African facilities. Covers SANS 10108, IEC 60079, zone classification, and equipment selection requirements.';
  const url =
    'https://touchteq.co.za/insights/hazardous-area-classification-southern-africa';
  const image = 'https://touchteq.co.za/HAC.jpg';

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
