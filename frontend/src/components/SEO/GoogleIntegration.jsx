import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { getSettings } from '../../services/cartService';

export default function GoogleIntegration() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch(() => {});
  }, []);

  if (!settings) return null;

  const gscCode = settings.google_search_console;
  const gaId = settings.google_analytics;
  const merchantId = settings.google_merchant;
  const gtmId = settings.google_tag_manager;

  const gaScript = gaId
    ? `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${gaId}');`
    : '';

  const gtmScript = gtmId
    ? `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].l=w[l].l||new Date();w[l].l.version='es2015';w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l+'_':'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl+'&l='+l;j.parentNode=f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`
    : '';

  return (
    <Helmet>
      {gscCode && (
        <meta name="google-site-verification" content={gscCode} />
      )}
      {merchantId && (
        <meta name="google-site-verification" content={merchantId} />
      )}
      {gaId && (
        <>
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
          <script>{gaScript}</script>
        </>
      )}
      {gtmId && (
        <>
          <script>{gtmScript}</script>
          <script async src={`https://www.googletagmanager.com/gtm.js?id=${gtmId}`} />
        </>
      )}
    </Helmet>
  );
}
