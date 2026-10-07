// sync_remote_products.mjs
// Synchronizes the remote Koyeb MongoDB database with the Apex Athletic 8-product catalog

const API_BASE = 'https://exact-gwenette-fitglow-38dc47eb.koyeb.app';

const CATALOG = [
  {
    name: 'ISO-Pure Whey Isolate',
    sku: 'SUP-001',
    description: '100% Cross-flow microfiltered cold-processed whey isolate. 27g protein per scoop with zero added sugars.',
    price: 64.99,
    salePrice: 54.99,
    category: 'supplements',
    image: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&q=80&w=800',
    stock: 120,
    averageRating: 4.9,
    reviewCount: 142,
    flavors: ['Double Rich Chocolate', 'Madagascar Vanilla', 'Salted Caramel Crunch'],
    specifications: { Servings: '30', Protein: '27g', BCAAs: '6.2g' },
  },
  {
    name: 'NeuroDrive Pre-Workout Igniter',
    sku: 'SUP-003',
    description: 'Clinical dose citrulline, beta-alanine, and alpha-GPC for laser tunnel focus, vascularity, and boundless power.',
    price: 49.99,
    salePrice: 42.99,
    category: 'supplements',
    image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=800',
    stock: 95,
    averageRating: 4.8,
    reviewCount: 98,
    flavors: ['Electric Lime Rush', 'Blue Raspberry Blast', 'Watermelon Surge'],
    specifications: { Servings: '40', Caffeine: '300mg', Citrulline: '8000mg' },
  },
  {
    name: 'Heavy Duty 10mm Lever Lifting Belt',
    sku: 'EQP-001',
    description: 'Competition grade top-grain leather with hardened alloy matte black quick-release lever mechanism.',
    price: 119.99,
    salePrice: 99.99,
    category: 'equipment',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=800',
    stock: 42,
    averageRating: 5.0,
    reviewCount: 76,
    sizes: ['Small (28-32")', 'Medium (32-36")', 'Large (36-40")', 'XL (40-44")'],
    specifications: { Thickness: '10mm', Material: 'Vegetable-tanned Leather' },
  },
  {
    name: 'Seamless Compression Tech Tee',
    sku: 'APP-001',
    description: 'Ultra-breathable 4-way stretch fabric engineered to keep you cool, dry, and mobile during heavy reps.',
    price: 38.00,
    salePrice: 32.00,
    category: 'apparel',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=800',
    stock: 64,
    averageRating: 4.7,
    reviewCount: 51,
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    specifications: { Fit: 'Athletic Tapered', Fabric: 'Polyester / Elastane' },
  },
  {
    name: 'SmartCoach Insulated Steel Shaker (800ml)',
    sku: 'ACC-001',
    description: 'Double-wall vacuum insulated stainless steel shaker with built-in silent agitator and leak-proof spout.',
    price: 28.00,
    salePrice: 22.50,
    category: 'accessories',
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=800',
    stock: 150,
    averageRating: 4.9,
    reviewCount: 88,
    specifications: { Capacity: '800ml', Material: '18/8 Food Grade Steel' },
  },
  {
    name: 'Heavy Resistance Band Set (5-Pack)',
    sku: 'EQP-002',
    description: '100% Malaysian latex loop bands ranging from 15 lbs to 150 lbs of tension for warming up and resistance work.',
    price: 34.99,
    salePrice: 29.99,
    category: 'equipment',
    image: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?auto=format&fit=crop&q=80&w=800',
    stock: 85,
    averageRating: 4.8,
    reviewCount: 64,
    specifications: { Resistance: '15 - 150 lbs', Material: '100% Malaysian Latex' },
  },
  {
    name: 'Creatine Monohydrate Micronized',
    sku: 'SUP-002',
    description: 'Micronized creatine monohydrate for explosive power, ATP replenishment, and cellular hydration.',
    price: 29.99,
    salePrice: 24.99,
    category: 'supplements',
    image: 'https://images.unsplash.com/photo-1616803689943-5601631c7fec?auto=format&fit=crop&q=80&w=800',
    stock: 200,
    averageRating: 4.9,
    reviewCount: 115,
    specifications: { Servings: '100', Dose: '5g Pure Creapure' },
  },
  {
    name: 'Adjustable Quick-Lock Dumbbells (50 lbs)',
    sku: 'EQP-003',
    description: 'Commercial-grade fast selector adjustable dumbbell system replacing 10 pairs of traditional dumbbells.',
    price: 299.99,
    salePrice: 249.99,
    category: 'equipment',
    image: 'https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?auto=format&fit=crop&q=80&w=800',
    stock: 30,
    averageRating: 4.9,
    reviewCount: 42,
    specifications: { Range: '5 - 50 lbs per hand', Increment: '2.5 / 5 lbs' },
  },
];

