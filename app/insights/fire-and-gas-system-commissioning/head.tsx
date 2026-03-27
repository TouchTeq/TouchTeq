export default function Head() {
  const title = 'Fire and Gas System Commissioning: What to Expect | TouchTeq Insights';
  const description =
    'Find out what a professional fire and gas system commissioning involves, what to prepare, and what to expect at each stage of the process.';
  const url = 'https://touchteq.co.za/insights/fire-and-gas-system-commissioning';
  const image = 'https://touchteq.co.za/f&g.jpeg';

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
