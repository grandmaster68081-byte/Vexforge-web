import { useEffect } from 'react';
import { ArrowLeft, Check, Code2, Eye, FileCode2, GitBranch, LockKeyhole, ShieldCheck } from 'lucide-react';
import packageJson from '../../package.json';

type PublicStatusPageProps = {
  onBack: () => void;
};

const surfaceStates = [
  {
    name: 'Landing',
    path: '/',
    state: 'Public',
    detail: 'Product overview and earning model',
    icon: Eye,
    tone: 'public',
  },
  {
    name: 'Legal',
    path: '/terms · /privacy',
    state: 'Public',
    detail: 'Terms and privacy information',
    icon: ShieldCheck,
    tone: 'public',
  },
  {
    name: 'Account',
    path: 'session workspace',
    state: 'Session required',
    detail: 'Sign-in and account workspace',
    icon: LockKeyhole,
    tone: 'session',
  },
  {
    name: 'Earn',
    path: '/earn',
    state: 'Session required',
    detail: 'Verified opportunities and rewards',
    icon: LockKeyhole,
    tone: 'session',
  },
  {
    name: 'Wallet · activity',
    path: '/wallet · /activity',
    state: 'Session required',
    detail: 'Personal balance and ledger',
    icon: LockKeyhole,
    tone: 'session',
  },
  {
    name: 'Withdraw',
    path: '/withdraw',
    state: 'Session required',
    detail: 'Personal crypto cashout request',
    icon: LockKeyhole,
    tone: 'session',
  },
  {
    name: 'Admin',
    path: '/admin',
    state: 'Admin role required',
    detail: 'Restricted operational controls',
    icon: LockKeyhole,
    tone: 'admin',
  },
];

const kivoraVersion = packageJson.version;
const buildCommit = (() => {
  const candidates = [
    import.meta.env.VITE_CF_PAGES_COMMIT_SHA,
    import.meta.env.VITE_COMMIT_SHA,
    import.meta.env.VITE_GIT_COMMIT_SHA,
  ];
  const value = candidates.find((candidate) => typeof candidate === 'string' && /^[a-f0-9]{7,64}$/i.test(candidate));
  return value ?? 'main';
})();

