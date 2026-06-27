import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchWishlist, removeFromWishlist } from '../services/wishlistService';
import useCart from '../hooks/useCart';
import { FALLBACK_PRODUCT_IMAGE } from '../utils/productImage';

export default function WishlistPage(){
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

  const load = async()=>{
    setLoading(true);
    try{
      const list = await fetchWishlist();
      setItems(list);
    }catch(e){
      console.error(e);
    }finally{setLoading(false)}
  };

  useEffect(()=>{ load(); }, []);

  const handleRemove = async(id)=>{
    await removeFromWishlist(id);
    load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Your Wishlist</h1>
      {loading ? <div>Loading...</div> : (
        items.length===0 ? <div className="text-center text-gray-500">No items in wishlist.</div> : (
          <div className="space-y-3">
            {items.map(p=> (
              <div key={p._id} className="flex items-center justify-between rounded border bg-white p-3">
                <div className="flex items-center gap-3">
                  <img src={p.image || p.images?.[0] || FALLBACK_PRODUCT_IMAGE} className="h-16 w-16 object-cover" />
                  <div>
                    <Link to={`/products/${p._id}`} className="font-medium">{p.name}</Link>
                    <div className="text-sm text-gray-500">${Number(p.price||0).toFixed(2)} • ★ {Number(p.rating||0).toFixed(1)}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>{ addItem({ productId: p._id, name: p.name, image: p.image||p.images?.[0], price: p.price, countInStock: p.stock }, 1); }} className="px-3 py-1 rounded border">Add to Cart</button>
                  <button onClick={()=>handleRemove(p._id)} className="px-3 py-1 rounded bg-red-600 text-white">Remove</button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
