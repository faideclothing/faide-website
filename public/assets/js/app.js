(function () { const $ = (id) => document.getElementById(id);

// ---------------- CONFIG ---------------- const defaultConfig = { brand_name: "FAIDE", hero_title: "NEW DROP", hero_description: "New drops, exclusive releases, and updates are announced on our social platforms.", about_headline: "About FAIDE", about_description: "FAIDE is a luxury streetwear brand built for those who move in silence.", };

// ---------------- LOAD PRODUCTS ---------------- async function loadCatalog() { try { const res = await fetch("/assets/js/products.json", { cache: "no-store" }); if (!res.ok) throw new Error("Failed to fetch products.json"); const data = await res.json(); console.log("✅ Catalog loaded:", data); return data; } catch (err) { console.error("❌ Catalog error:", err); return { lookbook: [], products: [] }; } }

// ---------------- SCROLL ---------------- function scrollToShop() { const el = document.getElementById("shop"); if (!el) return; el.scrollIntoView({ behavior: "smooth" }); setTimeout(() => window.scrollBy(0, -80), 300); }

// ---------------- RENDER LOOKBOOK ---------------- function renderLookbook(list, items) { if (!list) return; list.innerHTML = "";

items.forEach((item) => {
  const div = document.createElement("div");
  div.className = "lookbook-card";
  div.innerHTML = `<img src="${item.image}" alt="${item.alt}" />`;
  list.appendChild(div);
});

}

// ---------------- RENDER SHOP ---------------- function renderShop(container, products) { if (!container) return; container.innerHTML = "";

products.forEach((p) => {
  const el = document.createElement("div");
  el.className = "product";

  const isOneSize = p.sizes.length === 1;

  el.innerHTML = `
    <img src="${p.images[0]}" class="product-img" />
    <h3>${p.name}</h3>
    <p>R${p.price}</p>

    ${
      isOneSize
        ? `<p class="one-size">One Size</p>`
        : `<div class="sizes">
            ${p.sizes
              .map((s) => `<button class="size">${s}</button>`)
              .join("")}
          </div>`
    }

    <button class="add">Add to Bag</button>
  `;

  container.appendChild(el);
});

console.log("✅ Products rendered");

}

// ---------------- POLICY MODAL ---------------- function initPolicy() { const modal = $("policy-modal"); const title = $("modal-title"); const content = $("modal-content");

if (!modal || !title || !content) return;

const data = {
  privacy: "We respect your privacy.",
  terms: "Terms apply.",
};

document.querySelectorAll("[data-policy]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const type = btn.dataset.policy;
    title.textContent = type;
    content.innerHTML = data[type] || "";
    modal.style.display = "block";
  });
});

$("close-modal")?.addEventListener("click", () => {
  modal.style.display = "none";
});

}

// ---------------- SIGNUP POPUP ---------------- function initSignup() { const modal = $("signup-modal"); if (!modal) return;

const shop = document.getElementById("shop");

const observer = new IntersectionObserver(
  (entries) => {
    if (entries[0].isIntersecting) {
      modal.style.display = "block";
      observer.disconnect();
    }
  },
  { threshold: 0.2 }
);

if (shop) observer.observe(shop);

}

// ---------------- MAIN ---------------- document.addEventListener("DOMContentLoaded", async () => { $("shop-now-btn")?.addEventListener("click", scrollToShop);

const catalog = await loadCatalog();

renderLookbook($("lookbook-list"), catalog.lookbook);
renderShop($("shop-products"), catalog.products);

initPolicy();
initSignup();

}); })();