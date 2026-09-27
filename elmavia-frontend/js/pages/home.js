import { api } from "../api.js";
import {
  showToast,
  navigate,
  escapeHtml,
  formatMoney,
  placeholderThumb,
} from "../helpers.js";
import { isLoggedIn } from "../state.js";
import { refreshCartBadge } from "../layout.js";

const PAGE_SIZE = 12;

const EDITORIAL = {
  hero: "https://images.pexels.com/photos/18584221/pexels-photo-18584221.jpeg?cs=srgb&dl=pexels-jimmy-chen-746816442-18584221.jpg&fm=jpg",

  final:
    "https://images.pexels.com/photos/18584221/pexels-photo-18584221.jpeg?cs=srgb&dl=pexels-jimmy-chen-746816442-18584221.jpg&fm=jpg",
};

let currentPage = 1;
let currentKeyword = "";
let currentCategoryId = "";

export async function renderHome(container, params = new URLSearchParams()) {
  currentPage = Number(params.get("page") || 1);
  currentKeyword = params.get("keyword") || "";
  currentCategoryId = params.get("categoryId") || "";

  injectLuxuryStyles();

  container.innerHTML = `
    <main class="elmavia-brand">

      <!-- =====================================================
           ANNOUNCEMENT
      ====================================================== -->
      <div class="elmavia-announcement">
        <div>ELMAVIA / NEW SEASON</div>
        <div class="announcement-center">FREE SHIPPING ON PREPAID ORDERS</div>
        <div>EST. 2026</div>
      </div>


      <!-- =====================================================
           HERO
      ====================================================== -->
      <section class="elmavia-hero" id="elmavia-top">

        <img
          class="hero-image"
          src="${EDITORIAL.hero}"
          alt="ELMAVIA oversized fashion campaign"
          loading="eager"
        />

        <div class="hero-overlay"></div>

        <div class="hero-grain"></div>

        <header class="elmavia-nav">

          <button
            class="elmavia-logo brand-scroll"
            data-target="elmavia-top"
            aria-label="Go to top"
          >
            ELMAVIA
          </button>

          <nav class="hero-navigation">
            <a href="#collection">COLLECTION</a>
            <a href="#campaign">CAMPAIGN</a>
            <a href="#philosophy">ABOUT</a>
          </nav>

          <div class="hero-actions">
            <button
              class="hero-action"
              data-action="account"
            >
              ACCOUNT
            </button>

            <button
              class="hero-action"
              data-action="bag"
            >
              BAG <span class="elmavia-cart-count">0</span>
            </button>
          </div>

        </header>


        <div class="hero-index">
          <span>01</span>
          <span class="hero-line"></span>
          <span>THE EVERYDAY COLLECTION</span>
        </div>


        <div class="hero-content">

          <p class="hero-kicker">
            ELMAVIA / 01 — THE NEW SILHOUETTE
          </p>

          <h1>
            WEAR
            <span>YOUR</span>
            <em>SPACE.</em>
          </h1>

          <p class="hero-description">
            Oversized essentials designed for presence,
            movement and quiet confidence.
          </p>

          <a
            href="#collection"
            class="elmavia-primary-button"
          >
            <span>EXPLORE COLLECTION</span>
            <span>↗</span>
          </a>

        </div>


        <div class="hero-bottom">

          <div class="hero-scroll">
            <span class="scroll-dot"></span>
            SCROLL TO EXPLORE
          </div>

          <div class="hero-location">
            PUNE / INDIA
          </div>

        </div>

      </section>


      <!-- =====================================================
           BRAND STORY
      ====================================================== -->
      <section class="elmavia-story section-reveal">

        <div class="section-number">
          02
        </div>

        <div class="story-heading">
          <span class="eyebrow">THE ELMAVIA IDEA</span>

          <h2>
            NOT MADE
            <br />
            TO <i>FIT IN.</i>
          </h2>
        </div>

        <div class="story-copy">
          <p class="large-copy">
            ELMAVIA was created around one simple idea:
            clothing should give you space to exist.
          </p>

          <p>
            We build oversized silhouettes, refined essentials
            and everyday pieces with a focus on proportion,
            texture and understated confidence.
          </p>

          <a
            href="#philosophy"
            class="text-link"
          >
            OUR PHILOSOPHY <span>↗</span>
          </a>
        </div>

      </section>


      <!-- =====================================================
           COLLECTION
      ====================================================== -->
      <section
        class="elmavia-collection section-reveal"
        id="collection"
      >

        <div class="collection-top">

          <div>
            <span class="eyebrow">03 / THE COLLECTION</span>

            <h2>
              THE
              <i>NEW EDIT.</i>
            </h2>
          </div>

          <div class="collection-intro">
            <p>
              Essential silhouettes. Relaxed proportions.
              Designed to become part of your everyday uniform.
            </p>

            <span class="collection-count">
              01 — 12
            </span>
          </div>

        </div>


        <!-- Categories -->
        <div
          class="elmavia-category-area"
          id="elmavia-categories"
        ></div>


        <!-- Products -->
        <div
          class="elmavia-products"
          id="elmavia-products"
        >
          <div class="products-loading">
            <span></span>
            LOADING COLLECTION
          </div>
        </div>


        <!-- Pagination -->
        <div
          class="elmavia-pagination"
          id="elmavia-pagination"
        ></div>

      </section>


      <!-- =====================================================
           PHILOSOPHY
      ====================================================== -->
      <section
        class="elmavia-philosophy section-reveal"
        id="philosophy"
      >

        <div class="philosophy-header">

          <div>
            <span class="eyebrow">
              05 / BRAND PHILOSOPHY
            </span>

            <h2>
              THE
              <i>ELMAVIA</i>
              CODE.
            </h2>
          </div>

          <p>
            Four principles behind everything we make.
          </p>

        </div>


        <div class="philosophy-grid">

          <article class="philosophy-item">
            <span>01</span>
            <h3>OVERSIZED</h3>
            <p>
              Freedom in proportion.
              Silhouettes designed to breathe.
            </p>
          </article>

          <article class="philosophy-item">
            <span>02</span>
            <h3>PREMIUM</h3>
            <p>
              Refined materials and details
              without unnecessary noise.
            </p>
          </article>

          <article class="philosophy-item">
            <span>03</span>
            <h3>ESSENTIAL</h3>
            <p>
              Pieces designed to live beyond
              one season or one trend.
            </p>
          </article>

          <article class="philosophy-item">
            <span>04</span>
            <h3>CONFIDENCE</h3>
            <p>
              Quiet on the surface.
              Impossible to ignore.
            </p>
          </article>

        </div>

      </section>


      <!-- =====================================================
           FINAL CAMPAIGN
      ====================================================== -->
      <section class="elmavia-final section-reveal">

        <img
          src="${EDITORIAL.final}"
          alt="ELMAVIA final campaign"
          loading="lazy"
        />

        <div class="final-overlay"></div>

        <div class="final-giant-text">
          ELMAVIA
        </div>

        <div class="final-content">

          <span>
            06 / THIS IS ELMAVIA
          </span>

          <h2>
            WEAR
            <br />
            YOUR
            <i>SPACE.</i>
          </h2>

          <a
            href="#collection"
            class="elmavia-primary-button final-button"
          >
            <span>DISCOVER ELMAVIA</span>
            <span>↗</span>
          </a>

        </div>

      </section>


      <!-- =====================================================
           FOOTER
      ====================================================== -->
      <footer class="elmavia-footer">

        <div class="footer-brand">
          ELMAVIA
        </div>

        <div class="footer-grid">

          <div>
            <span class="footer-label">NAVIGATE</span>
            <a href="#collection">Collection</a>
            <a href="#campaign">Campaign</a>
            <a href="#philosophy">Philosophy</a>
          </div>

          <div>
            <span class="footer-label">ACCOUNT</span>
            <button data-action="account">Login / Account</button>
            <button data-action="bag">Shopping Bag</button>
          </div>

          <div>
            <span class="footer-label">ELMAVIA</span>
            <p>
              Oversized essentials
              for everyday presence.
            </p>
          </div>

        </div>

        <div class="footer-bottom">
          <span>© ${new Date().getFullYear()} ELMAVIA</span>
          <span>MADE FOR YOUR SPACE.</span>
          <button class="brand-scroll" data-target="elmavia-top">
            BACK TO TOP ↑
          </button>
        </div>

      </footer>

    </main>
  `;

  setupBrandInteractions(container);

  const categoryArea = container.querySelector(
    "#elmavia-categories"
  );

  const productArea = container.querySelector(
    "#elmavia-products"
  );

  const paginationArea = container.querySelector(
    "#elmavia-pagination"
  );

  try {
    await renderCategoryChips(categoryArea);

    await loadProducts(
      productArea,
      paginationArea
    );
  } catch (error) {
    console.error("ELMAVIA home loading error:", error);

    productArea.innerHTML = `
      <div class="products-error">
        <span>COLLECTION UNAVAILABLE</span>
        <p>
          We couldn't load the collection right now.
        </p>
      </div>
    `;
  }

  try {
    await refreshCartBadge();
  } catch (error) {
    console.warn("Cart badge refresh failed:", error);
  }

  setupRevealAnimations(container);
}


