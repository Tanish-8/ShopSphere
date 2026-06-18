const base = 'http://localhost:5001/api';

async function req(path, opts={}){
  const res = await fetch(base+path, opts);
  const text = await res.text();
  let json;
  try{ json = JSON.parse(text); }catch(e){ json = text; }
  return { status: res.status, ok: res.ok, data: json };
}

function rnd(n=6){ return Math.random().toString(36).slice(2,2+n); }

(async ()=>{
  try{
    console.log('Registering test user...');
    const email = `test${Date.now()}@example.com`;
    let r = await req('/auth/register', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name: 'Test User', email, password: 'password123' }) });
    console.log('register', r.status, r.data);

    console.log('Logging in...');
    r = await req('/auth/login', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password: 'password123' }) });
    console.log('login', r.status, r.data);
    if(!r.ok) throw new Error('login failed');
    const token = r.data?.data?.token || (r.data?.data && r.data.data.token);
    if(!token){ console.error('No token in login response, full:', r.data); process.exit(1); }
    const auth = { 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` };

    console.log('GET /addresses (should be empty)');
    r = await req('/addresses', { headers: auth });
    console.log('/addresses', r.status, r.data);

    console.log('POST /addresses (create 2 addresses)');
    const addr1 = { label: 'Home', fullName: 'Test User', phone: '1234567890', landmark: 'Near Park', street: '123 Main St', city: 'Metropolis', state: 'State', zipCode: '12345', country: 'Wonderland', isDefault: true };
    r = await req('/addresses', { method:'POST', headers: auth, body: JSON.stringify(addr1) });
    console.log('create1', r.status, r.data);
    const id1 = r.data?.data?._id || r.data?.data?.id || (r.data?.data && r.data.data._id);

    const addr2 = { label: 'Work', fullName: 'Test User', phone: '0987654321', street: '9 Business Rd', city: 'Metropolis', state: 'State', zipCode: '54321', country: 'Wonderland', isDefault: false };
    r = await req('/addresses', { method:'POST', headers: auth, body: JSON.stringify(addr2) });
    console.log('create2', r.status, r.data);
    const id2 = r.data?.data?._id;

    console.log('GET /addresses after creation');
    r = await req('/addresses', { headers: auth });
    console.log('/addresses', r.status, r.data);

    console.log('PUT /addresses/:id (update second address label)');
    r = await req(`/addresses/${id2}`, { method: 'PUT', headers: auth, body: JSON.stringify({ label: 'Office', fullName: 'Test User Office' }) });
    console.log('update', r.status, r.data);

    console.log('PUT /addresses/:id/default (make second default)');
    r = await req(`/addresses/${id2}/default`, { method: 'PUT', headers: auth });
    console.log('set default', r.status, r.data);

    console.log('GET /addresses to verify defaults');
    r = await req('/addresses', { headers: auth });
    console.log('/addresses', r.status, JSON.stringify(r.data, null, 2));

    console.log('DELETE /addresses/:id (delete first)');
    r = await req(`/addresses/${id1}`, { method: 'DELETE', headers: auth });
    console.log('delete', r.status, r.data);

    console.log('GET /addresses after delete');
    r = await req('/addresses', { headers: auth });
    console.log('/addresses', r.status, JSON.stringify(r.data, null, 2));

    // Checkout test: get a product
    console.log('GET /products (fetch product)');
    r = await req('/products');
    if(!r.ok) { console.error('Failed to fetch products', r); process.exit(1); }
    const products = r.data?.data || r.data;
    const prod = Array.isArray(products) ? products[0] : (products && products.data && products.data[0]);
    if(!prod){ console.error('No products available to create order'); process.exit(0); }
    console.log('using product id', prod._id || prod.id);

    // Build order payload using default address
    r = await req('/addresses', { headers: auth });
    const addresses = r.data?.data || [];
    const def = addresses.find(a=>a.isDefault) || addresses[0];
    if(!def){ console.error('No default address for checkout test'); }

    const orderPayload = {
      orderItems: [ { product: prod._id || prod.id, quantity: 1 } ],
      shippingAddress: {
        fullName: def.fullName || 'Test User',
        phone: def.phone || '',
        landmark: def.landmark || '',
        street: def.street,
        city: def.city,
        state: def.state,
        zipCode: def.zipCode,
        country: def.country,
      },
      paymentMethod: 'cod',
    };

    console.log('POST /orders to create order');
    r = await req('/orders', { method: 'POST', headers: auth, body: JSON.stringify(orderPayload) });
    console.log('create order', r.status, JSON.stringify(r.data, null, 2));
    if(!r.ok) { console.error('Order creation failed'); process.exit(1); }
    const orderId = r.data?.data?._id;

    console.log('GET /orders/myorders to verify order history');
    r = await req('/orders/myorders', { headers: auth });
    console.log('/myorders', r.status, JSON.stringify(r.data, null, 2));

    console.log('All tests completed successfully.');
    process.exit(0);
  }catch(err){
    console.error('Test script error:', err);
    process.exit(2);
  }
})();
