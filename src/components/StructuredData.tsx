import { useEffect } from 'react';

const StructuredData = () => {
  useEffect(() => {
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "TranscribeAI",
      "description": "Professional AI-powered audio and video transcription service with 99.8% accuracy, supporting 98+ languages and unlimited processing.",
      "url": "https://transcribeai.com",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web Browser",
      "offers": [
        {
          "@type": "Offer",
          "name": "Free Tier",
          "price": "0",
          "priceCurrency": "USD",
          "description": "3 × 30-minute transcriptions per day with basic features"
        },
        {
          "@type": "Offer", 
          "name": "Unlimited Pro",
          "price": "10",
          "priceCurrency": "USD",
          "billingDuration": "P1M",
          "description": "Unlimited transcriptions with advanced features, high priority processing, and all export formats"
        }
      ],
      "featureList": [
        "AI-powered transcription with 99.8% accuracy",
        "Support for 98+ spoken languages",
        "Translation to 130+ target languages", 
        "Speaker recognition and labeling",
        "Audio restoration and enhancement",
        "Multiple export formats (DOCX, PDF, TXT, CSV, SRT, VTT)",
        "Real-time editing with timestamp synchronization",
        "Batch processing and bulk exports",
        "Enterprise-grade security and encryption",
        "GPU-accelerated processing"
      ],
      "creator": {
        "@type": "Organization",
        "name": "TranscribeAI",
        "url": "https://transcribeai.com"
      }
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return null;
};

export default StructuredData;