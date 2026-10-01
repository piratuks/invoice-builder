import useBrokenLinks from '@docusaurus/useBrokenLinks';
import Layout from '@theme/Layout';

export default function HomePage() {
  useBrokenLinks().collectAnchor('features');

  return (
    <Layout title="Offline invoicing with full data ownership" description="Documentation for Invoice Builder.">
      <main>
        {/* <section className="hero">
          <div className="hero__content">
            <p className="hero__eyebrow">Invoice Builder</p>
            <h1>Offline invoicing with full data ownership.</h1>
            <p className="hero__description">
              Create, customize, and export invoices without handing your business data to a third party.
            </p>
            <div className="hero__actions">
              <Link className="button button--primary button--lg" to="/docs/guides/">
                Read the tutorial
              </Link>
              <Link className="button button--secondary button--lg" to="/docs/guides/layout-json">
                Explore layouts
              </Link>
            </div>
          </div>
          <img className="hero__image" src="img/invoice-form.jpg" alt="Invoice Builder invoice form" />
        </section>
        <section className="principles" id="features" aria-label="Product principles">
          <article>
            <h2>Own your data</h2>
            <p>Your invoices and database stay under your control, on your computer or in your own Docker setup.</p>
          </article>
          <article>
            <h2>Work offline</h2>
            <p>Create invoices, quotes, and exports without an account, a subscription, or a permanent connection.</p>
          </article>
          <article>
            <h2>Make it yours</h2>
            <p>
              Use visual layout tools, style profiles, and reusable templates to make every document fit your brand.
            </p>
          </article>
        </section> */}
      </main>
    </Layout>
  );
}