/* ============================================================
   CATEGORY CHIPS
============================================================ */

async function renderCategoryChips(container) {
  try {
    const categories = await api.getCategories();

    const list = Array.isArray(categories)
      ? categories
      : categories?.content || [];

    if (!list.length) {
      container.innerHTML = "";
      return;
    }

    container.innerHTML = `
      <div class="category-heading">
        <span>FILTER</span>
      </div>

      <div class="category-list">

        <button
          class="category-chip ${
            !currentCategoryId ? "active" : ""
          }"
          data-category=""
        >
          ALL
        </button>

        ${list
          .map(
            (category) => `
              <button
                class="category-chip ${
                  String(category.id) ===
                  String(currentCategoryId)
                    ? "active"
                    : ""
                }"
                data-category="${escapeHtml(
                  String(category.id)
                )}"
              >
                ${escapeHtml(
                  category.name ||
                    category.title ||
                    "CATEGORY"
                )}
              </button>
            `
          )
          .join("")}

      </div>
    `;

    container
      .querySelectorAll(".category-chip")
      .forEach((button) => {
        button.addEventListener("click", async () => {
          currentCategoryId =
            button.dataset.category || "";

          currentPage = 1;

          container
            .querySelectorAll(".category-chip")
            .forEach((item) =>
              item.classList.remove("active")
            );

          button.classList.add("active");

          const productArea =
            document.querySelector(
              "#elmavia-products"
            );

          const paginationArea =
            document.querySelector(
              "#elmavia-pagination"
            );

          await loadProducts(
            productArea,
            paginationArea
          );

          setupRevealAnimations(
            document.querySelector(".elmavia-brand")
          );
        });
      });
  } catch (error) {
    console.error(
      "Category loading failed:",
      error
    );

    container.innerHTML = "";
  }
}


/* ============================================================
   LOAD PRODUCTS
============================================================ */

async function loadProducts(
  productArea,
  paginationArea
) {
  productArea.innerHTML = `
    <div class="products-loading">
      <span></span>
      CURATING COLLECTION
    </div>
  `;

  try {
    const response = await api.getProducts({
      keyword: currentKeyword,
      categoryId: currentCategoryId,
      page: currentPage,
      size: PAGE_SIZE,
      sortBy: "id",
      direction: "asc",
    });

    const products =
      response?.content ||
      response?.products ||
      (Array.isArray(response)
        ? response
        : []);

    const totalPages =
      response?.totalPages ||
      Math.ceil(
        (response?.totalElements ||
          products.length) / PAGE_SIZE
      );

    if (!products.length) {
      productArea.innerHTML = `
        <div class="products-empty">
          <span>NO PIECES FOUND</span>
          <p>
            Try another category or explore the full collection.
          </p>

          <button
            class="empty-button"
            id="show-all-products"
          >
            VIEW ALL
          </button>
        </div>
      `;

      paginationArea.innerHTML = "";

      document
        .querySelector("#show-all-products")
        ?.addEventListener("click", async () => {
          currentCategoryId = "";
          currentKeyword = "";
          currentPage = 1;

          await renderHome(
            document.querySelector(
              ".elmavia-brand"
            ).parentElement
          );
        });

      return;
    }

    productArea.innerHTML = `
      ${products
        .map((product, index) =>
          productCard(product, index)
        )
        .join("")}
    `;

    renderPagination(
      paginationArea,
      totalPages
    );

    bindProductInteractions(productArea);
  } catch (error) {
    console.error(
      "Product loading failed:",
      error
    );

    productArea.innerHTML = `
      <div class="products-error">
        <span>ERROR</span>
        <p>
          Something went wrong while loading the collection.
        </p>
      </div>
    `;

    paginationArea.innerHTML = "";
  }
}


/* ============================================================
   PRODUCT CARD
============================================================ */

