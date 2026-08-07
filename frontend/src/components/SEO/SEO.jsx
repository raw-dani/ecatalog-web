import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const DEFAULT_DESCRIPTION = 'E-Catalog - Toko online terpercaya dengan berbagai produk berkualitas. Temukan produk terbaik dengan harga terjangkau.';
const DEFAULT_IMAGE = '/favicon.svg';

export default function SEO({
  title,
  description,
  image,
  type = 'website',
  settings,
  product = null,
  jsonLd = null,
  article = null,
  noindex = false,
  canonical = null,
}) {
  const location = useLocation();
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const currentUrl = canonical || (baseUrl + location.pathname);
  const siteName = settings?.store_name || 'E-Catalog';
  const ogImage = image || settings?.store_logo || DEFAULT_IMAGE;
  const metaTitle = title ? `${title} | ${siteName}` : siteName;
  const metaDescription = description || settings?.store_description || DEFAULT_DESCRIPTION;

  return (
    <Helmet>
      <title>{metaTitle}</title>
      <meta name="description" content={metaDescription} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {!noindex && <meta name="robots" content="index, follow" />}

      <link rel="canonical" href={currentUrl} />

      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="id_ID" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={ogImage} />
      {settings?.store_whatsapp && (
        <meta name="twitter:site" content={`@${settings.store_whatsapp}`} />
      )}

      {product && (
        <>
          <meta property="product:price:amount" content={String(product.price)} />
          <meta property="product:price:currency" content={product.currency || 'IDR'} />
          <meta property="product:availability" content={product.availability || 'in stock'} />
          <meta property="product:condition" content={product.condition || 'new'} />
          <meta name="product:price:amount" content={String(product.price)} />
          <meta name="product:price:currency" content={product.currency || 'IDR'} />
          <meta name="product:availability" content={product.availability || 'in stock'} />
          <meta name="product:condition" content={product.condition || 'new'} />
          {product.sku && <meta name="product:sku" content={product.sku} />}
        </>
      )}

      {article && (
        <>
          <meta property="article:published_time" content={article.publishedAt} />
          <meta property="article:modified_time" content={article.modifiedAt} />
          {article.author && <meta property="article:author" content={article.author} />}
        </>
      )}

      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
}
