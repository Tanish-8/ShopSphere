import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });
import connectDB from '../config/db.js';
import User from '../models/User.js';
const API = process.env.API_BASE || 'http://localhost:5001/api';

async function httpPost(path, body, token){
  const res = await fetch(`${API}${path}`, { method: 'POST', headers: { 'Content-Type':'application/json', ...(token?{ Authorization: `Bearer ${token}` }: {}) }, body: JSON.stringify(body) });
  const data = await res.json().catch(()=>null);
  if(!res.ok) throw { status: res.status, data };
  return data;
}
async function httpGet(path, token){
  const res = await fetch(`${API}${path}`, { headers: { ...(token?{ Authorization: `Bearer ${token}` }: {}) } });
  const data = await res.json().catch(()=>null);
  if(!res.ok) throw { status: res.status, data };
  return data;
}
async function httpPut(path, body, token){
  const res = await fetch(`${API}${path}`, { method: 'PUT', headers: { 'Content-Type':'application/json', ...(token?{ Authorization: `Bearer ${token}` }: {}) }, body: JSON.stringify(body) });
  const data = await res.json().catch(()=>null);
  if(!res.ok) throw { status: res.status, data };
  return data;
}
async function httpDelete(path, token){
  const res = await fetch(`${API}${path}`, { method: 'DELETE', headers: { ...(token?{ Authorization: `Bearer ${token}` }: {}) } });
  const data = await res.json().catch(()=>null);
  if(!res.ok) throw { status: res.status, data };
  return data;
}

async function main(){
  await connectDB();

  const testEmail = 'admin.test@example.com';
  const testPassword = 'Password123';
  const testName = 'Admin Test';

  try{
    console.log('Registering test user...');
    await httpPost('/auth/register', { name: testName, email: testEmail, password: testPassword });
  }catch(err){
    if(err.status === 400 && /already exists/i.test(err.data?.message || '')){
      console.log('User already exists, continuing...');
    } else {
      console.error('Register error', err);
    }
  }

  // Promote to admin directly in DB
  const user = await User.findOne({ email: testEmail });
  if(!user){
    console.error('Failed to find created user in DB');
    process.exit(1);
  }
  user.role = 'admin';
  await user.save();
  console.log('User promoted to admin');

  // Login to get token
  const loginRes = await httpPost('/auth/login', { email: testEmail, password: testPassword });
  const token = loginRes?.data?.token || loginRes?.token || loginRes?.data?.data?.token;
  if(!token){
    console.error('Failed to login and get token');
    process.exit(1);
  }
  console.log('Obtained admin token');

  const auth = { headers: { Authorization: `Bearer ${token}` } };

  // Create product
  const productPayload = {
    name: 'Test Product ' + Date.now(),
    description: 'Created by automated test',
    category: 'Testing',
    brand: 'TestBrand',
    price: 9.99,
    stock: 10,
    image: 'https://placehold.co/600x400',
  };

  const createRes = await httpPost('/products', productPayload, token);
  const created = createRes?.data || createRes;
  console.log('Created product id:', created._id || created.id);

  const prodId = created._id || created.id;

  // Fetch products and ensure presence
  const all = await httpGet('/products');
  const found = (all?.data || all)?.find((p)=> (p._id || p.id) === prodId) || null;
  console.log('Product found in GET /products:', !!found);

  // Update product
  const updateRes = await httpPut(`/products/${prodId}`, { price: 19.99, stock: 5 }, token);
  console.log('Update result price now:', updateRes?.data?.price || updateRes?.price || updateRes?.data?.data?.price || updateRes?.data);

  // Delete product
  const delRes = await httpDelete(`/products/${prodId}`, token);
  console.log('Delete result:', delRes?.message || delRes);

  console.log('Test complete');
  process.exit(0);
}

main().catch((err)=>{ console.error(err.response?.data || err.message); process.exit(1); });
