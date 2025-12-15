import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({
    title = 'Ferreyra Embutidos - El Mejor Sabor de Rosario',
    description = 'Venta de carne vacuna, cerdo, pollos, huevos y embutidos de primera calidad en Rosario. Mercado del Campo - Ferreyra Embutidos.',
    keywords = 'embutidos rosario, carnes rosario, cerdo rosario, cajon de pollos rosario, huevos rosario, mercado del campo, carniceria rosario, ofertas carne rosario',
    name = 'Ferreyra Embutidos',
    type = 'website'
}) => {
    return (
        <Helmet>
            {/* Standard metadata */}
            <title>{title}</title>
            <meta name='description' content={description} />
            <meta name='keywords' content={keywords} />

            {/* Google Site Verification */}
            <meta name="google-site-verification" content="tZiRIm3MHgj-hP0Bzai-_9OzMCS6ccIBLNPrXZHaTn4" />

            {/* Facebook / Open Graph */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:site_name" content={name} />
            {/* <meta property="og:image" content={image} />  TODO: Add default social image */}

            {/* Twitter */}
            <meta name="twitter:creator" content={name} />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
        </Helmet>
    );
}

export default SEO;