function productCard(product, index) {
  const id = product.id;

  const name =
    product.name ||
    product.title ||
    "ELMAVIA ESSENTIAL";

  const price =
    product.price ??
    product.salePrice ??
    product.amount ??
    0;

  const image =
    product.imageUrl ||
    product.image ||
    product.thumbnail ||
    product.imagePath ||
    placeholderThumb();

  const badge =
    product.badge ||
    product.label ||
    (index === 0 ? "FEATURED" : "");

  const featured =
    index === 0
      ? "product-card-featured"
      : "";

  return `
    <article
      class="elmavia-product-card ${featured}"
      data-product-id="${escapeHtml(
        String(id)
      )}"
    >

      <button
        class="product-image-button product-open"
        data-product-id="${escapeHtml(
          String(id)
        )}"
        aria-label="View ${escapeHtml(name)}"
      >

        <div class="product-image-wrap">

          <img
            src="${escapeHtml(image)}"
            alt="${escapeHtml(name)}"
            loading="lazy"
            onerror="this.src='${placeholderThumb()}'"
          />

          <div class="product-image-overlay"></div>

          ${
            badge
              ? `
                <span class="product-badge">
                  ${escapeHtml(badge)}
                </span>
              `
              : ""
          }

          <span class="product-number">
            ${String(index + 1).padStart(2, "0")}
          </span>

          <span class="product-view">
            VIEW
            <span>↗</span>
          </span>

        </div>

      </button>


      <div class="product-information">

        <div class="product-meta">
          <span>ELMAVIA</span>
          <span>ESSENTIAL</span>
        </div>

        <div class="product-title-row">

          <button
            class="product-name product-open"
            data-product-id="${escapeHtml(
              String(id)
            )}"
          >
            ${escapeHtml(name)}
          </button>

          <span class="product-price">
            ${formatMoney(price)}
          </span>

        </div>


        <button
          class="product-add"
          data-product-id="${escapeHtml(
            String(id)
          )}"
        >
          <span>ADD TO BAG</span>
          <strong>+</strong>
        </button>

      </div>

    </article>
  `;
}


/* ============================================================
   PRODUCT INTERACTIONS
============================================================ */

function bindProductInteractions(container) {
  container
    .querySelectorAll(".product-open")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.dataset.productId;

        if (!id) return;

        navigate(`/product/${id}`);
      });
    });

  container
    .querySelectorAll(".product-add")
    .forEach((button) => {
      button.addEventListener("click", async (event) => {
        event.stopPropagation();

        await quickAddToCart(
          button.dataset.productId,
          button
        );
      });
    });
}


/* ============================================================
   ADD TO CART
============================================================ */

async function quickAddToCart(
  productId,
  button
) {
  if (!isLoggedIn()) {
    showToast(
      "Please login to add products to your bag."
    );

    navigate("/login");
    return;
  }

  if (!productId) return;

  const originalHTML = button.innerHTML;

  button.disabled = true;
  button.classList.add("adding");

  button.innerHTML = `
    <span>ADDING...</span>
    <strong>...</strong>
  `;

  try {
    await api.addCartItem({
      productId: Number(productId),
      quantity: 1,
    });

    await refreshCartBadge();

    button.classList.remove("adding");
    button.classList.add("added");

    button.innerHTML = `
      <span>ADDED TO BAG</span>
      <strong>✓</strong>
    `;

    showToast("Added to bag.");

    setTimeout(() => {
      button.classList.remove("added");
      button.disabled = false;
      button.innerHTML = originalHTML;
    }, 1800);
  } catch (error) {
    console.error("Add to cart failed:", error);

    button.disabled = false;
    button.classList.remove("adding");

    button.innerHTML = originalHTML;

    showToast(
      error?.message ||
        "Unable to add product to bag."
    );
  }
}


/* ============================================================
   PAGINATION
============================================================ */

function renderPagination(
  container,
  totalPages
) {
  if (!totalPages || totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  const pages = [];

  for (
    let page = 1;
    page <= totalPages;
    page++
  ) {
    if (
      page === 1 ||
      page === totalPages ||
      Math.abs(page - currentPage) <= 1
    ) {
      pages.push(page);
    }
  }

  const uniquePages = [...new Set(pages)];

  container.innerHTML = `
    <div class="pagination-inner">

      <button
        class="pagination-arrow"
        data-page="${currentPage - 1}"
        ${currentPage <= 1 ? "disabled" : ""}
      >
        ←
      </button>

      <div class="pagination-pages">

        ${uniquePages
          .map((page, index) => {
            const previous =
              uniquePages[index - 1];

            const dots =
              previous &&
              page - previous > 1
                ? `<span class="pagination-dots">...</span>`
                : "";

            return `
              ${dots}

              <button
                class="pagination-number ${
                  page === currentPage
                    ? "active"
                    : ""
                }"
                data-page="${page}"
              >
                ${String(page).padStart(2, "0")}
              </button>
            `;
          })
          .join("")}

      </div>

      <button
        class="pagination-arrow"
        data-page="${currentPage + 1}"
        ${currentPage >= totalPages ? "disabled" : ""}
      >
        →
      </button>

    </div>
  `;

  container
    .querySelectorAll("[data-page]")
    .forEach((button) => {
      button.addEventListener("click", async () => {
        const page = Number(
          button.dataset.page
        );

        if (!page || page < 1) return;

        currentPage = page;

        const productArea =
          document.querySelector(
            "#elmavia-products"
          );

        const paginationArea =
          document.querySelector(
            "#elmavia-pagination"
          );

        await loadProducts(
          productArea,
          paginationArea
        );

        document
          .querySelector("#collection")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });

        setupRevealAnimations(
          document.querySelector(".elmavia-brand")
        );
      });
    });
}


/* ============================================================
   BRAND INTERACTIONS
============================================================ */

function setupBrandInteractions(container) {
  container
    .querySelectorAll(
      '.brand-scroll, a[href^="#"]'
    )
    .forEach((element) => {
      element.addEventListener("click", (event) => {
        const targetId =
          element.dataset.target ||
          element.getAttribute("href")?.replace(
            "#",
            ""
          );

        if (!targetId) return;

        const target =
          document.getElementById(targetId);

        if (!target) return;

        event.preventDefault();

        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    });


  container
    .querySelectorAll("[data-action]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const action =
          button.dataset.action;

        if (action === "account") {
          navigate(
            isLoggedIn()
              ? "/profile"
              : "/login"
          );
        }

        if (action === "bag") {
          navigate("/cart");
        }
      });
    });
}


/* ============================================================
   REVEAL ANIMATIONS
============================================================ */

function setupRevealAnimations(container) {
  if (!container) return;

  const elements =
    container.querySelectorAll(
      ".section-reveal"
    );

  if (!("IntersectionObserver" in window)) {
    elements.forEach((element) =>
      element.classList.add("is-visible")
    );

    return;
  }

  const observer =
    new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(
              "is-visible"
            );

            observer.unobserve(
              entry.target
            );
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -60px 0px",
      }
    );

  elements.forEach((element) =>
    observer.observe(element)
  );
}


