import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../js/api.js';
import { initState, isAdmin, isLoggedIn, login, logout, onStateChange, setCartCount, state } from '../js/state.js';
import { formatDate, formatMoney, navigate, placeholderThumb, showToast } from '../js/helpers.js';
import logoJpg from '../assets/logo.jpg';
import logoSvg from '../assets/logo.svg';

const PAGE_SIZE = 12;
const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const PAYMENT_STATUSES = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'];
const EDITORIAL_IMAGE = 'https://images.pexels.com/photos/18584221/pexels-photo-18584221.jpeg?cs=srgb&dl=pexels-jimmy-chen-746816442-18584221.jpg&fm=jpg';

function readLocation() {
  return window.location.hash.slice(1) || '/';
}

function useLocation() {
  const [location, setLocation] = useState(readLocation);

  useEffect(() => {
    const updateLocation = () => setLocation(readLocation());
    window.addEventListener('hashchange', updateLocation);
    return () => window.removeEventListener('hashchange', updateLocation);
  }, []);

  return location;
}

function syncCartBadge() {
  if (!isLoggedIn()) {
    setCartCount(0);
    return;
  }
  api.getCart()
    .then((cart) => setCartCount(cart.totalItems || 0))
    .catch((error) => console.error('Could not refresh cart badge:', error));
}

export default function App() {
  const location = useLocation();
  const [authToken, setAuthToken] = useState(state.token);

  useEffect(() => {
    initState();
    setAuthToken(state.token);
    const unsubscribe = onStateChange(() => setAuthToken(state.token));
    return unsubscribe;
  }, []);

  useEffect(() => {
    syncCartBadge();
  }, [authToken]);

  const [path, queryString = ''] = location.split('?');
  const params = useMemo(() => new URLSearchParams(queryString), [queryString]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [path]);

  return (
    <>
      <PromoTicker />
      <Header />
      <main id="view">
        <RouteContent path={path || '/'} params={params} />
      </main>
      <footer className="site-footer">ELMAVIA — Grow slowly. Wear deliberately.</footer>
      <div id="toast" role="status" aria-live="polite" />
    </>
  );
}

function PromoTicker() {
  const items = [
    'Free shipping on prepaid orders',
    'New drops every week',
    'Grow slowly. Wear deliberately.',
    'Cash on delivery available',
  ];
  return (
    <div className="promo-ticker" aria-hidden="true">
      <div className="promo-ticker-track">
        {[...items, ...items].map((item, index) => <span key={`${item}-${index}`}>{item}</span>)}
      </div>
    </div>
  );
}

