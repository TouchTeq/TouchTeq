export default function Head() {
  const title = 'Top 5 Reasons for False Alarms in Optical Flame Detectors | TouchTeq Insights';
  const description =
    'False alarms in optical flame detection systems cost time and money. Discover the five most common causes and how to eliminate them in your facility.';
  const url = 'https://touchteq.co.za/insights/flame-detector-false-alarms';
  const image = 'https://touchteq.co.za/optical-flame-detector.jpeg';

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