export function PublicStatusPage({ onBack }: PublicStatusPageProps) {
  useEffect(() => {
    const previousTitle = document.title;
    const description = document.querySelector('meta[name="description"]');
    const previousDescription = description?.getAttribute('content') ?? null;
    const pageDescription =
      'A read-only source and access map for the public Kivora rewards surface. No account or credentials are required.';
    const socialMeta = [
      {
        element: document.querySelector('meta[property="og:title"]'),
        content: 'Transparency | Kivora',
      },
      {
        element: document.querySelector('meta[property="og:description"]'),
        content: pageDescription,
      },
    ];
    const previousSocialContent = socialMeta.map(({ element }) => element?.getAttribute('content') ?? null);

    document.title = 'Transparency | Kivora';
    if (description) {
      description.setAttribute('content', pageDescription);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = pageDescription;
      meta.dataset.kivoraTransparency = 'true';
      document.head.appendChild(meta);
    }
    socialMeta.forEach(({ element, content }) => element?.setAttribute('content', content));

    return () => {
      document.title = previousTitle;
      const transparencyMeta = document.querySelector('meta[data-kivora-transparency="true"]');
      if (transparencyMeta) {
        transparencyMeta.remove();
      } else if (description) {
        if (previousDescription === null) {
          description.removeAttribute('content');
        } else {
          description.setAttribute('content', previousDescription);
        }
      }
      socialMeta.forEach(({ element }, index) => {
        const previousContent = previousSocialContent[index];
        if (element && previousContent !== null) element.setAttribute('content', previousContent);
      });
    };
  }, []);

  return (
    <div className="transparency-shell">
      <header className="transparency-nav">
        <button className="transparency-back" onClick={onBack} data-testid="button-transparency-back">
          <ArrowLeft size={15} />
          Back to Kivora
        </button>
        <div className="transparency-nav-label">
          <span className="transparency-pulse" />
          Public transparency
        </div>
      </header>

      <main className="transparency-main">
        <section className="transparency-hero" aria-labelledby="transparency-title">
          <div className="transparency-hero-copy">
            <span className="kicker">
              <ShieldCheck size={13} />
              SOURCE WINDOW
            </span>
            <h1 id="transparency-title">
              See what Kivora
              <br />
              <em>actually publishes.</em>
            </h1>
            <p>
              A compact, read-only map of the product surface and the build facts behind it. This page is
              intentionally independent from account data, payout records, and operational controls.
            </p>
            <div className="transparency-hero-actions">
              <button className="secondary-button" onClick={onBack} data-testid="button-transparency-return">
                Return to landing
                <ArrowLeft size={15} />
              </button>
              <span className="transparency-no-login">
                <Check size={14} />
                No credentials needed
              </span>
            </div>
          </div>
          <div className="transparency-seal" aria-label="Read-only public surface">
            <div className="transparency-seal-ring">
              <Eye size={22} />
            </div>
            <span>VIEW ONLY</span>
            <strong>Public by design</strong>
            <small>No actions, mutations, or private reads happen here.</small>
          </div>
        </section>

        <section className="transparency-facts" aria-labelledby="build-facts-title">
          <div className="transparency-section-heading">
            <div>
              <span className="kicker">BUILD IDENTIFIER</span>
              <h2 id="build-facts-title">The published source, plainly stated.</h2>
            </div>
            <span className="transparency-readonly-tag">READ-ONLY RECORD</span>
          </div>
          <div className="fact-grid">
            <div className="fact-card fact-card-primary">
              <div className="fact-icon"><Code2 size={17} /></div>
              <span>Version</span>
              <strong data-testid="text-transparency-version">{kivoraVersion}</strong>
              <small>Current Kivora release</small>
            </div>
            <div className="fact-card">
              <div className="fact-icon"><GitBranch size={17} /></div>
              <span>Source branch</span>
              <strong data-testid="text-transparency-branch">main</strong>
              <small>Tracked release branch</small>
            </div>
            <div className="fact-card fact-card-wide">
              <div className="fact-icon"><FileCode2 size={17} /></div>
              <span>Compiled source commit</span>
              <strong data-testid="text-transparency-commit">{buildCommit}</strong>
              <small>
                Reflected from a safe build-time commit value when Cloudflare Pages provides one; otherwise this
                record falls back to <code>main</code>.
              </small>
            </div>
          </div>
          <div className="source-line">
            <div>
              <span>Repository</span>
              <a
                href="https://github.com/grandmaster68081-byte/Vexforge-web/tree/main/faucet"
                target="_blank"
                rel="noreferrer"
                data-testid="link-transparency-repository"
              >
                github.com/grandmaster68081-byte/Vexforge-web/tree/main/faucet
              </a>
            </div>
            <div>
              <span>Source directory</span>
              <strong data-testid="text-transparency-directory">faucet</strong>
            </div>
          </div>
        </section>

        <section className="transparency-runtime" aria-labelledby="runtime-title">
          <div className="runtime-copy">
            <span className="kicker">RUNTIME</span>
            <h2 id="runtime-title">A small surface with a clear boundary.</h2>
            <p>
              The published client is built with React and Vite, and is served alongside Cloudflare Pages Functions.
              That describes the runtime shape only; this page does not perform a live health check or claim deployment
              success.
            </p>
          </div>
          <div className="runtime-stack" aria-label="Kivora runtime technologies">
            <span data-testid="text-runtime-react">React</span>
            <i />
            <span data-testid="text-runtime-vite">Vite</span>
            <i />
            <span data-testid="text-runtime-cloudflare">Cloudflare Pages Functions</span>
          </div>
        </section>

        <section className="transparency-surface" aria-labelledby="surface-title">
          <div className="transparency-section-heading">
            <div>
              <span className="kicker">SURFACE MAP</span>
              <h2 id="surface-title">Every route has an explicit access state.</h2>
            </div>
            <p className="surface-note">Availability is not a health claim.</p>
          </div>
          <div className="surface-list">
            {surfaceStates.map(({ name, path, state, detail, icon: Icon, tone }) => (
              <div className={`surface-row ${tone}`} key={name} data-testid={`surface-row-${name.toLowerCase().replace(/\W+/g, '-')}`}>
                <div className="surface-icon"><Icon size={16} /></div>
                <div className="surface-name">
                  <strong>{name}</strong>
                  <code>{path}</code>
                </div>
                <span className="surface-detail">{detail}</span>
                <span className="surface-state">{state}</span>
              </div>
            ))}
          </div>
        </section>

        <aside className="transparency-boundary" aria-label="Transparency boundary">
          <div className="boundary-icon"><LockKeyhole size={17} /></div>
          <div>
            <strong>This view is intentionally limited.</strong>
            <p>
              No credentials, cookies, tokens, account information, provider configuration, payout data, or admin
              controls are exposed or required to read this page.
            </p>
          </div>
        </aside>
      </main>

      <footer className="transparency-footer">
        <span>KIVORA · PUBLIC TRANSPARENCY</span>
        <span>Read-only source facts, not a deployment monitor.</span>
      </footer>
    </div>
  );
}