/* ============================================================
   LUXURY STYLES
============================================================ */

function injectLuxuryStyles() {
  if (
    document.getElementById(
      "elmavia-luxury-styles"
    )
  ) {
    return;
  }

  const style =
    document.createElement("style");

  style.id = "elmavia-luxury-styles";

  style.textContent = `

    /* ========================================================
       VARIABLES
    ======================================================== */

    .elmavia-brand {
      --black: #090909;
      --black-soft: #111111;
      --cream: #f1eee7;
      --cream-dark: #d8d2c7;
      --white: #ffffff;
      --muted: #8b8984;
      --line: rgba(0,0,0,.13);
      --dark-line: rgba(255,255,255,.18);

      background: var(--cream);
      color: var(--black);

      font-family:
        Inter,
        Helvetica,
        Arial,
        sans-serif;

      overflow: hidden;
      width: 100%;
    }


    .elmavia-brand *,
    .elmavia-brand *::before,
    .elmavia-brand *::after {
      box-sizing: border-box;
    }


    .elmavia-brand button,
    .elmavia-brand a {
      font: inherit;
    }


    /* ========================================================
       ANNOUNCEMENT
    ======================================================== */

    .elmavia-announcement {
      height: 32px;

      display: grid;
      grid-template-columns: 1fr 1fr 1fr;

      align-items: center;

      padding: 0 24px;

      background: var(--black);
      color: #fff;

      font-size: 9px;
      font-weight: 600;

      letter-spacing: .18em;
      text-transform: uppercase;

      border-bottom: 1px solid
        rgba(255,255,255,.1);
    }


    .elmavia-announcement > div:nth-child(2) {
      text-align: center;
    }


    .elmavia-announcement > div:last-child {
      text-align: right;
    }


    /* ========================================================
       HERO
    ======================================================== */

    .elmavia-hero {
      position: relative;

      min-height: min(
        900px,
        calc(100vh - 32px)
      );

      height: 900px;

      background: #111;

      color: white;

      overflow: hidden;
    }


    .hero-image {
      position: absolute;

      inset: 0;

      width: 100%;
      height: 100%;

      object-fit: cover;

      object-position: center 25%;

      transform: scale(1.015);

      filter:
        contrast(1.05)
        saturate(.78);
    }


    .hero-overlay {
      position: absolute;

      inset: 0;

      background:
        linear-gradient(
          90deg,
          rgba(0,0,0,.78) 0%,
          rgba(0,0,0,.34) 45%,
          rgba(0,0,0,.15) 100%
        ),
        linear-gradient(
          0deg,
          rgba(0,0,0,.55),
          transparent 40%
        );
    }


    .hero-grain {
      position: absolute;

      inset: 0;

      opacity: .08;

      pointer-events: none;

      background-image:
        url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.5'/%3E%3C/svg%3E");
    }


    /* ========================================================
       NAV
    ======================================================== */

    .elmavia-nav {
      position: absolute;

      top: 0;
      left: 0;
      right: 0;

      height: 92px;

      padding: 0 42px;

      display: grid;
      grid-template-columns: 1fr auto 1fr;

      align-items: center;

      z-index: 5;

      border-bottom: 1px solid
        rgba(255,255,255,.14);
    }


    .elmavia-logo {
      justify-self: start;

      border: 0;
      background: transparent;

      color: white;

      padding: 0;

      cursor: pointer;

      font-family:
        "Times New Roman",
        Georgia,
        serif;

      font-size: 28px;

      letter-spacing: -.05em;
      font-weight: 700;
    }


    .hero-navigation {
      display: flex;

      align-items: center;

      gap: 36px;
    }


    .hero-navigation a,
    .hero-action {
      color: rgba(255,255,255,.85);

      text-decoration: none;

      border: 0;
      background: transparent;

      cursor: pointer;

      font-size: 9px;
      font-weight: 600;

      letter-spacing: .18em;

      transition:
        color .25s ease,
        opacity .25s ease;
    }


    .hero-navigation a:hover,
    .hero-action:hover {
      color: white;
    }


    .hero-actions {
      justify-self: end;

      display: flex;

      gap: 25px;
    }


    .elmavia-cart-count {
      display: inline-flex;

      justify-content: center;
      align-items: center;

      min-width: 18px;
      height: 18px;

      margin-left: 4px;

      border: 1px solid
        rgba(255,255,255,.4);

      border-radius: 50%;

      font-size: 8px;
    }


    /* ========================================================
       HERO CONTENT
    ======================================================== */

    .hero-index {
      position: absolute;

      top: 135px;
      right: 42px;

      display: flex;

      align-items: center;

      gap: 12px;

      color: rgba(255,255,255,.7);

      font-size: 9px;

      letter-spacing: .18em;

      writing-mode: vertical-rl;

      text-transform: uppercase;
    }


    .hero-line {
      width: 1px;
      height: 65px;

      background:
        rgba(255,255,255,.45);
    }


    .hero-content {
      position: absolute;

      left: 7vw;
      bottom: 14vh;

      max-width: 850px;

      z-index: 3;
    }


    .hero-kicker {
      margin: 0 0 25px;

      color: rgba(255,255,255,.68);

      font-size: 9px;

      font-weight: 600;

      letter-spacing: .24em;

      text-transform: uppercase;
    }


    .hero-content h1 {
      margin: 0;

      font-family:
        "Times New Roman",
        Georgia,
        serif;

      font-size:
        clamp(78px, 12vw, 190px);

      font-weight: 400;

      line-height: .75;

      letter-spacing: -.075em;

      text-transform: uppercase;
    }


    .hero-content h1 span {
      display: block;

      margin-left: 8vw;
    }


    .hero-content h1 em {
      display: block;

      margin-left: 3vw;

      font-weight: 400;

      color: transparent;

      -webkit-text-stroke:
        1px rgba(255,255,255,.82);
    }


    .hero-description {
      max-width: 360px;

      margin: 38px 0 30px 9vw;

      color: rgba(255,255,255,.76);

      font-size: 13px;

      line-height: 1.7;

      letter-spacing: .03em;
    }


    .elmavia-primary-button {
      display: inline-flex;

      align-items: center;
      justify-content: space-between;

      gap: 50px;

      margin-left: 9vw;

      min-width: 215px;

      padding: 15px 18px;

      color: var(--black);

      background: var(--cream);

      text-decoration: none;

      font-size: 9px;

      font-weight: 700;

      letter-spacing: .16em;

      transition:
        background .3s ease,
        color .3s ease,
        transform .3s ease;
    }


    .elmavia-primary-button:hover {
      background: white;

      transform:
        translateY(-2px);
    }


    .hero-bottom {
      position: absolute;

      left: 42px;
      right: 42px;
      bottom: 30px;

      display: flex;

      justify-content: space-between;

      color: rgba(255,255,255,.62);

      font-size: 8px;

      font-weight: 600;

      letter-spacing: .2em;
    }


    .hero-scroll {
      display: flex;
      align-items: center;
      gap: 10px;
    }


    .scroll-dot {
      width: 6px;
      height: 6px;

      border-radius: 50%;

      background: white;

      animation:
        elmaviaPulse 1.7s infinite;
    }


    @keyframes elmaviaPulse {
      0%, 100% {
        opacity: .25;
        transform: scale(.8);
      }

      50% {
        opacity: 1;
        transform: scale(1);
      }
    }


    /* ========================================================
       STORY
    ======================================================== */

    .elmavia-story {
      display: grid;

      grid-template-columns:
        80px
        1fr
        1fr;

      gap: 7vw;

      padding:
        160px 7vw
        145px;

      background: var(--cream);
    }


    .section-number {
      font-size: 9px;

      letter-spacing: .18em;

      color: #777;

      padding-top: 8px;
    }


    .eyebrow {
      display: block;

      margin-bottom: 28px;

      color: #777;

      font-size: 9px;

      font-weight: 700;

      letter-spacing: .2em;

      text-transform: uppercase;
    }


    .story-heading h2,
    .collection-top h2,
    .philosophy-header h2 {
      margin: 0;

      font-family:
        "Times New Roman",
        Georgia,
        serif;

      font-size:
        clamp(55px, 7vw, 105px);

      font-weight: 400;

      line-height: .84;

      letter-spacing: -.065em;

      text-transform: uppercase;
    }


    .story-heading h2 i,
    .collection-top h2 i,
    .philosophy-header h2 i {
      font-style: italic;

      font-weight: 400;
    }


    .story-copy {
      align-self: end;

      max-width: 410px;

      padding-bottom: 5px;
    }


    .story-copy p {
      color: #5d5a54;

      font-size: 13px;

      line-height: 1.85;

      margin: 0 0 22px;
    }


    .story-copy .large-copy {
      color: var(--black);

      font-family:
        "Times New Roman",
        Georgia,
        serif;

      font-size: 25px;

      line-height: 1.25;
    }


    .text-link {
      display: inline-flex;

      gap: 16px;

      margin-top: 20px;

      color: var(--black);

      text-decoration: none;

      font-size: 9px;

      font-weight: 700;

      letter-spacing: .17em;

      border-bottom: 1px solid
        var(--black);

      padding-bottom: 8px;
    }


    /* ========================================================
       STORY IMAGE
    ======================================================== */

    .elmavia-story-image {
      padding:
        0 7vw
        150px;

      background: var(--cream);
    }


    .story-image-wrap {
      position: relative;

      height: min(760px, 70vw);

      overflow: hidden;

      background: #aaa;
    }


    .story-image-wrap img {
      width: 100%;
      height: 100%;

      object-fit: cover;

      filter:
        grayscale(.08)
        contrast(1.05);

      transition:
        transform 1.2s
        cubic-bezier(.2,.7,.2,1);
    }


    .story-image-wrap:hover img {
      transform: scale(1.025);
    }


    .story-image-overlay {
      position: absolute;

      inset: 0;

      background:
        linear-gradient(
          180deg,
          transparent 45%,
          rgba(0,0,0,.55)
        );
    }


    .story-image-copy {
      position: absolute;

      left: 38px;
      bottom: 35px;

      display: flex;

      flex-direction: column;

      gap: 13px;

      color: white;
    }


    .story-image-copy span {
      font-size: 8px;

      letter-spacing: .22em;
    }


    .story-image-copy strong {
      font-family:
        "Times New Roman",
        Georgia,
        serif;

      font-size: clamp(28px, 4vw, 58px);

      line-height: .9;

      font-weight: 400;

      letter-spacing: -.04em;
    }


    /* ========================================================
       STATEMENT
    ======================================================== */

    .elmavia-statement {
      position: relative;

      padding:
        180px 7vw;

      background: var(--black);

      color: white;

      text-align: center;
    }


    .statement-small {
      margin-bottom: 45px;

      color: #888;

      font-size: 9px;

      font-weight: 700;

      letter-spacing: .22em;
    }


    .elmavia-statement h2 {
      margin: 0;

      font-family:
        "Times New Roman",
        Georgia,
        serif;

      font-size:
        clamp(55px, 9vw, 145px);

      font-weight: 400;

      line-height: .83;

      letter-spacing: -.07em;
    }


    .elmavia-statement h2 span {
      color: transparent;

      -webkit-text-stroke:
        1px rgba(255,255,255,.75);
    }


    .statement-mark {
      position: absolute;

      right: 7vw;
      bottom: 45px;

      color: #555;

      font-size: 30px;
    }


    /* ========================================================
       COLLECTION
    ======================================================== */

    .elmavia-collection {
      padding:
        155px 7vw
        130px;

      background: var(--cream);
    }


    .collection-top {
      display: grid;

      grid-template-columns:
        1.2fr .8fr;

      gap: 80px;

      margin-bottom: 70px;
    }


    .collection-intro {
      align-self: end;

      max-width: 360px;
    }


    .collection-intro p {
      margin: 0 0 30px;

      color: #65625d;

      font-size: 13px;

      line-height: 1.8;
    }


    .collection-count {
      color: #777;

      font-size: 9px;

      font-weight: 700;

      letter-spacing: .18em;
    }


    /* ========================================================
       CATEGORIES
    ======================================================== */

    .elmavia-category-area {
      display: flex;

      align-items: center;

      gap: 25px;

      margin-bottom: 40px;

      padding-bottom: 18px;

      border-bottom: 1px solid
        var(--line);
    }


    .category-heading {
      color: #888;

      font-size: 8px;

      font-weight: 700;

      letter-spacing: .18em;
    }


    .category-list {
      display: flex;

      flex-wrap: wrap;

      gap: 8px;
    }


    .category-chip {
      border: 1px solid
        rgba(0,0,0,.18);

      background: transparent;

      color: #555;

      padding: 9px 15px;

      cursor: pointer;

      font-size: 8px;

      font-weight: 700;

      letter-spacing: .15em;

      transition:
        background .25s ease,
        color .25s ease,
        border .25s ease;
    }


    .category-chip:hover,
    .category-chip.active {
      background: var(--black);

      color: white;

      border-color: var(--black);
    }


    /* ========================================================
       PRODUCT GRID
    ======================================================== */

    .elmavia-products {
      display: grid;

      grid-template-columns:
        repeat(4, minmax(0, 1fr));

      gap:
        45px 18px;
    }


    .elmavia-product-card {
      min-width: 0;
    }


    .product-card-featured {
      grid-column: span 2;
      grid-row: span 2;
    }


    .product-image-button {
      display: block;

      width: 100%;

      padding: 0;

      border: 0;

      background: transparent;

      cursor: pointer;

      text-align: left;
    }


    .product-image-wrap {
      position: relative;

      width: 100%;

      aspect-ratio: 4 / 5;

      overflow: hidden;

      background: #dedbd4;
    }


    .product-card-featured
      .product-image-wrap {
      aspect-ratio: 4 / 4.8;
    }


    .product-image-wrap img {
      width: 100%;
      height: 100%;

      object-fit: cover;

      display: block;

      transition:
        transform .8s
        cubic-bezier(.2,.7,.2,1);
    }


    .elmavia-product-card:hover
      .product-image-wrap img {
      transform: scale(1.035);
    }


    .product-image-overlay {
      position: absolute;

      inset: 0;

      background:
        linear-gradient(
          180deg,
          rgba(0,0,0,.02),
          rgba(0,0,0,.1)
        );

      pointer-events: none;
    }


    .product-badge {
      position: absolute;

      top: 15px;
      left: 15px;

      padding: 7px 9px;

      background: var(--black);

      color: white;

      font-size: 7px;

      font-weight: 700;

      letter-spacing: .15em;
    }


    .product-number {
      position: absolute;

      top: 16px;
      right: 16px;

      color: white;

      font-size: 9px;

      font-weight: 700;

      letter-spacing: .1em;

      text-shadow:
        0 1px 6px rgba(0,0,0,.4);
    }


    .product-view {
      position: absolute;

      right: 15px;
      bottom: 15px;

      display: flex;

      align-items: center;

      gap: 10px;

      padding: 10px 12px;

      background: rgba(255,255,255,.9);

      color: var(--black);

      font-size: 8px;

      font-weight: 700;

      letter-spacing: .12em;

      opacity: 0;

      transform:
        translateY(8px);

      transition:
        opacity .3s ease,
        transform .3s ease;
    }


    .elmavia-product-card:hover
      .product-view {
      opacity: 1;

      transform:
        translateY(0);
    }


    .product-information {
      padding-top: 15px;
    }


    .product-meta {
      display: flex;

      justify-content: space-between;

      margin-bottom: 9px;

      color: #888;

      font-size: 7px;

      font-weight: 700;

      letter-spacing: .15em;
    }


    .product-title-row {
      display: flex;

      align-items: flex-start;

      justify-content: space-between;

      gap: 12px;
    }


    .product-name {
      padding: 0;

      border: 0;

      background: transparent;

      color: var(--black);

      cursor: pointer;

      font-family:
        "Times New Roman",
        Georgia,
        serif;

      font-size: 17px;

      line-height: 1.1;

      text-align: left;

      transition: opacity .2s ease;
    }


    .product-name:hover {
      opacity: .55;
    }


    .product-price {
      white-space: nowrap;

      color: #333;

      font-size: 11px;

      font-weight: 600;
    }


    .product-add {
      display: flex;

      align-items: center;

      justify-content: space-between;

      width: 100%;

      margin-top: 16px;

      padding: 11px 0;

      border: 0;

      border-top: 1px solid
        rgba(0,0,0,.18);

      border-bottom: 1px solid
        rgba(0,0,0,.18);

      background: transparent;

      color: var(--black);

      cursor: pointer;

      font-size: 8px;

      font-weight: 700;

      letter-spacing: .16em;

      transition:
        background .25s ease,
        color .25s ease;
    }


    .product-add strong {
      font-size: 16px;

      font-weight: 400;

      line-height: 1;
    }


    .product-add:hover,
    .product-add.added {
      background: var(--black);

      color: white;

      padding-left: 10px;
      padding-right: 10px;
    }


    .product-add.adding {
      opacity: .55;

      cursor: wait;
    }


    /* ========================================================
       EMPTY / LOADING
    ======================================================== */

    .products-loading,
    .products-empty,
    .products-error {
      grid-column: 1 / -1;

      min-height: 280px;

      display: flex;

      flex-direction: column;

      justify-content: center;
      align-items: center;

      text-align: center;

      color: #777;

      border-top: 1px solid
        var(--line);
    }


    .products-loading span {
      display: block;

      width: 28px;
      height: 28px;

      margin-bottom: 18px;

      border: 1px solid #aaa;

      border-top-color: var(--black);

      border-radius: 50%;

      animation:
        elmaviaSpin .8s linear infinite;
    }


    @keyframes elmaviaSpin {
      to {
        transform: rotate(360deg);
      }
    }


    .products-loading,
    .products-empty > span,
    .products-error > span {
      font-size: 8px;

      font-weight: 700;

      letter-spacing: .2em;
    }


    .products-empty p,
    .products-error p {
      max-width: 300px;

      font-size: 12px;

      line-height: 1.6;
    }


    .empty-button {
      margin-top: 10px;

      padding: 12px 18px;

      background: var(--black);

      color: white;

      border: 0;

      cursor: pointer;

      font-size: 8px;

      font-weight: 700;

      letter-spacing: .15em;
    }


    /* ========================================================
       PAGINATION
    ======================================================== */

    .elmavia-pagination {
      margin-top: 75px;
    }


    .pagination-inner {
      display: flex;

      align-items: center;

      justify-content: center;

      gap: 22px;
    }


    .pagination-pages {
      display: flex;

      align-items: center;

      gap: 7px;
    }


    .pagination-arrow,
    .pagination-number {
      width: 34px;
      height: 34px;

      border: 1px solid
        rgba(0,0,0,.18);

      background: transparent;

      color: var(--black);

      cursor: pointer;

      font-size: 9px;
    }


    .pagination-number.active {
      background: var(--black);

      color: white;

      border-color: var(--black);
    }


    .pagination-arrow:disabled {
      opacity: .3;

      cursor: not-allowed;
    }


    .pagination-dots {
      color: #999;

      font-size: 9px;
    }


    /* ========================================================
       CAMPAIGN
    ======================================================== */

    .elmavia-campaign {
      position: relative;

      height: min(900px, 85vw);

      min-height: 650px;

      overflow: hidden;

      background: #111;

      color: white;
    }


    .elmavia-campaign > img {
      width: 100%;
      height: 100%;

      object-fit: cover;

      filter:
        grayscale(.1)
        contrast(1.1);

      transition:
        transform 1.4s
        cubic-bezier(.2,.7,.2,1);
    }


    .elmavia-campaign:hover > img {
      transform: scale(1.025);
    }


    .campaign-overlay {
      position: absolute;

      inset: 0;

      background:
        linear-gradient(
          90deg,
          rgba(0,0,0,.72),
          rgba(0,0,0,.15)
        ),
        linear-gradient(
          0deg,
          rgba(0,0,0,.5),
          transparent 55%
        );
    }


    .campaign-top {
      position: absolute;

      top: 35px;
      left: 42px;
      right: 42px;

      display: flex;

      justify-content: space-between;

      color: rgba(255,255,255,.7);

      font-size: 8px;

      font-weight: 700;

      letter-spacing: .2em;
    }


    .campaign-content {
      position: absolute;

      left: 9vw;
      bottom: 13%;

      max-width: 700px;
    }


    .eyebrow-light {
      display: block;

      margin-bottom: 28px;

      color: rgba(255,255,255,.65);

      font-size: 9px;

      font-weight: 700;

      letter-spacing: .2em;
    }


    .campaign-content h2 {
      margin: 0;

      font-family:
        "Times New Roman",
        Georgia,
        serif;

      font-size:
        clamp(75px, 11vw, 170px);

      line-height: .76;

      font-weight: 400;

      letter-spacing: -.075em;
    }


    .campaign-content h2 i {
      color: transparent;

      -webkit-text-stroke:
        1px white;

      font-style: italic;
    }


    .campaign-content p {
      margin: 35px 0 25px;

      color: rgba(255,255,255,.7);

      font-size: 12px;

      line-height: 1.7;
    }


    .campaign-button {
      display: inline-flex;

      gap: 35px;

      padding-bottom: 9px;

      color: white;

      border-bottom: 1px solid
        rgba(255,255,255,.7);

      text-decoration: none;

      font-size: 8px;

      font-weight: 700;

      letter-spacing: .17em;
    }


    .campaign-bottom {
      position: absolute;

      right: 42px;
      bottom: 32px;

      color: rgba(255,255,255,.55);

      font-size: 8px;

      letter-spacing: .2em;
    }


    /* ========================================================
       PHILOSOPHY
    ======================================================== */

    .elmavia-philosophy {
      padding:
        155px 7vw;

      background: var(--black);

      color: white;
    }


    .philosophy-header {
      display: flex;

      justify-content: space-between;

      align-items: flex-end;

      gap: 60px;

      margin-bottom: 100px;
    }


    .philosophy-header .eyebrow {
      color: #777;
    }


    .philosophy-header p {
      max-width: 250px;

      margin: 0;

      color: #888;

      font-size: 12px;

      line-height: 1.7;
    }


    .philosophy-grid {
      display: grid;

      grid-template-columns:
        repeat(4, 1fr);

      border-top: 1px solid
        var(--dark-line);
    }


    .philosophy-item {
      min-height: 300px;

      padding:
        25px 22px 20px 0;

      border-right: 1px solid
        var(--dark-line);
    }


    .philosophy-item:not(:first-child) {
      padding-left: 22px;
    }


    .philosophy-item:last-child {
      border-right: 0;
    }


    .philosophy-item > span {
      color: #666;

      font-size: 9px;

      letter-spacing: .15em;
    }


    .philosophy-item h3 {
      margin:
        95px 0 20px;

      font-family:
        "Times New Roman",
        Georgia,
        serif;

      font-size:
        clamp(30px, 3vw, 48px);

      line-height: .9;

      font-weight: 400;

      letter-spacing: -.05em;
    }


    .philosophy-item p {
      max-width: 200px;

      margin: 0;

      color: #888;

      font-size: 11px;

      line-height: 1.7;
    }


    /* ========================================================
       FINAL
    ======================================================== */

    .elmavia-final {
      position: relative;

      height: min(900px, 85vw);

      min-height: 650px;

      overflow: hidden;

      background: #111;

      color: white;
    }


    .elmavia-final > img {
      width: 100%;
      height: 100%;

      object-fit: cover;

      filter:
        brightness(.72)
        contrast(1.08)
        saturate(.75);
    }


    .final-overlay {
      position: absolute;

      inset: 0;

      background:
        linear-gradient(
          180deg,
          rgba(0,0,0,.2),
          rgba(0,0,0,.65)
        );
    }


    .final-giant-text {
      position: absolute;

      top: 50%;
      left: 50%;

      transform:
        translate(-50%, -50%);

      width: 100%;

      text-align: center;

      white-space: nowrap;

      font-family:
        "Times New Roman",
        Georgia,
        serif;

      font-size:
        clamp(90px, 17vw, 280px);

      line-height: .8;

      letter-spacing: -.09em;

      color: transparent;

      -webkit-text-stroke:
        1px rgba(255,255,255,.75);

      pointer-events: none;
    }


    .final-content {
      position: absolute;

      left: 7vw;
      bottom: 9%;

      z-index: 2;
    }


    .final-content > span {
      display: block;

      margin-bottom: 22px;

      color: rgba(255,255,255,.65);

      font-size: 8px;

      font-weight: 700;

      letter-spacing: .2em;
    }


    .final-content h2 {
      margin: 0 0 35px;

      font-family:
        "Times New Roman",
        Georgia,
        serif;

      font-size:
        clamp(60px, 8vw, 125px);

      font-weight: 400;

      line-height: .77;

      letter-spacing: -.075em;
    }


    .final-content h2 i {
      color: transparent;

      -webkit-text-stroke:
        1px white;

      font-style: italic;
    }


    .final-button {
      margin-left: 0;
    }


    /* ========================================================
       FOOTER
    ======================================================== */

    .elmavia-footer {
      padding:
        90px 7vw 35px;

      background: #070707;

      color: white;
    }


    .footer-brand {
      padding-bottom: 70px;

      border-bottom: 1px solid
        rgba(255,255,255,.15);

      font-family:
        "Times New Roman",
        Georgia,
        serif;

      font-size:
        clamp(70px, 13vw, 190px);

      line-height: .7;

      letter-spacing: -.08em;
    }


    .footer-grid {
      display: grid;

      grid-template-columns:
        1fr 1fr 1fr;

      gap: 60px;

      padding:
        60px 0 80px;
    }


    .footer-grid > div {
      display: flex;

      flex-direction: column;

      align-items: flex-start;

      gap: 12px;
    }


    .footer-label {
      margin-bottom: 12px;

      color: #666;

      font-size: 8px;

      font-weight: 700;

      letter-spacing: .18em;
    }


    .footer-grid a,
    .footer-grid button {
      padding: 0;

      border: 0;

      background: transparent;

      color: #ccc;

      text-decoration: none;

      cursor: pointer;

      font-size: 11px;

      transition: color .2s ease;
    }


    .footer-grid a:hover,
    .footer-grid button:hover {
      color: white;
    }


    .footer-grid p {
      max-width: 220px;

      margin: 0;

      color: #777;

      font-size: 11px;

      line-height: 1.7;
    }


    .footer-bottom {
      display: flex;

      justify-content: space-between;

      padding-top: 20px;

      border-top: 1px solid
        rgba(255,255,255,.15);

      color: #666;

      font-size: 8px;

      font-weight: 700;

      letter-spacing: .16em;
    }


    .footer-bottom button {
      padding: 0;

      border: 0;

      background: transparent;

      color: #777;

      cursor: pointer;

      font-size: 8px;

      letter-spacing: .16em;
    }


    /* ========================================================
       REVEAL
    ======================================================== */

    .section-reveal {
      opacity: 0;

      transform:
        translateY(35px);

      transition:
        opacity 1s
          cubic-bezier(.2,.7,.2,1),
        transform 1s
          cubic-bezier(.2,.7,.2,1);
    }


    .section-reveal.is-visible {
      opacity: 1;

      transform:
        translateY(0);
    }


    /* ========================================================
       RESPONSIVE
    ======================================================== */

    @media (max-width: 1100px) {

      .elmavia-products {
        grid-template-columns:
          repeat(3, minmax(0, 1fr));
      }


      .product-card-featured {
        grid-column: span 2;
      }


      .hero-navigation {
        gap: 20px;
      }


      .elmavia-story {
        gap: 40px;
      }

    }


    @media (max-width: 800px) {

      .elmavia-announcement {
        grid-template-columns: 1fr;

        height: 30px;

        text-align: center;
      }


      .elmavia-announcement > div:first-child,
      .elmavia-announcement > div:last-child {
        display: none;
      }


      .elmavia-hero {
        height: 760px;

        min-height: 760px;
      }


      .elmavia-nav {
        height: 72px;

        padding:
          0 20px;
      }


      .elmavia-logo {
        font-size: 22px;
      }


      .hero-navigation {
        display: none;
      }


      .hero-actions {
        gap: 12px;
      }


      .hero-action {
        font-size: 8px;
      }


      .hero-index {
        display: none;
      }


      .hero-content {
        left: 25px;
        right: 25px;

        bottom: 110px;
      }


      .hero-content h1 {
        font-size:
          clamp(65px, 18vw, 120px);
      }


      .hero-content h1 span {
        margin-left: 10vw;
      }


      .hero-description,
      .elmavia-primary-button {
        margin-left: 10vw;
      }


      .hero-bottom {
        left: 20px;
        right: 20px;
      }


      .elmavia-story {
        grid-template-columns: 1fr;

        padding:
          100px 25px;

        gap: 50px;
      }


      .section-number {
        display: none;
      }


      .elmavia-story-image {
        padding:
          0 25px 100px;
      }


      .story-image-wrap {
        height: 125vw;

        max-height: 680px;
      }


      .elmavia-statement {
        padding:
          110px 25px;
      }


      .elmavia-collection {
        padding:
          100px 25px;
      }


      .collection-top {
        grid-template-columns: 1fr;

        gap: 40px;
      }


      .elmavia-category-area {
        display: block;

        overflow-x: auto;

        white-space: nowrap;

        padding-bottom: 15px;
      }


      .category-heading {
        margin-bottom: 12px;
      }


      .category-list {
        flex-wrap: nowrap;

        width: max-content;
      }


      .elmavia-products {
        grid-template-columns:
          repeat(2, minmax(0, 1fr));

        gap:
          35px 12px;
      }


      .product-card-featured {
        grid-column: span 2;
      }


      .product-view {
        display: none;
      }


      .product-name {
        font-size: 15px;
      }


      .elmavia-campaign {
        height: 720px;

        min-height: 720px;
      }


      .campaign-top {
        left: 20px;
        right: 20px;
      }


      .campaign-content {
        left: 25px;
        bottom: 11%;
      }


      .campaign-content h2 {
        font-size:
          clamp(70px, 18vw, 120px);
      }


      .campaign-bottom {
        right: 20px;
      }


      .elmavia-philosophy {
        padding:
          100px 25px;
      }


      .philosophy-header {
        display: block;

        margin-bottom: 65px;
      }


      .philosophy-header p {
        margin-top: 30px;
      }


      .philosophy-grid {
        grid-template-columns:
          repeat(2, 1fr);
      }


      .philosophy-item {
        min-height: 250px;
      }


      .philosophy-item:nth-child(2) {
        border-right: 0;
      }


      .philosophy-item:nth-child(3),
      .philosophy-item:nth-child(4) {
        border-top: 1px solid
          var(--dark-line);
      }


      .elmavia-final {
        height: 700px;

        min-height: 700px;
      }


      .final-content {
        left: 25px;
      }


      .final-giant-text {
        font-size: 27vw;
      }


      .elmavia-footer {
        padding:
          70px 25px 30px;
      }


      .footer-grid {
        grid-template-columns:
          1fr 1fr;

        gap: 50px 30px;
      }


      .footer-grid > div:last-child {
        grid-column: 1 / -1;
      }


      .footer-bottom {
        flex-direction: column;

        gap: 16px;
      }

    }


    @media (max-width: 480px) {

      .elmavia-products {
        grid-template-columns: 1fr;
      }


      .product-card-featured {
        grid-column: span 1;
      }


      .product-card-featured
        .product-image-wrap {
        aspect-ratio: 4 / 5;
      }


      .hero-content h1 {
        font-size: 68px;
      }


      .hero-description {
        font-size: 11px;

        max-width: 260px;
      }


      .elmavia-primary-button {
        min-width: 190px;

        gap: 25px;
      }


      .story-heading h2,
      .collection-top h2,
      .philosophy-header h2 {
        font-size: 58px;
      }


      .philosophy-grid {
        grid-template-columns: 1fr;
      }


      .philosophy-item,
      .philosophy-item:not(:first-child) {
        min-height: auto;

        padding:
          25px 0 45px;

        border-right: 0;

        border-bottom: 1px solid
          var(--dark-line);
      }


      .philosophy-item h3 {
        margin-top: 55px;
      }


      .philosophy-item:last-child {
        border-bottom: 0;
      }


      .footer-grid {
        grid-template-columns: 1fr;
      }


      .footer-grid > div:last-child {
        grid-column: auto;
      }

    }

  `;

  document.head.appendChild(style);
}