function Header() {
  const [, setRevision] = useState(0);
  const [search, setSearch] = useState('');

  useEffect(() => onStateChange(() => setRevision((value) => value + 1)), []);

  function submitSearch(event) {
    event.preventDefault();
    const query = new URLSearchParams();
    if (search.trim()) query.set('keyword', search.trim());
    const searchQuery = query.toString();
    navigate(`/${searchQuery ? `?${searchQuery}` : ''}`);
  }

  return (
    <header id="app-header">
      <div className="header-inner">
        <a href="#/" className="wordmark-link" aria-label="Elmavia home">
          <img src={logoJpg} alt="Elmavia — Grow slowly. Wear deliberately." className="wordmark-logo" />
        </a>
        <form className="nav-search" onSubmit={submitSearch}>
          <input
            type="search"
            placeholder="Search products…"
            aria-label="Search products"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button type="submit" aria-label="Search">Search</button>
        </form>
        <nav className="nav-links" aria-label="Main navigation">
          {!isLoggedIn() ? (
            <>
              <a href="#/login">Sign in</a>
              <a href="#/register">Register</a>
            </>
          ) : (
            <>
              {isAdmin() && <a href="#/admin">Admin</a>}
              <a href="#/orders">Orders</a>
              <a href="#/addresses">Addresses</a>
              <a href="#/cart">Cart<span className="cart-badge">{state.cartCount}</span></a>
              <a href="#/profile">{state.user?.name?.split(' ')[0]}{isAdmin() && <span className="badge-role">ADMIN</span>}</a>
              <a
                href="#/"
                onClick={(event) => {
                  event.preventDefault();
                  logout();
                  navigate('/');
                }}
              >
                Sign out
              </a>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function RouteContent({ path, params }) {
  const productMatch = path.match(/^\/product\/(\d+)$/);
  const orderMatch = path.match(/^\/orders\/(\d+)$/);

  if (path === '/') return <HomePage params={params} />;
  if (productMatch) return <ProductPage id={productMatch[1]} />;
  if (path === '/login') return <Guard guestOnly><AuthPage mode="login" /></Guard>;
  if (path === '/register') return <Guard guestOnly><AuthPage mode="register" /></Guard>;
  if (path === '/cart') return <Guard><CartPage /></Guard>;
  if (path === '/checkout') return <Guard><CheckoutPage /></Guard>;
  if (path === '/addresses') return <Guard><AddressesPage /></Guard>;
  if (path === '/orders') return <Guard><OrdersPage params={params} /></Guard>;
  if (orderMatch) return <Guard><OrderDetailPage id={orderMatch[1]} /></Guard>;
  if (path === '/profile') return <Guard><ProfilePage /></Guard>;
  if (path === '/admin') return <Guard adminOnly><AdminPage params={params} /></Guard>;
  return (
    <div className="empty-state">
      <div className="title">Page not found</div>
      <p><a href="#/" className="link-btn">Go back to the shelf</a></p>
    </div>
  );
}

function Guard({ children, guestOnly = false, adminOnly = false }) {
  const allowed = guestOnly
    ? !isLoggedIn()
    : isLoggedIn() && (!adminOnly || isAdmin());

  useEffect(() => {
    if (allowed) return;
    if (guestOnly) navigate('/');
    else if (!isLoggedIn()) {
      showToast('Sign in to continue.', 'error');
      navigate('/login');
    } else {
      showToast("You don't have access to that page.", 'error');
      navigate('/');
    }
  }, [allowed, guestOnly]);

  return allowed ? children : <div className="spinner-row">Redirecting…</div>;
}

function HomePage({ params }) {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [pageData, setPageData] = useState({ totalPages: 0, pageNumber: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const keyword = params.get('keyword') || params.get('q') || '';
  const categoryId = params.get('categoryId') || '';
  const page = Math.max(1, Number(params.get('page') || 1));

  useEffect(() => {
    let active = true;
    api.getCategories()
      .then((result) => {
        if (active) setCategories(Array.isArray(result) ? result : result?.content || []);
      })
      .catch((loadError) => {
        if (active) console.error('Could not load categories:', loadError);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api.getProducts({
      keyword,
      categoryId,
      page: page - 1,
      size: PAGE_SIZE,
      sortBy: 'id',
      direction: 'asc',
    }).then((result) => {
      if (!active) return;
      setProducts(result?.content || result?.products || (Array.isArray(result) ? result : []));
      setPageData({
        totalPages: result?.totalPages || Math.ceil((result?.totalElements || result?.content?.length || 0) / PAGE_SIZE),
        pageNumber: result?.pageNumber ?? page - 1,
      });
    }).catch((loadError) => {
      if (active) setError(loadError.message || 'Something went wrong while loading the collection.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [keyword, categoryId, page]);

  useEffect(() => {
    const targets = document.querySelectorAll('.section-reveal');
    if (!('IntersectionObserver' in window)) {
      targets.forEach((element) => element.classList.add('is-visible'));
      return undefined;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -60px 0px' });
    targets.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [products, loading]);

  function scrollToSection(event, id) {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function selectFilter(nextCategory = categoryId, nextPage = 1) {
    const query = new URLSearchParams();
    if (keyword) query.set('keyword', keyword);
    if (nextCategory) query.set('categoryId', nextCategory);
    if (nextPage > 1) query.set('page', nextPage);
    const searchQuery = query.toString();
    navigate(`/${searchQuery ? `?${searchQuery}` : ''}`);
  }

  function resetFilters() {
    navigate('/');
  }

  return (
    <div className="elmavia-brand">
      <div className="elmavia-announcement">
        <div>ELMAVIA / NEW SEASON</div>
        <div className="announcement-center">FREE SHIPPING ON PREPAID ORDERS</div>
        <div>EST. 2026</div>
      </div>
      <section className="elmavia-hero" id="elmavia-top">
        <img className="hero-image" src={EDITORIAL_IMAGE} alt="ELMAVIA oversized fashion campaign" loading="eager" />
        <div className="hero-overlay" />
        <div className="hero-grain" />
        <header className="elmavia-nav">
          <button className="elmavia-logo brand-scroll" data-target="elmavia-top" onClick={(event) => scrollToSection(event, 'elmavia-top')}>ELMAVIA</button>
          <nav className="hero-navigation">
            <a href="#collection" onClick={(event) => scrollToSection(event, 'collection')}>COLLECTION</a>
            <a href="#campaign" onClick={(event) => scrollToSection(event, 'campaign')}>CAMPAIGN</a>
            <a href="#philosophy" onClick={(event) => scrollToSection(event, 'philosophy')}>ABOUT</a>
          </nav>
          <div className="hero-actions">
            <button className="hero-action" onClick={() => navigate(isLoggedIn() ? '/profile' : '/login')}>ACCOUNT</button>
            <button className="hero-action" onClick={() => navigate('/cart')}>BAG <span className="elmavia-cart-count">{state.cartCount}</span></button>
          </div>
        </header>
        <div className="hero-index"><span>01</span><span className="hero-line" /><span>THE EVERYDAY COLLECTION</span></div>
        <div className="hero-content">
          <p className="hero-kicker">ELMAVIA / 01 — THE NEW SILHOUETTE</p>
          <h1>WEAR <span>YOUR</span> <em>SPACE.</em></h1>
          <p className="hero-description">Oversized essentials designed for presence, movement and quiet confidence.</p>
          <a href="#collection" className="elmavia-primary-button" onClick={(event) => scrollToSection(event, 'collection')}>
            <span>EXPLORE COLLECTION</span><span>↗</span>
          </a>
        </div>
        <div className="hero-bottom">
          <div className="hero-scroll"><span className="scroll-dot" />SCROLL TO EXPLORE</div>
          <div className="hero-location">PUNE / INDIA</div>
        </div>
      </section>

      <section className="elmavia-story section-reveal">
        <div className="section-number">02</div>
        <div className="story-heading"><span className="eyebrow">THE ELMAVIA IDEA</span><h2>NOT MADE<br />TO <i>FIT IN.</i></h2></div>
        <div className="story-copy">
          <p className="large-copy">ELMAVIA was created around one simple idea: clothing should give you space to exist.</p>
          <p>We build oversized silhouettes, refined essentials and everyday pieces with a focus on proportion, texture and understated confidence.</p>
          <a href="#philosophy" className="text-link" onClick={(event) => scrollToSection(event, 'philosophy')}>OUR PHILOSOPHY <span>↗</span></a>
        </div>
      </section>

      <section className="elmavia-collection section-reveal" id="collection">
        <div className="collection-top">
          <div><span className="eyebrow">03 / THE COLLECTION</span><h2>THE <i>NEW EDIT.</i></h2></div>
          <div className="collection-intro"><p>Essential silhouettes. Relaxed proportions. Designed to become part of your everyday uniform.</p><span className="collection-count">{String(products.length).padStart(2, '0')} — {String(PAGE_SIZE).padStart(2, '0')}</span></div>
        </div>
        <div className="elmavia-category-area">
          {categories.length > 0 && (
            <>
              <div className="category-heading"><span>FILTER</span></div>
              <div className="category-list">
                <button className={`category-chip ${!categoryId ? 'active' : ''}`} onClick={() => selectFilter('')}>ALL</button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    className={`category-chip ${String(category.id) === categoryId ? 'active' : ''}`}
                    onClick={() => selectFilter(String(category.id))}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="elmavia-products">
          {loading ? (
            <div className="products-loading"><span />CURATING COLLECTION</div>
          ) : error ? (
            <div className="products-error"><span>COLLECTION UNAVAILABLE</span><p>{error}</p></div>
          ) : products.length === 0 ? (
            <div className="products-empty">
              <span>NO PIECES FOUND</span><p>Try another category or explore the full collection.</p>
              <button className="empty-button" onClick={resetFilters}>VIEW ALL</button>
            </div>
          ) : products.map((product, index) => (
            <HomeProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
        {!loading && !error && pageData.totalPages > 1 && (
          <div className="elmavia-pagination">
            <div className="pagination-inner">
              <button className="pagination-arrow" disabled={page <= 1} onClick={() => selectFilter(categoryId, page - 1)}>←</button>
              <div className="pagination-pages">
                {Array.from({ length: pageData.totalPages }, (_, index) => index + 1)
                  .filter((number) => number === 1 || number === pageData.totalPages || Math.abs(number - page) <= 1)
                  .map((number, index, visible) => (
                    <span className="pagination-number-wrap" key={number}>
                      {index > 0 && number - visible[index - 1] > 1 && <span className="pagination-dots">...</span>}
                      <button className={`pagination-number ${number === page ? 'active' : ''}`} onClick={() => selectFilter(categoryId, number)}>{String(number).padStart(2, '0')}</button>
                    </span>
                  ))}
              </div>
              <button className="pagination-arrow" disabled={page >= pageData.totalPages} onClick={() => selectFilter(categoryId, page + 1)}>→</button>
            </div>
          </div>
        )}
      </section>

      <section className="elmavia-philosophy section-reveal" id="philosophy">
        <div className="philosophy-header"><div><span className="eyebrow">05 / BRAND PHILOSOPHY</span><h2>THE <i>ELMAVIA</i> CODE.</h2></div><p>Four principles behind everything we make.</p></div>
        <div className="philosophy-grid">
          {[
            ['01', 'OVERSIZED', 'Freedom in proportion. Silhouettes designed to breathe.'],
            ['02', 'PREMIUM', 'Refined materials and details without unnecessary noise.'],
            ['03', 'ESSENTIAL', 'Pieces designed to live beyond one season or one trend.'],
            ['04', 'CONFIDENCE', 'Quiet on the surface. Impossible to ignore.'],
          ].map(([number, title, copy]) => <article className="philosophy-item" key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></article>)}
        </div>
      </section>

      <section className="elmavia-final section-reveal" id="campaign">
        <img src={EDITORIAL_IMAGE} alt="ELMAVIA campaign" loading="lazy" />
        <div className="final-overlay" /><div className="final-giant-text">ELMAVIA</div>
        <div className="final-content"><span>06 / THIS IS ELMAVIA</span><h2>WEAR<br />YOUR <i>SPACE.</i></h2><a href="#collection" className="elmavia-primary-button final-button" onClick={(event) => scrollToSection(event, 'collection')}><span>DISCOVER ELMAVIA</span><span>↗</span></a></div>
      </section>
      <footer className="elmavia-footer">
        <div className="footer-brand">ELMAVIA</div>
        <div className="footer-grid">
          <div><span className="footer-label">NAVIGATE</span><a href="#collection" onClick={(event) => scrollToSection(event, 'collection')}>Collection</a><a href="#campaign" onClick={(event) => scrollToSection(event, 'campaign')}>Campaign</a><a href="#philosophy" onClick={(event) => scrollToSection(event, 'philosophy')}>Philosophy</a></div>
          <div><span className="footer-label">ACCOUNT</span><button onClick={() => navigate(isLoggedIn() ? '/profile' : '/login')}>Login / Account</button><button onClick={() => navigate('/cart')}>Shopping Bag</button></div>
          <div><span className="footer-label">ELMAVIA</span><p>Oversized essentials for everyday presence.</p></div>
        </div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} ELMAVIA</span><span>MADE FOR YOUR SPACE.</span><button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>BACK TO TOP ↑</button></div>
      </footer>
    </div>
  );
}

function HomeProductCard({ product, index }) {
  const [busy, setBusy] = useState(false);
  const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
  const image = product.imageUrl || product.image || product.thumbnail || '';
  async function addToBag() {
    if (hasVariants) {
      navigate(`/product/${product.id}`);
      return;
    }
    if (!isLoggedIn()) {
      showToast('Please sign in to add products to your bag.', 'error');
      navigate('/login');
      return;
    }
    setBusy(true);
    try {
      await api.addCartItem({ productId: product.id, quantity: 1 });
      syncCartBadge();
      showToast('Added to bag.', 'ok');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className={`elmavia-product-card ${index === 0 ? 'product-card-featured' : ''}`}>
      <button className="product-image-button product-open" onClick={() => navigate(`/product/${product.id}`)} aria-label={`View ${product.name}`}>
        <div className="product-image-wrap">
          {image ? <img src={image} alt={product.name} loading="lazy" onError={(event) => { event.currentTarget.src = logoJpg; }} /> : <span>{placeholderThumb(product.name)}</span>}
          <div className="product-image-overlay" />
          {(product.badge || product.label || (index === 0 && 'FEATURED')) && <span className="product-badge">{product.badge || product.label || 'FEATURED'}</span>}
          <span className="product-number">{String(index + 1).padStart(2, '0')}</span>
          <span className="product-view">VIEW <span>↗</span></span>
        </div>
      </button>
      <div className="product-information">
        <div className="product-meta"><span>ELMAVIA</span><span>ESSENTIAL</span></div>
        <div className="product-title-row">
          <button className="product-name product-open" onClick={() => navigate(`/product/${product.id}`)}>{product.name}</button>
          <span className="product-price">{formatMoney(product.price)}</span>
        </div>
        <button className={`product-add ${busy ? 'adding' : ''}`} onClick={addToBag} disabled={busy || product.stock <= 0}>
          <span>{busy ? 'ADDING...' : product.stock <= 0 ? 'SOLD OUT' : hasVariants ? 'CHOOSE OPTIONS' : 'ADD TO BAG'}</span>
          <strong>{busy ? '...' : '+'}</strong>
        </button>
      </div>
    </article>
  );
}

function ProductPage({ id }) {
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const [colorName, setColorName] = useState('');
  const [variantId, setVariantId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    api.getProduct(id).then((result) => {
      if (!active) return;
      setProduct(result);
      const variants = result.variants || [];
      const firstColor = [...new Set(variants.map((variant) => variant.colorName))][0] || '';
      setColorName(firstColor);
      const firstVariant = variants.find((variant) => variant.colorName === firstColor && variant.stock > 0)
        || variants.find((variant) => variant.colorName === firstColor);
      setVariantId(firstVariant ? String(firstVariant.id) : '');
    }).catch((loadError) => {
      if (active) setError(loadError.message);
    });
    return () => { active = false; };
  }, [id]);

  const variants = product?.variants || [];
  const colors = [...new Map(variants.map((variant) => [variant.colorName, variant])).values()];
  const selectedVariant = variants.find((variant) => String(variant.id) === variantId) || null;
  const colorVariants = variants.filter((variant) => variant.colorName === colorName);
  const stock = selectedVariant ? selectedVariant.stock : product?.stock || 0;
  const image = selectedVariant?.imageUrl || product?.imageUrl;

  function chooseColor(name) {
    setColorName(name);
    const options = variants.filter((variant) => variant.colorName === name);
    const next = options.find((variant) => variant.stock > 0) || options[0];
    setVariantId(next ? String(next.id) : '');
    setQuantity(1);
  }

  async function addToCart() {
    if (!isLoggedIn()) {
      showToast('Sign in to add items to your cart.', 'error');
      navigate('/login');
      return;
    }
    setBusy(true);
    try {
      await api.addCartItem({ productId: product.id, variantId: selectedVariant?.id, quantity });
      showToast('Added to cart.', 'ok');
      syncCartBadge();
    } catch (requestError) {
      showToast(requestError.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  if (error) return <EmptyState title="Product not found" message={error} />;
  if (!product) return <div className="spinner-row">Loading product…</div>;

  return (
    <section>
      <a href="#/" className="link-btn" style={{ display: 'inline-block', marginBottom: 20 }}>← Back to shelf</a>
      <div className="two-col">
        <div className="product-thumb product-detail-image" style={{ aspectRatio: '4/3', fontSize: 48 }}>
          {image ? <img src={image} alt={product.name} onError={(event) => { event.currentTarget.src = logoJpg; }} /> : <span>{placeholderThumb(product.name)}</span>}
        </div>
        <div>
          <p className="product-cat" style={{ marginBottom: 6 }}>{product.category?.name || ''}</p>
          <h1 className="page-title" style={{ fontSize: 26 }}>{product.name}</h1>
          <p className="muted" style={{ margin: '14px 0 20px' }}>{product.description || 'No description provided.'}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <span className="ticket" style={{ fontSize: 18 }}>{formatMoney(product.price)}</span>
            <span className={`stock-note ${stock <= 0 ? 'low' : ''}`}>{stock > 0 ? `${stock} in stock` : 'Out of stock'}</span>
          </div>
          {variants.length > 0 && (
            <>
              <div className="color-picker">
                <div className="color-picker-heading"><span>Color</span><strong>{colorName}</strong></div>
                <div className="color-swatches" role="group" aria-label="Choose a color">
                  {colors.map((color) => (
                    <button
                      type="button"
                      key={color.colorName}
                      className={`color-swatch ${colorName === color.colorName ? 'selected' : ''}`}
                      aria-label={color.colorName}
                      title={color.colorName}
                      style={{ '--swatch-color': color.colorValue }}
                      onClick={() => chooseColor(color.colorName)}
                    />
                  ))}
                </div>
              </div>
              <div className="color-picker">
                <div className="color-picker-heading"><span>Size</span></div>
                <div className="size-options" role="group" aria-label="Choose a size">
                  {colorVariants.map((variant) => (
                    <button
                      type="button"
                      key={variant.id}
                      className={`size-option ${String(variant.id) === variantId ? 'selected' : ''}`}
                      disabled={variant.stock <= 0}
                      onClick={() => { setVariantId(String(variant.id)); setQuantity(1); }}
                    >
                      {variant.size}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="qty-control">
              <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button>
              <span>{quantity}</span>
              <button type="button" onClick={() => setQuantity((value) => Math.min(stock, value + 1))}>+</button>
            </div>
            <button className="btn btn-wine" disabled={stock <= 0 || busy} onClick={addToCart}>{busy ? 'Adding…' : stock <= 0 ? 'Out of stock' : 'Add to cart'}</button>
          </div>
        </div>
      </div>
    </section>
  );
}

function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const body = isRegister
      ? {
          name: String(data.get('name')).trim(),
          email: String(data.get('email')).trim(),
          phone: String(data.get('phone') || '').trim() || undefined,
          password: data.get('password'),
        }
      : { email: String(data.get('email')).trim(), password: data.get('password') };
    setBusy(true);
    try {
      const result = isRegister ? await api.register(body) : await api.login(body);
      login(result);
      showToast(isRegister ? `Account created. Welcome, ${result.user.name.split(' ')[0]}.` : `Welcome back, ${result.user.name.split(' ')[0]}.`, 'ok');
      navigate('/');
    } catch (error) {
      showToast(error.message, 'error');
      setBusy(false);
    }
  }

  return (
    <div className="form-card">
      <img src={logoSvg} alt="Elmavia" style={{ height: 34, display: 'block', margin: '0 auto 24px' }} />
      <h1 className="page-title" style={{ textAlign: 'center', fontSize: 26 }}>{isRegister ? 'Create account' : 'Sign in'}</h1>
      <p className="page-sub" style={{ textAlign: 'center' }}>{isRegister ? 'Join Elmavia in a few seconds.' : 'Welcome back to Elmavia.'}</p>
      <form onSubmit={submit}>
        {isRegister && <Field label="Full name" name="name" required />}
        <Field label="Email" name="email" type="email" autoComplete="email" required />
        {isRegister && <Field label="Phone (optional)" name="phone" type="tel" />}
        <Field label="Password" name="password" type="password" required minLength={isRegister ? 8 : undefined} autoComplete={isRegister ? 'new-password' : 'current-password'} />
        {isRegister && <div className="muted" style={{ fontSize: 12, marginTop: -12, marginBottom: 14 }}>At least 8 characters.</div>}
        <button type="submit" className="btn btn-wine" style={{ width: '100%' }} disabled={busy}>{busy ? (isRegister ? 'Creating account…' : 'Signing in…') : (isRegister ? 'Create account' : 'Sign in')}</button>
      </form>
      <p className="form-footer">
        {isRegister ? <>Already have an account? <a href="#/login" className="link-btn">Sign in</a></> : <>New here? <a href="#/register" className="link-btn">Create an account</a></>}
      </p>
    </div>
  );
}

function CartPage() {
  const [cart, setCart] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  async function loadCart() {
    setError('');
    try {
      const result = await api.getCart();
      setCart(result);
    } catch (loadError) {
      setError(loadError.message);
    }
  }
  useEffect(() => { loadCart(); }, []);

  async function mutate(action, message) {
    setBusyId(String(action.id || 'all'));
    try {
      if (action.type === 'clear') await api.clearCart();
      else if (action.type === 'remove') await api.removeCartItem(action.id);
      else await api.updateCartItem(action.id, { quantity: action.quantity });
      if (message) showToast(message, 'ok');
      syncCartBadge();
      await loadCart();
    } catch (requestError) {
      showToast(requestError.message, 'error');
    } finally {
      setBusyId('');
    }
  }

  if (error) return <EmptyState title="Couldn't load your cart" message={error} />;
  if (!cart) return <div className="spinner-row">Loading your cart…</div>;
  if (!cart.items?.length) {
    return <><h1 className="page-title">Your cart</h1><EmptyState title="Your cart is empty" message={<>Find something on <a href="#/" className="link-btn">the shelf</a>.</>} /></>;
  }

  return (
    <>
      <h1 className="page-title">Your cart</h1>
      <div className="two-col">
        <div>
          <div className="row-list">
            {cart.items.map((item) => (
              <div className="row-item" key={item.id}>
                <div className="row-thumb">{item.imageUrl ? <img src={item.imageUrl} alt={item.product.name} /> : <span>{placeholderThumb(item.product.name)}</span>}</div>
                <div className="row-info">
                  <div className="name">{item.product.name}</div>
                  <div className="meta">{[item.colorName, item.size].filter(Boolean).join(' · ')}{item.colorName || item.size ? ' · ' : ''}{formatMoney(item.product.price)} each · {item.availableStock} in stock</div>
                </div>
                <div className="qty-control">
                  <button type="button" disabled={busyId === String(item.id)} onClick={() => mutate({ type: 'quantity', id: item.id, quantity: Math.max(1, item.quantity - 1) })}>−</button>
                  <span>{item.quantity}</span>
                  <button type="button" disabled={busyId === String(item.id) || item.quantity >= item.availableStock} onClick={() => mutate({ type: 'quantity', id: item.id, quantity: item.quantity + 1 })}>+</button>
                </div>
                <span className="ticket">{formatMoney(item.lineTotal)}</span>
                <button className="link-btn remove-item" style={{ color: 'var(--danger)' }} disabled={busyId === String(item.id)} onClick={() => mutate({ type: 'remove', id: item.id }, 'Removed from cart.')}>Remove</button>
              </div>
            ))}
          </div>
          <button className="link-btn mt-16" disabled={busyId === 'all'} onClick={() => {
            if (confirm('Remove all items from your cart?')) mutate({ type: 'clear' }, 'Cart cleared.');
          }}>Clear cart</button>
        </div>
        <div className="summary-card">
          <h2 className="section-title">Summary</h2>
          <div className="summary-line"><span>Items</span><span>{cart.totalItems}</span></div>
          <div className="summary-line total"><span>Subtotal</span><span>{formatMoney(cart.subtotal)}</span></div>
          <button className="btn btn-wine" style={{ width: '100%', marginTop: 8 }} onClick={() => navigate('/checkout')}>Checkout</button>
        </div>
      </div>
    </>
  );
}

function CheckoutPage() {
  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [error, setError] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([api.getCart(), api.getAddresses()]).then(([nextCart, nextAddresses]) => {
      if (!active) return;
      setCart(nextCart);
      setAddresses(nextAddresses);
      setSelectedId(String(nextAddresses.find((address) => address.isDefault)?.id || nextAddresses[0]?.id || ''));
    }).catch((loadError) => {
      if (active) setError(loadError.message);
    });
    return () => { active = false; };
  }, []);

  async function reloadAddresses() {
    const result = await api.getAddresses();
    setAddresses(result);
    setSelectedId(String(result.find((address) => address.isDefault)?.id || result[0]?.id || ''));
    setShowAddressForm(false);
  }

  async function placeOrder() {
    if (!selectedId) {
      showToast('Choose a shipping address.', 'error');
      return;
    }
    setBusy(true);
    try {
      const order = await api.createOrder({ addressId: selectedId });
      showToast('Order placed!', 'ok');
      syncCartBadge();
      navigate(`/orders/${order.id}`);
    } catch (requestError) {
      showToast(requestError.message, 'error');
      setBusy(false);
    }
  }

  if (error) return <EmptyState title="Couldn't load checkout" message={error} />;
  if (!cart) return <div className="spinner-row">Loading checkout…</div>;
  if (!cart.items?.length) return <EmptyState title="Your cart is empty" message={<>Add something from <a href="#/" className="link-btn">the shelf</a> before checking out.</>} />;

  return (
    <>
      <h1 className="page-title">Checkout</h1>
      <div className="two-col">
        <div>
          <h2 className="section-title">Ship to</h2>
          {addresses.map((address) => (
            <label className="address-card" style={{ cursor: 'pointer', alignItems: 'center' }} key={address.id}>
              <div>
                <input type="radio" name="address" value={address.id} checked={selectedId === String(address.id)} onChange={() => setSelectedId(String(address.id))} style={{ width: 'auto', marginRight: 10 }} />
                <strong>{address.fullName}</strong><br />
                <span className="muted" style={{ fontSize: 13 }}>{address.addressLine1}, {address.city}, {address.state} {address.postalCode}</span>
              </div>
            </label>
          ))}
          <button className="link-btn mt-16" onClick={() => setShowAddressForm(true)}>+ Add a new address</button>
          <h2 className="section-title mt-16" style={{ marginTop: 32 }}>Order items</h2>
          <div className="row-list">
            {cart.items.map((item) => (
              <div className="row-item" key={item.id}>
                <div className="row-thumb">{item.imageUrl ? <img src={item.imageUrl} alt={item.product.name} /> : <span>{placeholderThumb(item.product.name)}</span>}</div>
                <div className="row-info"><div className="name">{item.product.name}</div><div className="meta">{[item.colorName, item.size].filter(Boolean).join(' · ')}{item.colorName || item.size ? ' · ' : ''}Qty {item.quantity} × {formatMoney(item.product.price)}</div></div>
                <span className="ticket">{formatMoney(item.lineTotal)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="summary-card">
          <h2 className="section-title">Summary</h2>
          <div className="summary-line"><span>Items</span><span>{cart.totalItems}</span></div>
          <div className="summary-line total"><span>Total</span><span>{formatMoney(cart.subtotal)}</span></div>
          <button className="btn btn-wine" style={{ width: '100%', marginTop: 8 }} disabled={!addresses.length || busy} onClick={placeOrder}>{busy ? 'Placing order…' : 'Place order'}</button>
          {!addresses.length && <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>Add a shipping address to continue.</p>}
        </div>
      </div>
      {showAddressForm && <AddressModal onClose={() => setShowAddressForm(false)} onSaved={reloadAddresses} />}
    </>
  );
}

function AddressesPage() {
  const [addresses, setAddresses] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(undefined);

  async function load() {
    setError('');
    try {
      setAddresses(await api.getAddresses());
    } catch (loadError) {
      setError(loadError.message);
    }
  }
  useEffect(() => { load(); }, []);

  async function deleteAddress(id) {
    if (!confirm('Delete this address?')) return;
    try {
      await api.deleteAddress(id);
      showToast('Address deleted.', 'ok');
      await load();
    } catch (requestError) {
      showToast(requestError.message, 'error');
    }
  }

  return (
    <>
      <h1 className="page-title">Addresses</h1>
      <p className="page-sub">Manage the shipping addresses on your account.</p>
      <button className="btn btn-wine mb-16" onClick={() => setEditing(null)}>Add address</button>
      {error ? <EmptyState title="Couldn't load addresses" message={error} /> : addresses === null ? <div className="spinner-row">Loading addresses…</div> : !addresses.length ? <EmptyState title="No addresses yet" message="Add one before you check out." /> : (
        <div className="address-list">
          {addresses.map((address) => (
            <div className="address-card" key={address.id}>
              <div>
                <div style={{ fontWeight: 600 }}>{address.fullName} {address.isDefault && <span className="badge-role" style={{ background: 'var(--brass)' }}>DEFAULT</span>}</div>
                <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                  {address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ''}<br />
                  {address.city}, {address.state} {address.postalCode}, {address.country}<br />
                  {address.phone}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button className="link-btn" onClick={() => setEditing(address)}>Edit</button>
                <button className="link-btn" style={{ color: 'var(--danger)' }} onClick={() => deleteAddress(address.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {editing !== undefined && <AddressModal address={editing || undefined} onClose={() => setEditing(undefined)} onSaved={async () => { setEditing(undefined); await load(); }} />}
    </>
  );
}

function OrdersPage({ params }) {
  const page = Math.max(0, Number(params.get('page') || 0));
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    api.getMyOrders({ page, size: 8 }).then((data) => { if (active) setResult(data); }).catch((loadError) => { if (active) setError(loadError.message); });
    return () => { active = false; };
  }, [page]);
  if (error) return <EmptyState title="Couldn't load orders" message={error} />;
  if (!result) return <div className="spinner-row">Loading orders…</div>;
  if (!result.content?.length) return <><h1 className="page-title">Your orders</h1><EmptyState title="No orders yet" message="Once you place an order it'll show up here." /></>;
  return (
    <>
      <h1 className="page-title">Your orders</h1>
      <div className="row-list">
        {result.content.map((order) => (
          <a className="row-item" href={`#/orders/${order.id}`} key={order.id}>
            <div className="row-info"><div className="name">Order #{order.id}</div><div className="meta">{formatDate(order.createdAt)} · {order.orderItems.length} item(s)</div></div>
            <span className={`status-pill ${order.orderStatus}`}>{order.orderStatus}</span>
            <span className="ticket">{formatMoney(order.totalAmount)}</span>
          </a>
        ))}
      </div>
      <Pagination page={result.pageNumber} totalPages={result.totalPages} onChange={(nextPage) => navigate(`/orders?page=${nextPage}`)} />
    </>
  );
}

function OrderDetailPage({ id }) {
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    api.getMyOrder(id).then((data) => { if (active) setOrder(data); }).catch((loadError) => { if (active) setError(loadError.message); });
    return () => { active = false; };
  }, [id]);

  async function cancelOrder() {
    if (!confirm('Cancel this order? Stock will be restored.')) return;
    try {
      setOrder(await api.cancelOrder(id));
      showToast('Order cancelled.', 'ok');
    } catch (requestError) {
      showToast(requestError.message, 'error');
    }
  }

  if (error) return <EmptyState title="Order not found" message={error} />;
  if (!order) return <div className="spinner-row">Loading order…</div>;
  const canCancel = !['SHIPPED', 'DELIVERED', 'CANCELLED'].includes(order.orderStatus);
  const address = order.shippingAddress || {};
  return (
    <>
      <a href="#/orders" className="link-btn" style={{ display: 'inline-block', marginBottom: 20 }}>← Back to orders</a>
      <div className="two-col">
        <div>
          <h1 className="page-title" style={{ fontSize: 24 }}>Order #{order.id}</h1>
          <p className="page-sub">Placed {formatDate(order.createdAt)}</p>
          <h2 className="section-title">Items</h2>
          <div className="row-list">
            {order.orderItems.map((item) => (
              <div className="row-item" key={item.id}>
                <div className="row-thumb" />
                <div className="row-info"><div className="name">{item.productName}</div><div className="meta">{[item.variantColor, item.variantSize].filter(Boolean).join(' · ')}{item.variantColor || item.variantSize ? ' · ' : ''}Qty {item.quantity} × {formatMoney(item.priceAtPurchase)}</div></div>
                <span className="ticket">{formatMoney(item.lineTotal)}</span>
              </div>
            ))}
          </div>
          <h2 className="section-title mt-16" style={{ marginTop: 28 }}>Shipping to</h2>
          <p className="muted" style={{ fontSize: 14 }}>
            {address.fullName}<br />{address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ''}<br />
            {address.city}, {address.state} {address.postalCode}<br />{address.country} · {address.phone}
          </p>
        </div>
        <div className="summary-card">
          <h2 className="section-title">Status</h2>
          <div className="summary-line"><span>Order</span><span className={`status-pill ${order.orderStatus}`}>{order.orderStatus}</span></div>
          <div className="summary-line"><span>Payment</span><span className={`status-pill ${order.paymentStatus}`}>{order.paymentStatus}</span></div>
          <div className="summary-line total"><span>Total</span><span>{formatMoney(order.totalAmount)}</span></div>
          {canCancel && <button className="btn btn-danger" style={{ width: '100%', marginTop: 12 }} onClick={cancelOrder}>Cancel order</button>}
        </div>
      </div>
    </>
  );
}

function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    api.getMe().then((data) => { if (active) setProfile(data); }).catch((loadError) => { if (active) setError(loadError.message); });
    return () => { active = false; };
  }, []);

  async function save(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    try {
      const updated = await api.updateMe({ name: String(data.get('name')).trim(), phone: String(data.get('phone') || '').trim() || undefined });
      const nextUser = { ...state.user, name: updated.name, phone: updated.phone };
      login({ accessToken: state.token, user: nextUser });
      showToast('Profile updated.', 'ok');
    } catch (requestError) {
      showToast(requestError.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  if (error) return <EmptyState title="Couldn't load your profile" message={error} />;
  if (!profile) return <div className="spinner-row">Loading profile…</div>;
  return (
    <div className="form-card">
      <h1 className="page-title">Your profile</h1>
      <p className="page-sub">{profile.email} · {profile.role === 'ROLE_ADMIN' ? 'Administrator' : 'Customer'}</p>
      <form onSubmit={save}>
        <Field label="Full name" name="name" defaultValue={profile.name} required />
        <Field label="Phone" name="phone" defaultValue={profile.phone || ''} />
        <button type="submit" className="btn btn-wine" style={{ width: '100%' }} disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
      </form>
    </div>
  );
}

function AdminPage({ params }) {
  const tabs = ['products', 'categories', 'orders'];
  const tab = tabs.includes(params.get('tab')) ? params.get('tab') : 'products';
  function selectTab(nextTab) {
    const query = new URLSearchParams(params);
    query.set('tab', nextTab);
    query.delete('page');
    navigate(`/admin?${query}`);
  }
  return (
    <>
      <h1 className="page-title">Admin</h1>
      <p className="page-sub">Manage the catalog and fulfil orders.</p>
      <div className="admin-tabs">
        {tabs.map((name) => <button key={name} className={tab === name ? 'active' : ''} onClick={() => selectTab(name)}>{name[0].toUpperCase() + name.slice(1)}</button>)}
      </div>
      {tab === 'products' ? <AdminProducts /> : tab === 'categories' ? <AdminCategories /> : <AdminOrders params={params} />}
    </>
  );
}

function AdminProducts() {
  const [products, setProducts] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(undefined);

  async function load() {
    setError('');
    try {
      const [productResult, categoryResult] = await Promise.all([
        api.getProducts({ page: 0, size: 100, sortBy: 'id', direction: 'desc' }),
        api.getCategories(),
      ]);
      setProducts(productResult.content || []);
      setCategories(Array.isArray(categoryResult) ? categoryResult : categoryResult?.content || []);
    } catch (loadError) {
      setError(loadError.message);
    }
  }
  useEffect(() => { load(); }, []);

  async function deleteProduct(product) {
    if (!confirm(`Delete "${product.name}"?`)) return;
    try {
      await api.deleteProduct(product.id);
      showToast('Product deleted.', 'ok');
      await load();
    } catch (requestError) {
      showToast(requestError.message, 'error');
    }
  }

  if (error) return <EmptyState title="Couldn't load products" message={error} />;
  if (!products) return <div className="spinner-row">Loading products…</div>;
  return (
    <>
      <button className="btn btn-wine mb-16" onClick={() => {
        if (categories.length === 0) showToast('Create a category first.', 'error');
        else setEditing(null);
      }}>Add product</button>
      {!products.length ? <EmptyState title="No products yet" message="Add products manually from this admin page." /> : (
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th /></tr></thead>
          <tbody>{products.map((product) => (
            <tr key={product.id}>
              <td>{product.name}</td><td>{product.category?.name || '—'}</td><td>{formatMoney(product.price)}</td><td>{product.stock}</td>
              <td style={{ textAlign: 'right' }}><button className="link-btn" onClick={() => setEditing(product)}>Edit</button>&nbsp;<button className="link-btn" style={{ color: 'var(--danger)' }} onClick={() => deleteProduct(product)}>Delete</button></td>
            </tr>
          ))}</tbody>
        </table>
      )}
      {editing !== undefined && <ProductModal product={editing || undefined} categories={categories} onClose={() => setEditing(undefined)} onSaved={async () => { setEditing(undefined); await load(); }} />}
    </>
  );
}

function AdminCategories() {
  const [categories, setCategories] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(undefined);
  async function load() {
    setError('');
    try {
      const result = await api.getCategories();
      setCategories(Array.isArray(result) ? result : result?.content || []);
    } catch (loadError) {
      setError(loadError.message);
    }
  }
  useEffect(() => { load(); }, []);

  async function deleteCategory(category) {
    if (!confirm(`Delete category "${category.name}"? Products using it must be reassigned first.`)) return;
    try {
      await api.deleteCategory(category.id);
      showToast('Category deleted.', 'ok');
      await load();
    } catch (requestError) {
      showToast(requestError.message, 'error');
    }
  }

  if (error) return <EmptyState title="Couldn't load categories" message={error} />;
  if (!categories) return <div className="spinner-row">Loading categories…</div>;
  return (
    <>
      <button className="btn btn-wine mb-16" onClick={() => setEditing(null)}>Add category</button>
      {!categories.length ? <EmptyState title="No categories yet" message="Add a category before creating products." /> : (
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Description</th><th /></tr></thead>
          <tbody>{categories.map((category) => (
            <tr key={category.id}>
              <td>{category.name}</td><td className="muted">{category.description || '—'}</td>
              <td style={{ textAlign: 'right' }}><button className="link-btn" onClick={() => setEditing(category)}>Edit</button>&nbsp;<button className="link-btn" style={{ color: 'var(--danger)' }} onClick={() => deleteCategory(category)}>Delete</button></td>
            </tr>
          ))}</tbody>
        </table>
      )}
      {editing !== undefined && <CategoryModal category={editing || undefined} onClose={() => setEditing(undefined)} onSaved={async () => { setEditing(undefined); await load(); }} />}
    </>
  );
}

function AdminOrders({ params }) {
  const page = Math.max(0, Number(params.get('page') || 0));
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    api.getAllOrders({ page, size: 10 }).then((data) => { if (active) setResult(data); }).catch((loadError) => { if (active) setError(loadError.message); });
    return () => { active = false; };
  }, [page]);
  if (error) return <EmptyState title="Couldn't load orders" message={error} />;
  if (!result) return <div className="spinner-row">Loading orders…</div>;
  if (!result.content?.length) return <EmptyState title="No orders yet" />;

  async function saveStatus(orderId, row) {
    try {
      await api.updateOrderStatus(orderId, {
        orderStatus: row.querySelector('[name="orderStatus"]').value,
        paymentStatus: row.querySelector('[name="paymentStatus"]').value,
      });
      showToast(`Order #${orderId} updated.`, 'ok');
    } catch (requestError) {
      showToast(requestError.message, 'error');
    }
  }

  return (
    <>
      <table className="admin-table">
        <thead><tr><th>Order</th><th>Date</th><th>Total</th><th>Order status</th><th>Payment</th><th /></tr></thead>
        <tbody>{result.content.map((order) => (
          <tr key={order.id}>
            <td>#{order.id}</td><td>{formatDate(order.createdAt)}</td><td>{formatMoney(order.totalAmount)}</td>
            <td><select name="orderStatus" defaultValue={order.orderStatus}>{ORDER_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></td>
            <td><select name="paymentStatus" defaultValue={order.paymentStatus}>{PAYMENT_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></td>
            <td><button className="btn btn-small btn-outline" onClick={(event) => saveStatus(order.id, event.currentTarget.closest('tr'))}>Save</button></td>
          </tr>
        ))}</tbody>
      </table>
      <Pagination page={result.pageNumber} totalPages={result.totalPages} onChange={(nextPage) => navigate(`/admin?tab=orders&page=${nextPage}`)} />
    </>
  );
}

function AddressModal({ address, onClose, onSaved }) {
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload = {
      fullName: String(data.get('fullName')).trim(),
      phone: String(data.get('phone')).trim(),
      addressLine1: String(data.get('addressLine1')).trim(),
      addressLine2: String(data.get('addressLine2')).trim() || undefined,
      city: String(data.get('city')).trim(),
      state: String(data.get('state')).trim(),
      postalCode: String(data.get('postalCode')).trim(),
      country: String(data.get('country')).trim(),
      isDefault: data.get('isDefault') === 'on',
    };
    setBusy(true);
    try {
      if (address) {
        await api.updateAddress(address.id, payload);
        showToast('Address updated.', 'ok');
      } else {
        await api.addAddress(payload);
        showToast('Address added.', 'ok');
      }
      await onSaved();
    } catch (error) {
      showToast(error.message, 'error');
      setBusy(false);
    }
  }
  return (
    <Modal title={address ? 'Edit address' : 'Add address'} onClose={onClose}>
      <form onSubmit={submit}>
        <Field label="Full name" name="fullName" defaultValue={address?.fullName || ''} required />
        <Field label="Phone" name="phone" defaultValue={address?.phone || ''} required />
        <Field label="Address line 1" name="addressLine1" defaultValue={address?.addressLine1 || ''} required />
        <Field label="Address line 2 (optional)" name="addressLine2" defaultValue={address?.addressLine2 || ''} />
        <Field label="City" name="city" defaultValue={address?.city || ''} required />
        <Field label="State" name="state" defaultValue={address?.state || ''} required />
        <Field label="Postal code" name="postalCode" defaultValue={address?.postalCode || ''} required />
        <Field label="Country" name="country" defaultValue={address?.country || ''} required />
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5 }}>
          <input type="checkbox" name="isDefault" defaultChecked={address?.isDefault || false} style={{ width: 'auto' }} /> Set as default
        </label>
        <ModalActions onClose={onClose} busy={busy} label="Save address" />
      </form>
    </Modal>
  );
}

function ProductModal({ product, categories, onClose, onSaved }) {
  const [variants, setVariants] = useState(product?.variants || []);
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload = {
      name: String(data.get('name')).trim(),
      description: String(data.get('description') || '').trim() || undefined,
      price: Number(data.get('price')),
      stock: Number(data.get('stock')),
      categoryId: Number(data.get('categoryId')),
      imageUrl: String(data.get('imageUrl') || '').trim() || undefined,
      variants: variants.map((variant) => ({
        id: variant.id || undefined,
        colorName: variant.colorName.trim(),
        colorValue: variant.colorValue,
        size: variant.size.trim(),
        imageUrl: variant.imageUrl.trim(),
        stock: Number(variant.stock),
      })),
    };
    if (payload.variants.length) payload.stock = payload.variants.reduce((total, variant) => total + variant.stock, 0);
    setBusy(true);
    try {
      if (product) {
        await api.updateProduct(product.id, payload);
        showToast('Product updated.', 'ok');
      } else {
        await api.createProduct(payload);
        showToast('Product created.', 'ok');
      }
      await onSaved();
    } catch (error) {
      showToast(error.message, 'error');
      setBusy(false);
    }
  }

  function updateVariant(index, key, value) {
    setVariants((current) => current.map((variant, variantIndex) => variantIndex === index ? { ...variant, [key]: value } : variant));
  }
  return (
    <Modal title={product ? 'Edit product' : 'Add product'} onClose={onClose}>
      <form onSubmit={submit}>
        <Field label="Name" name="name" defaultValue={product?.name || ''} required />
        <div className="field"><label>Description</label><textarea name="description" rows="3" defaultValue={product?.description || ''} /></div>
        <Field label="Price" name="price" type="number" step="0.01" min="0.01" defaultValue={product?.price ?? ''} required />
        <Field label="Stock (used when there are no variants)" name="stock" type="number" min="0" defaultValue={product?.stock ?? ''} required />
        <div className="field">
          <label>Category</label>
          <select name="categoryId" defaultValue={product?.category?.id || categories[0]?.id || ''} required>
            {categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}
          </select>
        </div>
        <Field label="Product image URL" name="imageUrl" type="url" defaultValue={product?.imageUrl || ''} />
        <p className="field-hint">Use a public image link. Keep stock above 0 to show Add to cart.</p>
        <div className="field">
          <label>Colour and size variants</label>
          <div className="variant-list">
            {variants.map((variant, index) => (
              <div className="variant-row" key={variant.id || `new-${index}`}>
                <input required maxLength="50" placeholder="Color name" aria-label="Variant color name" value={variant.colorName || ''} onChange={(event) => updateVariant(index, 'colorName', event.target.value)} />
                <input required type="color" aria-label="Swatch color" value={variant.colorValue || '#222222'} onChange={(event) => updateVariant(index, 'colorValue', event.target.value)} />
                <input required maxLength="30" placeholder="Size (e.g. M)" aria-label="Variant size" value={variant.size || ''} onChange={(event) => updateVariant(index, 'size', event.target.value)} />
                <input required type="url" maxLength="1000" placeholder="Public image URL" aria-label="Variant image URL" value={variant.imageUrl || ''} onChange={(event) => updateVariant(index, 'imageUrl', event.target.value)} />
                <input required type="number" min="0" step="1" placeholder="Stock" aria-label="Variant stock" value={variant.stock ?? 0} onChange={(event) => updateVariant(index, 'stock', event.target.value)} />
                <button type="button" className="link-btn variant-remove" onClick={() => setVariants((current) => current.filter((_, variantIndex) => variantIndex !== index))}>Remove</button>
              </div>
            ))}
          </div>
          <button type="button" className="btn btn-outline btn-small" onClick={() => setVariants((current) => [...current, { colorName: '', colorValue: '#222222', size: '', imageUrl: '', stock: 0 }])}>Add variant</button>
          <p className="field-hint">Add one row per colour/size combination with its image and available stock.</p>
        </div>
        <ModalActions onClose={onClose} busy={busy} label="Save product" />
      </form>
    </Modal>
  );
}

function CategoryModal({ category, onClose, onSaved }) {
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload = { name: String(data.get('name')).trim(), description: String(data.get('description') || '').trim() || undefined };
    setBusy(true);
    try {
      if (category) {
        await api.updateCategory(category.id, payload);
        showToast('Category updated.', 'ok');
      } else {
        await api.createCategory(payload);
        showToast('Category created.', 'ok');
      }
      await onSaved();
    } catch (error) {
      showToast(error.message, 'error');
      setBusy(false);
    }
  }
  return (
    <Modal title={category ? 'Edit category' : 'Add category'} onClose={onClose}>
      <form onSubmit={submit}>
        <Field label="Name" name="name" defaultValue={category?.name || ''} required />
        <div className="field"><label>Description (optional)</label><textarea name="description" rows="3" defaultValue={category?.description || ''} /></div>
        <ModalActions onClose={onClose} busy={busy} label="Save category" />
      </form>
    </Modal>
  );
}

function Modal({ title, onClose, children }) {
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="modal-box" role="dialog" aria-modal="true" aria-label={title}>
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}

function ModalActions({ onClose, busy, label }) {
  return (
    <div className="modal-actions">
      <button type="button" className="btn btn-outline" onClick={onClose} disabled={busy}>Cancel</button>
      <button type="submit" className="btn btn-wine" disabled={busy}>{busy ? 'Saving…' : label}</button>
    </div>
  );
}

function Field({ label, name, type = 'text', ...props }) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} {...props} />
    </div>
  );
}

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="pagination">
      <button className="btn btn-outline btn-small" disabled={page <= 0} onClick={() => onChange(page - 1)}>← Prev</button>
      <span>Page {page + 1} of {Math.max(totalPages, 1)}</span>
      <button className="btn btn-outline btn-small" disabled={page + 1 >= totalPages} onClick={() => onChange(page + 1)}>Next →</button>
    </div>
  );
}

function EmptyState({ title, message }) {
  return <div className="empty-state"><div className="title">{title}</div>{message && <p>{message}</p>}</div>;
}
