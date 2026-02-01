 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/app.js b/app.js
index e69de29bb2d1d6434b8b29ae775ad8c2e48c5391..f8d4646b73eb31ad31baf139d43f3be58ffbdbea 100644
--- a/app.js
+++ b/app.js
@@ -0,0 +1,466 @@
+    const defaultConfig = {
+      brand_name: 'FAIDE',
+      hero_title: 'NEW DROP',
+      hero_description: 'New drops, exclusive releases, and updates are announced on our social platforms.',
+      mission_headline: 'A CLOTHING BRAND THAT NEVER FADE',
+      mission_description: 'FAIDE is a luxury streetwear brand built for those who move in silence.',
+      background_color: '#000000',
+      surface_color: '#111111',
+      text_color: '#ffffff',
+      primary_accent: '#a855f7',
+      secondary_accent: '#9333ea',
+      font_family: 'Inter',
+      font_size: 16
+    };
+
+    async function onConfigChange(config) {
+      const brandName = config.brand_name || defaultConfig.brand_name;
+      const heroTitle = config.hero_title || defaultConfig.hero_title;
+      const heroDescription = config.hero_description || defaultConfig.hero_description;
+      const missionHeadline = config.mission_headline || defaultConfig.mission_headline;
+      const missionDescription = config.mission_description || defaultConfig.mission_description;
+      const backgroundColor = config.background_color || defaultConfig.background_color;
+      const surfaceColor = config.surface_color || defaultConfig.surface_color;
+      const textColor = config.text_color || defaultConfig.text_color;
+      const primaryAccent = config.primary_accent || defaultConfig.primary_accent;
+      const secondaryAccent = config.secondary_accent || defaultConfig.secondary_accent;
+      const customFont = config.font_family || defaultConfig.font_family;
+      const baseSize = config.font_size || defaultConfig.font_size;
+      
+      // Update text content
+      document.getElementById('brand-name').textContent = brandName;
+      document.getElementById('hero-title').textContent = heroTitle;
+      document.getElementById('hero-description').textContent = heroDescription;
+      document.getElementById('mission-headline').textContent = missionHeadline;
+      document.getElementById('mission-description').textContent = missionDescription;
+      
+      // Update colors
+      document.body.style.background = backgroundColor;
+      document.body.style.color = textColor;
+      
+      // Update all products and surfaces with surface color
+      const products = document.querySelectorAll('.product');
+      products.forEach(product => {
+        product.style.background = `linear-gradient(135deg, ${surfaceColor} 0%, ${backgroundColor} 100%)`;
+      });
+      
+      const cards = document.querySelectorAll('.lookbook-card');
+      cards.forEach(card => {
+        card.style.background = surfaceColor;
+      });
+      
+      const navbar = document.querySelector('.navbar');
+      navbar.style.background = `rgba(0, 0, 0, 0.95)`;
+      
+      // Update accent colors
+      const prices = document.querySelectorAll('.price');
+      prices.forEach(price => {
+        price.style.color = primaryAccent;
+      });
+      
+      const purpleTitles = document.querySelectorAll('.purple-title');
+      purpleTitles.forEach(title => {
+        title.style.color = primaryAccent;
+      });
+      
+      const heroTitle2 = document.querySelector('.hero-title');
+      heroTitle2.style.color = primaryAccent;
+      heroTitle2.style.textShadow = `0 0 40px ${primaryAccent}80`;
+      
+      const primaryBtns = document.querySelectorAll('.primary-btn');
+      primaryBtns.forEach(btn => {
+        btn.style.background = `linear-gradient(135deg, ${secondaryAccent} 0%, ${primaryAccent} 100%)`;
+      });
+      
+      const secondaryBtns = document.querySelectorAll('.secondary-btn');
+      secondaryBtns.forEach(btn => {
+        btn.style.borderColor = secondaryAccent;
+        btn.style.color = secondaryAccent;
+      });
+      
+      const lookbookTitles = document.querySelectorAll('.lookbook-card-title');
+      lookbookTitles.forEach(title => {
+        title.style.color = primaryAccent;
+      });
+      
+      // Update fonts
+      const fontStack = `${customFont}, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
+      document.body.style.fontFamily = fontStack;
+      
+      // Update font sizes
+      document.querySelector('.hero-title').style.fontSize = `${baseSize * 2.5}px`;
+      document.querySelector('.hero-text').style.fontSize = `${baseSize * 1.1}px`;
+      document.querySelectorAll('.section-title').forEach(el => {
+        el.style.fontSize = `${baseSize * 2.5}px`;
+      });
+      document.querySelectorAll('.product h3').forEach(el => {
+        el.style.fontSize = `${baseSize * 1.3}px`;
+      });
+      document.querySelectorAll('.price').forEach(el => {
+        el.style.fontSize = `${baseSize * 1.4}px`;
+      });
+    }
+
+    function mapToCapabilities(config) {
+      return {
+        recolorables: [
+          {
+            get: () => config.background_color || defaultConfig.background_color,
+            set: (value) => {
+              config.background_color = value;
+              if (window.elementSdk) {
+                window.elementSdk.setConfig({ background_color: value });
+              }
+            }
+          },
+          {
+            get: () => config.surface_color || defaultConfig.surface_color,
+            set: (value) => {
+              config.surface_color = value;
+              if (window.elementSdk) {
+                window.elementSdk.setConfig({ surface_color: value });
+              }
+            }
+          },
+          {
+            get: () => config.text_color || defaultConfig.text_color,
+            set: (value) => {
+              config.text_color = value;
+              if (window.elementSdk) {
+                window.elementSdk.setConfig({ text_color: value });
+              }
+            }
+          },
+          {
+            get: () => config.primary_accent || defaultConfig.primary_accent,
+            set: (value) => {
+              config.primary_accent = value;
+              if (window.elementSdk) {
+                window.elementSdk.setConfig({ primary_accent: value });
+              }
+            }
+          },
+          {
+            get: () => config.secondary_accent || defaultConfig.secondary_accent,
+            set: (value) => {
+              config.secondary_accent = value;
+              if (window.elementSdk) {
+                window.elementSdk.setConfig({ secondary_accent: value });
+              }
+            }
+          }
+        ],
+        borderables: [],
+        fontEditable: {
+          get: () => config.font_family || defaultConfig.font_family,
+          set: (value) => {
+            config.font_family = value;
+            if (window.elementSdk) {
+              window.elementSdk.setConfig({ font_family: value });
+            }
+          }
+        },
+        fontSizeable: {
+          get: () => config.font_size || defaultConfig.font_size,
+          set: (value) => {
+            config.font_size = value;
+            if (window.elementSdk) {
+              window.elementSdk.setConfig({ font_size: value });
+            }
+          }
+        }
+      };
+    }
+
+    function mapToEditPanelValues(config) {
+      return new Map([
+        ['brand_name', config.brand_name || defaultConfig.brand_name],
+        ['hero_title', config.hero_title || defaultConfig.hero_title],
+        ['hero_description', config.hero_description || defaultConfig.hero_description],
+        ['mission_headline', config.mission_headline || defaultConfig.mission_headline],
+        ['mission_description', config.mission_description || defaultConfig.mission_description]
+      ]);
+    }
+
+    // Initialize Element SDK
+    if (window.elementSdk) {
+      window.elementSdk.init({
+        defaultConfig,
+        onConfigChange,
+        mapToCapabilities,
+        mapToEditPanelValues
+      });
+    }
+
+    // Product interaction functionality
+    let cart = [];
+
+    document.addEventListener('DOMContentLoaded', () => {
+      const products = document.querySelectorAll('.product');
+      const floatingCart = document.getElementById('floating-cart');
+      const cartSidebar = document.getElementById('cart-sidebar');
+      const closeCart = document.getElementById('close-cart');
+      const cartItemsEl = document.getElementById('cart-items');
+      const cartTotalEl = document.getElementById('cart-total');
+      const cartCountEl = document.getElementById('cart-count');
+      
+      // Cart sidebar toggle
+      if (floatingCart) {
+        floatingCart.addEventListener('click', () => cartSidebar.classList.add('active'));
+      }
+      if (closeCart) {
+        closeCart.addEventListener('click', () => cartSidebar.classList.remove('active'));
+      }
+      
+      products.forEach(product => {
+        // Size selection
+        const sizeButtons = product.querySelectorAll('.size-btn');
+        sizeButtons.forEach(btn => {
+          btn.addEventListener('click', () => {
+            sizeButtons.forEach(b => b.classList.remove('selected'));
+            btn.classList.add('selected');
+          });
+        });
+        
+        // Color selection
+        const colorOptions = product.querySelectorAll('.color');
+        colorOptions.forEach(color => {
+          color.addEventListener('click', () => {
+            colorOptions.forEach(c => c.classList.remove('selected'));
+            color.classList.add('selected');
+          });
+        });
+        
+        // Add to cart
+        const addToCartBtn = product.querySelector('.add-to-cart');
+        addToCartBtn.addEventListener('click', () => {
+          const productName = product.getAttribute('data-name');
+          const price = parseFloat(product.getAttribute('data-price'));
+          const selectedSize = product.querySelector('.size-btn.selected');
+          const selectedColor = product.querySelector('.color.selected');
+          const quantity = parseInt(product.querySelector('.quantity').value);
+          
+          const size = selectedSize ? selectedSize.textContent : 'N/A';
+          const color = selectedColor ? selectedColor.getAttribute('data-color') : 'N/A';
+          
+          // Create unique item key
+          const itemKey = `${productName}-${size}-${color}`;
+          
+          // Check if item exists in cart
+          const existing = cart.find(item => item.key === itemKey);
+          if (existing) {
+            existing.quantity += quantity;
+          } else {
+            cart.push({
+              key: itemKey,
+              name: productName,
+              price: price,
+              size: size,
+              color: color,
+              quantity: quantity
+            });
+          }
+          
+          updateCartUI();
+          
+          let message = `Added ${quantity}x ${productName}`;
+          if (selectedSize) message += ` (${size})`;
+          if (selectedColor) message += ` in ${color}`;
+          message += ' to cart!';
+          
+          showCartToast(message);
+        });
+      });
+      
+      function updateCartUI() {
+        if (!cartItemsEl || !cartTotalEl || !cartCountEl) return;
+        
+        cartItemsEl.innerHTML = '';
+        let total = 0;
+        let itemCount = 0;
+        
+        cart.forEach((item, index) => {
+          const li = document.createElement('li');
+          li.innerHTML = `
+            <div>
+              <div style="font-weight: 700; margin-bottom: 4px;">${item.name}</div>
+              <div style="font-size: 0.85rem; color: #888;">
+                Size: ${item.size} | Color: ${item.color} | Qty: ${item.quantity}
+              </div>
+            </div>
+            <div style="font-weight: 700; color: #a855f7;">R${(item.price * item.quantity).toFixed(2)}</div>
+          `;
+          cartItemsEl.appendChild(li);
+          total += item.price * item.quantity;
+          itemCount += item.quantity;
+        });
+        
+        cartTotalEl.textContent = total.toFixed(2);
+        cartCountEl.textContent = itemCount;
+        
+        if (itemCount === 0) {
+          cartItemsEl.innerHTML = '<li style="text-align: center; color: #666; border: none; background: transparent;">Your cart is empty</li>';
+        }
+      }
+    });
+
+    function showCartToast(message) {
+      const toast = document.getElementById('cartToast');
+      const messageEl = document.getElementById('cartMessage');
+      
+      messageEl.textContent = message;
+      toast.classList.add('show');
+      
+      setTimeout(() => {
+        toast.classList.remove('show');
+      }, 3000);
+    }
+
+    // Policy Modal Functionality
+    const policyModal = document.getElementById('policy-modal');
+    const modalTitle = document.getElementById('modal-title');
+    const modalContent = document.getElementById('modal-content');
+    const closeModal = document.getElementById('close-modal');
+
+    const policies = {
+      privacy: {
+        title: 'Privacy Policy',
+        content: `
+          <h3 style="color: #fff; font-size: 1.2rem; font-weight: 700; margin-bottom: 16px;">Introduction</h3>
+          <p style="margin-bottom: 20px;">FAIDE respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data.</p>
+          
+          <h3 style="color: #fff; font-size: 1.2rem; font-weight: 700; margin-bottom: 16px; margin-top: 32px;">Information We Collect</h3>
+          <p style="margin-bottom: 20px;">We collect information you provide directly to us, including name, email address, shipping address, and payment information when you make a purchase.</p>
+          
+          <h3 style="color: #fff; font-size: 1.2rem; font-weight: 700; margin-bottom: 16px; margin-top: 32px;">How We Use Your Information</h3>
+          <p style="margin-bottom: 20px;">We use your information to process orders, communicate with you about your purchases, and send promotional materials (with your consent).</p>
+          
+          <h3 style="color: #fff; font-size: 1.2rem; font-weight: 700; margin-bottom: 16px; margin-top: 32px;">Data Security</h3>
+          <p style="margin-bottom: 20px;">We implement appropriate security measures to protect your personal information from unauthorized access, alteration, or destruction.</p>
+          
+          <h3 style="color: #fff; font-size: 1.2rem; font-weight: 700; margin-bottom: 16px; margin-top: 32px;">Contact Us</h3>
+          <p>If you have questions about this Privacy Policy, please contact us through our social media channels.</p>
+        `
+      },
+      terms: {
+        title: 'Terms of Service',
+        content: `
+          <h3 style="color: #fff; font-size: 1.2rem; font-weight: 700; margin-bottom: 16px;">Agreement to Terms</h3>
+          <p style="margin-bottom: 20px;">By accessing and using the FAIDE website, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
+          
+          <h3 style="color: #fff; font-size: 1.2rem; font-weight: 700; margin-bottom: 16px; margin-top: 32px;">Use License</h3>
+          <p style="margin-bottom: 20px;">Permission is granted to temporarily view and purchase products from this site for personal, non-commercial use only.</p>
+          
+          <h3 style="color: #fff; font-size: 1.2rem; font-weight: 700; margin-bottom: 16px; margin-top: 32px;">Product Information</h3>
+          <p style="margin-bottom: 20px;">We strive to provide accurate product descriptions and pricing. However, we reserve the right to correct any errors or inaccuracies.</p>
+          
+          <h3 style="color: #fff; font-size: 1.2rem; font-weight: 700; margin-bottom: 16px; margin-top: 32px;">Intellectual Property</h3>
+          <p style="margin-bottom: 20px;">All content on this site, including designs, logos, and branding, is the property of FAIDE and protected by copyright laws.</p>
+          
+          <h3 style="color: #fff; font-size: 1.2rem; font-weight: 700; margin-bottom: 16px; margin-top: 32px;">Limitation of Liability</h3>
+          <p>FAIDE shall not be liable for any indirect, incidental, or consequential damages arising from the use of our products or services.</p>
+        `
+      },
+      returns: {
+        title: 'Returns & Exchanges',
+        content: `
+          <h3 style="color: #fff; font-size: 1.2rem; font-weight: 700; margin-bottom: 16px;">Return Policy</h3>
+          <p style="margin-bottom: 20px;">We accept returns within 30 days of purchase for unworn, unwashed items with original tags attached.</p>
+          
+          <h3 style="color: #fff; font-size: 1.2rem; font-weight: 700; margin-bottom: 16px; margin-top: 32px;">How to Return</h3>
+          <p style="margin-bottom: 20px;">Contact us through our social media channels to initiate a return. We'll provide you with a return authorization and shipping instructions.</p>
+          
+          <h3 style="color: #fff; font-size: 1.2rem; font-weight: 700; margin-bottom: 16px; margin-top: 32px;">Exchanges</h3>
+          <p style="margin-bottom: 20px;">We're happy to exchange items for different sizes or colors, subject to availability. Contact us to arrange an exchange.</p>
+          
+          <h3 style="color: #fff; font-size: 1.2rem; font-weight: 700; margin-bottom: 16px; margin-top: 32px;">Refunds</h3>
+          <p style="margin-bottom: 20px;">Refunds will be processed within 5-7 business days after we receive your return. Original shipping costs are non-refundable.</p>
+          
+          <h3 style="color: #fff; font-size: 1.2rem; font-weight: 700; margin-bottom: 16px; margin-top: 32px;">Final Sale Items</h3>
+          <p>Sale items marked as "Final Sale" are not eligible for returns or exchanges.</p>
+        `
+      },
+      shipping: {
+        title: 'Shipping Policy',
+        content: `
+          <h3 style="color: #fff; font-size: 1.2rem; font-weight: 700; margin-bottom: 16px;">Shipping Methods</h3>
+          <p style="margin-bottom: 20px;">We offer standard and express shipping options. Shipping times vary based on your location and selected method.</p>
+          
+          <h3 style="color: #fff; font-size: 1.2rem; font-weight: 700; margin-bottom: 16px; margin-top: 32px;">Processing Time</h3>
+          <p style="margin-bottom: 20px;">Orders are typically processed within 1-3 business days. You'll receive a tracking number once your order ships.</p>
+          
+          <h3 style="color: #fff; font-size: 1.2rem; font-weight: 700; margin-bottom: 16px; margin-top: 32px;">Shipping Costs</h3>
+          <p style="margin-bottom: 20px;">Shipping costs are calculated at checkout based on your location and selected shipping method. Free shipping on orders over R1,000.</p>
+          
+          <h3 style="color: #fff; font-size: 1.2rem; font-weight: 700; margin-bottom: 16px; margin-top: 32px;">International Shipping</h3>
+          <p style="margin-bottom: 20px;">We currently ship within South Africa. International shipping options are coming soon.</p>
+          
+          <h3 style="color: #fff; font-size: 1.2rem; font-weight: 700; margin-bottom: 16px; margin-top: 32px;">Damaged or Lost Packages</h3>
+          <p>If your package arrives damaged or is lost in transit, please contact us immediately through our social media channels and we'll resolve the issue.</p>
+        `
+      }
+    };
+
+    function showPolicy(policyType) {
+      const policy = policies[policyType];
+      if (policy) {
+        modalTitle.textContent = policy.title;
+        modalContent.innerHTML = policy.content;
+        policyModal.style.display = 'block';
+        document.body.style.overflow = 'hidden';
+      }
+    }
+
+    function hidePolicy() {
+      policyModal.style.display = 'none';
+      document.body.style.overflow = 'auto';
+    }
+
+    document.getElementById('privacy-link').addEventListener('click', (e) => {
+      e.preventDefault();
+      showPolicy('privacy');
+    });
+
+    document.getElementById('terms-link').addEventListener('click', (e) => {
+      e.preventDefault();
+      showPolicy('terms');
+    });
+
+    document.getElementById('returns-link').addEventListener('click', (e) => {
+      e.preventDefault();
+      showPolicy('returns');
+    });
+
+    document.getElementById('shipping-link').addEventListener('click', (e) => {
+      e.preventDefault();
+      showPolicy('shipping');
+    });
+
+    closeModal.addEventListener('click', hidePolicy);
+
+    policyModal.addEventListener('click', (e) => {
+      if (e.target === policyModal) {
+        hidePolicy();
+      }
+    });
+
+    // Footer link hover effects
+    document.querySelectorAll('footer a').forEach(link => {
+      link.addEventListener('mouseenter', function() {
+        this.style.color = '#9333ea';
+      });
+      link.addEventListener('mouseleave', function() {
+        this.style.color = '#888';
+      });
+    });
+
+    document.getElementById('close-modal').addEventListener('mouseenter', function() {
+      this.style.color = '#fff';
+      this.style.background = '#1a1a1a';
+    });
+    document.getElementById('close-modal').addEventListener('mouseleave', function() {
+      this.style.color = '#888';
+      this.style.background = 'transparent';
+    });
+
+;(function(){function c(){var b=a.contentDocument||a.contentWindow.document;if(b){var d=b.createElement('script');d.innerHTML="window.__CF$cv$params={r:'9c6cd97dc2926d25',t:'MTc2OTkwMDY4Mi4wMDAwMDA='};var a=document.createElement('script');a.nonce='';a.src='/cdn-cgi/challenge-platform/scripts/jsd/main.js';document.getElementsByTagName('head')[0].appendChild(a);";b.getElementsByTagName('head')[0].appendChild(d)}}if(document.body){var a=document.createElement('iframe');a.height=1;a.width=1;a.style.position='absolute';a.style.top=0;a.style.left=0;a.style.border='none';a.style.visibility='hidden';document.body.appendChild(a);if('loading'!==document.readyState)c();else if(window.addEventListener)document.addEventListener('DOMContentLoaded',c);else{var e=document.onreadystatechange||function(){};document.onreadystatechange=function(b){e(b);'loading'!==document.readyState&&(document.onreadystatechange=e,c())}}}})();
 
EOF
)