async function main() {
  console.log('🔄 Connecting to Koyeb API:', API_BASE);

  // 1. Authenticate as admin
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.com', password: 'password123' }),
  });

  if (!loginRes.ok) {
    throw new Error(`Admin login failed: ${loginRes.status} ${loginRes.statusText}`);
  }

  const { access_token } = await loginRes.json();
  console.log('🔑 Admin authenticated successfully.');

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${access_token}`,
  };

  // 2. Fetch existing products
  const productsRes = await fetch(`${API_BASE}/products`);
  if (!productsRes.ok) {
    throw new Error(`Failed to fetch existing products: ${productsRes.status}`);
  }
  const existingProducts = await productsRes.json();
  console.log(`📦 Found ${existingProducts.length} existing products in remote database.`);

  const usedExistingIds = new Set();
  const targetMap = new Map();

  // Match by SKU first
  for (const target of CATALOG) {
    const match = existingProducts.find(
      (ep) => !usedExistingIds.has(ep._id) && ep.sku && ep.sku.toLowerCase() === target.sku.toLowerCase()
    );
    if (match) {
      usedExistingIds.add(match._id);
      targetMap.set(target.sku, match);
    }
  }

  // Match remaining by name
  for (const target of CATALOG) {
    if (!targetMap.has(target.sku)) {
      const match = existingProducts.find(
        (ep) => !usedExistingIds.has(ep._id) && ep.name && ep.name.toLowerCase() === target.name.toLowerCase()
      );
      if (match) {
        usedExistingIds.add(match._id);
        targetMap.set(target.sku, match);
      }
    }
  }

  // Match remaining to unused existing slots (to update existing MongoDB docs rather than leaving legacy items)
  const unusedExisting = existingProducts.filter((ep) => !usedExistingIds.has(ep._id));
  for (const target of CATALOG) {
    if (!targetMap.has(target.sku) && unusedExisting.length > 0) {
      const slot = unusedExisting.shift();
      usedExistingIds.add(slot._id);
      targetMap.set(target.sku, slot);
    }
  }

  // 3. Synchronize all 8 products
  console.log('\n🚀 Synchronizing products...');

  for (const target of CATALOG) {
    const existing = targetMap.get(target.sku);

    // Merge flavors and sizes into specifications for dual compatibility
    const specs = { ...target.specifications };
    if (target.flavors?.length) {
      specs.Flavors = target.flavors.join(', ');
    }
    if (target.sizes?.length) {
      specs.Sizes = target.sizes.join(', ');
    }

    const fullPayload = {
      name: target.name,
      description: target.description,
      price: target.price,
      salePrice: target.salePrice,
      images: [target.image],
      category: target.category,
      stock: target.stock,
      isActive: true,
      sku: target.sku,
      specifications: specs,
      ...(target.flavors ? { flavors: target.flavors } : {}),
      ...(target.sizes ? { sizes: target.sizes } : {}),
      ...(target.averageRating ? { averageRating: target.averageRating } : {}),
      ...(target.reviewCount ? { reviewCount: target.reviewCount } : {}),
    };

    let targetId = existing?._id;

    if (targetId) {
      // Update existing product
      console.log(`\n⏳ Updating [${target.sku}] "${target.name}" (ID: ${targetId})...`);
      let updateRes = await fetch(`${API_BASE}/products/${targetId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(fullPayload),
      });

      if (!updateRes.ok) {
        const errJson = await updateRes.json().catch(() => ({}));
        // If server complains about non-whitelisted keys (e.g. prior deployment), sanitize and retry
        const safePayload = { ...fullPayload };
        delete safePayload.flavors;
        delete safePayload.sizes;
        delete safePayload.averageRating;
        delete safePayload.reviewCount;

        updateRes = await fetch(`${API_BASE}/products/${targetId}`, {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify(safePayload),
        });

        if (!updateRes.ok) {
          const secondErr = await updateRes.text();
          throw new Error(`Failed to update product ${target.sku}: ${secondErr}`);
        }
        console.log(`   ✅ Updated successfully (with specifications sync).`);
      } else {
        console.log(`   ✅ Updated successfully with full schema fields.`);
      }
    } else {
      // Create new product if needed
      console.log(`\n⏳ Creating new [${target.sku}] "${target.name}"...`);
      let createRes = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(fullPayload),
      });

      if (!createRes.ok) {
        const safePayload = { ...fullPayload };
        delete safePayload.flavors;
        delete safePayload.sizes;
        delete safePayload.averageRating;
        delete safePayload.reviewCount;

        createRes = await fetch(`${API_BASE}/products`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(safePayload),
        });

        if (!createRes.ok) {
          const secondErr = await createRes.text();
          throw new Error(`Failed to create product ${target.sku}: ${secondErr}`);
        }
      }
      const createdData = await createRes.json();
      targetId = createdData._id;
      console.log(`   ✅ Created product successfully (ID: ${targetId}).`);
    }

    // Ensure customer review and rating are present
    try {
      await fetch(`${API_BASE}/products/${targetId}/review`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          rating: Math.round(target.averageRating),
          review: `Apex Verified: Peak athletic quality for ${target.name}. Highly recommended!`,
        }),
      });
    } catch {
      // Non-fatal if review already submitted
    }
  }

  // 4. Verify all 8 products on remote
  console.log('\n📊 Verifying updated catalog from remote Koyeb...');
  const verifyRes = await fetch(`${API_BASE}/products`);
  const finalProducts = await verifyRes.json();

  console.log('\n================ APEX ATHLETIC LIVE CATALOG ================');
  for (const p of finalProducts) {
    console.log(`\n• [${p.sku}] ${p.name}`);
    console.log(`  ID: ${p._id}`);
    console.log(`  Category: ${p.category} | Price: $${p.price} (Sale: $${p.salePrice || 'N/A'}) | Stock: ${p.stock}`);
    console.log(`  Rating: ⭐ ${p.averageRating || 'N/A'} (${p.reviewCount || 0} reviews)`);
    console.log(`  Image: ${p.images?.[0]}`);
    if (p.flavors?.length) console.log(`  Flavors: ${p.flavors.join(', ')}`);
    if (p.sizes?.length) console.log(`  Sizes: ${p.sizes.join(', ')}`);
    console.log(`  Specifications:`, p.specifications);
  }
  console.log('\n============================================================');
  console.log(`🎉 Successfully synchronized ${finalProducts.length} products on Koyeb!`);
}

main().catch((err) => {
  console.error('❌ Sync failed:', err);
  process.exit(1);
});
