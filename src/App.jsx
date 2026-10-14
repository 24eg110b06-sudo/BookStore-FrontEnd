import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowRight, BookOpen, Check, ChevronDown, Heart, Menu, Minus, Plus, Search, ShoppingBag, Sparkles, X } from 'lucide-react';

const API = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const covers = {
  'The Quiet Between': ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=700&q=85', 'sage'],
  'A Map of Small Things': ['https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=700&q=85', 'peach'],
  'Wildflower Season': ['https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=700&q=85', 'blue'],
  'The Art of Beginning': ['https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=700&q=85', 'yellow'],
  'Everything, Eventually': ['https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=700&q=85', 'rose'],
  'A Little More Light': ['https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=700&q=85', 'lavender'],
};
const starterBooks = [
  { id: 1, title: 'The Quiet Between', author: 'Mara Ellison', category: 'Fiction', price: 18.5, rating: 4.9, description: 'A tender, quietly luminous story about the words we leave unsaid and the people who hear them anyway.', featured: true },
  { id: 2, title: 'A Map of Small Things', author: 'Jules Bennett', category: 'Fiction', price: 21, rating: 4.8, description: 'A charming journey through hidden city corners, old friendships, and the beautiful art of getting a little lost.', featured: true },
  { id: 3, title: 'Wildflower Season', author: 'Nina Sol', category: 'Wellness', price: 16.75, rating: 4.7, description: 'A gentle invitation to slow down, find your own rhythm, and let the small good things grow.', featured: true },
  { id: 4, title: 'The Art of Beginning', author: 'Theo Wren', category: 'Personal Growth', price: 19, rating: 4.9, description: 'Thoughtful tools for starting over, starting small, and making room for the life you actually want.', featured: true },
  { id: 5, title: 'Everything, Eventually', author: 'Clara Finch', category: 'Fiction', price: 22.5, rating: 4.8, description: 'For anyone who has ever needed a reminder that becoming takes the time it takes.', featured: false },
  { id: 6, title: 'A Little More Light', author: 'Avery Brooks', category: 'Art & Design', price: 17.25, rating: 4.6, description: 'A visual collection of ordinary moments that make an unexpectedly beautiful life.', featured: false },
];
const money = (n) => `$${Number(n).toFixed(2)}`;

function Cover({ book, className = '' }) {
  const [src, palette] = covers[book.title] || [null, 'sage'];
  return <div className={`cover ${palette} ${className}`}>{src ? <img src={src} alt={`${book.title} book cover`} loading="lazy" /> : <div className="cover-placeholder"><BookOpen size={34} /><span>{book.title}</span></div>}<span className="cover-label">BOOK HAVEN EDITIONS</span></div>;
}

export default function App() {
  const [books, setBooks] = useState(starterBooks);
  const [cart, setCart] = useState({});
  const [activeCategory, setCategory] = useState('All books');
  const [query, setQuery] = useState('');
  const [drawer, setDrawer] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [notice, setNotice] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [customer, setCustomer] = useState({ customerName: '', email: '', address: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => { fetch(`${API}/api/books`).then(r => r.ok ? r.json() : Promise.reject()).then(data => { if (data.length) setBooks(data); }).catch(() => {}); }, []);
  const categories = ['All books', ...new Set(books.map(b => b.category))];
  const filtered = useMemo(() => books.filter(b => (activeCategory === 'All books' || b.category === activeCategory) && `${b.title} ${b.author} ${b.category}`.toLowerCase().includes(query.toLowerCase())), [books, activeCategory, query]);
  const cartItems = books.filter(b => cart[b.id]).map(book => ({ ...book, quantity: cart[book.id] }));
  const count = cartItems.reduce((n, item) => n + item.quantity, 0);
  const total = cartItems.reduce((n, item) => n + item.price * item.quantity, 0);
  const updateCart = (id, delta) => setCart(prev => { const next = { ...prev, [id]: (prev[id] || 0) + delta }; if (next[id] <= 0) delete next[id]; return next; });
  const flash = (message) => { setNotice(message); window.setTimeout(() => setNotice(''), 3200); };

  async function placeOrder(event) {
    event.preventDefault(); setBusy(true);
    try {
      const response = await fetch(`${API}/api/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...customer, items: cartItems.map(i => ({ bookId: i.id, quantity: i.quantity })) }) });
      if (!response.ok) throw new Error('Could not place your order. Please check the API and try again.');
      const order = await response.json(); setCart({}); setCheckout(false); setDrawer(false); flash(`Order #${order.id} is confirmed. A little joy is on its way!`);
    } catch (e) { flash(e.message || 'Could not place your order.'); }
    finally { setBusy(false); }
  }
  async function addBook(event) {
    event.preventDefault(); const form = new FormData(event.currentTarget); const book = Object.fromEntries(form.entries()); book.price = Number(book.price); book.rating = 4.8;
    try { const response = await fetch(`${API}/api/books`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Admin-Key': adminKey }, body: JSON.stringify(book) }); if (!response.ok) throw new Error('Admin key may be missing or invalid.'); const created = await response.json(); setBooks(prev => [...prev, created]); event.currentTarget.reset(); flash('Book added to the shelves.'); }
    catch (e) { flash(e.message); }
  }

  return <>
    <header className="topbar"><a className="brand" href="#home"><span className="brand-mark"><BookOpen size={19} /></span><span>book<span className="brand-light">haven</span><small>GOOD STORIES LIVE HERE</small></span></a>
      <nav className={menuOpen ? 'nav open' : 'nav'}><a href="#books" onClick={() => setMenuOpen(false)}>Shop books</a><a href="#story" onClick={() => setMenuOpen(false)}>Our story</a><a href="#newsletter" onClick={() => setMenuOpen(false)}>The reading room</a></nav>
      <div className="top-actions"><button className="icon-button search-toggle" aria-label="Focus search" onClick={() => { document.getElementById('book-search')?.focus(); document.getElementById('books')?.scrollIntoView({ behavior: 'smooth' }); }}><Search size={19}/></button><button className="bag-button" onClick={() => setDrawer(true)}><ShoppingBag size={18}/><span>Bag</span><b>{count}</b></button><button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">{menuOpen ? <X/> : <Menu/>}</button></div>
    </header>
    <main id="home">
      <section className="hero"><div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line"></span>YOUR NEXT CHAPTER STARTS HERE</div><h1>Stories that<br/>feel like <em>coming</em><br/><em>home.</em></h1><p>Thoughtfully chosen books for wherever life finds you. Take your time. Find your story.</p><div className="hero-buttons"><a className="button primary" href="#books">Find your next read <ArrowRight size={17}/></a><a className="text-link" href="#story">A little about us <ArrowDown size={15}/></a></div><div className="reader-love"><div className="avatars"><span>J</span><span>M</span><span>A</span><span>+</span></div><p><strong>Loved by 2,400+ readers</strong><br/><span>and counting, one page at a time</span></p></div></div>
        <div className="hero-art"><div className="sun"></div><div className="hero-note"><Sparkles size={15}/><span>slow down.<br/>stay awhile.</span></div><div className="hero-book hero-book-back"><Cover book={books[1] || starterBooks[1]}/></div><div className="hero-book hero-book-front"><Cover book={books[0] || starterBooks[0]}/></div><div className="scribble">a good<br/>kind of<br/>escape <span>↗</span></div><div className="hero-ground"></div></div>
        <div className="hero-index"><span>01</span><i></i><span>04</span></div>
      </section>
      <section className="promise-strip"><div><span className="promise-icon">✳</span><p><strong>Picked with feeling</strong><small>Every book has a reason</small></p></div><div><span className="promise-icon">↗</span><p><strong>Free shipping over $40</strong><small>A little extra for your shelf</small></p></div><div><span className="promise-icon">♡</span><p><strong>Independent & reader-run</strong><small>Real people, real recommendations</small></p></div><div><span className="promise-icon">✉</span><p><strong>A note in every order</strong><small>Because the small things matter</small></p></div></section>
      <section className="books-section" id="books"><div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-line"></span> THE GOOD STUFF</div><h2>A shelf for <em>every</em> season.</h2><p>New favorites, old comforts, and the ones you'll lend (maybe).</p></div><a className="text-link desktop-link" href="#books" onClick={() => {setCategory('All books'); setQuery('');}}>Browse the whole shelf <ArrowRight size={16}/></a></div>
        <div className="catalog-tools"><div className="category-tabs">{categories.map(cat => <button key={cat} onClick={() => setCategory(cat)} className={activeCategory === cat ? 'active' : ''}>{cat}</button>)}</div><label className="search-field"><Search size={17}/><input id="book-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="A title, an author, a feeling..."/><ChevronDown size={15}/></label></div>
        {filtered.length ? <div className="book-grid">{filtered.map((book, index) => <article className="book-card" key={book.id}><div className="card-image"><Cover book={book}/>{index === 0 && activeCategory === 'All books' && !query && <span className="badge">READER FAVORITE</span>}<button className="favorite" aria-label={`Add ${book.title} to wishlist`} onClick={() => flash('Wishlist is coming soon — save this one in your heart for now.') }><Heart size={17}/></button><button className="quick-add" onClick={() => {updateCart(book.id, 1); flash(`${book.title} added to your bag.`);}}>Add to bag <Plus size={15}/></button></div><div className="book-meta"><span>{book.category}</span><span className="rating">★ {book.rating || '4.8'}</span></div><h3>{book.title}</h3><p className="author">by {book.author}</p><div className="card-bottom"><span className="price">{money(book.price)}</span><button className="small-add" onClick={() => updateCart(book.id, 1)} aria-label={`Add ${book.title} to bag`}><Plus size={17}/></button></div></article>)}</div> : <div className="empty-state"><BookOpen size={28}/><p>No books found on this shelf. Try another search.</p></div>}
      </section>
      <section className="story-section" id="story"><div className="story-image"><div className="story-photo"></div><div className="photo-caption">THE SHOP, ON A SLOW TUESDAY</div><div className="story-stamp">EST.<br/><b>2021</b></div></div><div className="story-copy"><div className="eyebrow"><span className="eyebrow-line"></span> A SMALL SHOP WITH A BIG SOFT SPOT</div><h2>We think the<br/>right book finds<br/><em>you right on time.</em></h2><p>Book Haven started with a tiny bookshop, a very long reading list, and a belief that a good story can make the world feel a little more possible.</p><p>We still choose every title by hand. No endless scroll. No algorithm deciding what you should love. Just good books, picked by people who really, really love books.</p><a className="text-link" href="#newsletter">Come say hello <ArrowRight size={16}/></a></div></section>
      <section className="newsletter" id="newsletter"><div className="newsletter-spark">✳</div><div className="eyebrow">A LETTER FROM OUR BOOKSHOP</div><h2>Good things, <em>once a month.</em></h2><p>Reading notes, new arrivals, and the occasional reason to put the kettle on.</p><form onSubmit={e => {e.preventDefault(); e.currentTarget.reset(); flash('You’re on the list. Keep an eye on your inbox!');}}><input type="email" placeholder="Your email address" required/><button className="button primary">Count me in <ArrowRight size={16}/></button></form><small>No noise, ever. Just a nice little letter.</small></section>
    </main>
    <footer><a className="brand" href="#home"><span className="brand-mark"><BookOpen size={19}/></span><span>book<span className="brand-light">haven</span><small>GOOD STORIES LIVE HERE</small></span></a><p>Made for the love of a good story. © 2025 Book Haven.</p><div><a href="#books">Shop</a><a href="#story">Our story</a><button onClick={() => setAdmin(true)}>Staff picks</button></div></footer>
    {drawer && <div className="overlay" onMouseDown={e => e.target === e.currentTarget && setDrawer(false)}><aside className="drawer"><div className="drawer-head"><div><span className="eyebrow">YOUR LITTLE STACK</span><h2>Your bag <span>({count})</span></h2></div><button className="icon-button" onClick={() => setDrawer(false)} aria-label="Close bag"><X/></button></div>{!checkout ? (cartItems.length ? <><div className="drawer-items">{cartItems.map(item => <div className="drawer-item" key={item.id}><Cover book={item}/><div className="drawer-item-info"><b>{item.title}</b><span>{item.author}</span><strong>{money(item.price)}</strong><div className="quantity"><button onClick={() => updateCart(item.id, -1)}><Minus size={13}/></button><span>{item.quantity}</span><button onClick={() => updateCart(item.id, 1)}><Plus size={13}/></button></div></div><button className="remove" onClick={() => setCart(prev => {const n={...prev};delete n[item.id];return n;})}><X size={15}/></button></div>)}</div><div className="drawer-bottom"><div className="shipping-note"><span>✳</span> {total >= 40 ? 'You unlocked free shipping!' : `You’re ${money(40-total)} away from free shipping.`}</div><div className="subtotal"><span>Subtotal</span><b>{money(total)}</b></div><small>Shipping and taxes calculated at checkout.</small><button className="button primary full" onClick={() => setCheckout(true)}>Continue to checkout <ArrowRight size={17}/></button></div></> : <div className="bag-empty"><span>♡</span><h3>Your next favorite is out there.</h3><p>Find a book that feels like you.</p><button className="button primary" onClick={() => {setDrawer(false); document.getElementById('books').scrollIntoView({behavior:'smooth'});}}>Explore the shelf <ArrowRight size={16}/></button></div>) : <form className="checkout-form" onSubmit={placeOrder}><button type="button" className="back-link" onClick={() => setCheckout(false)}>← Back to your bag</button><h3>Where should your books go?</h3><label>Your name<input required value={customer.customerName} onChange={e => setCustomer({...customer, customerName:e.target.value})}/></label><label>Email address<input type="email" required value={customer.email} onChange={e => setCustomer({...customer, email:e.target.value})}/></label><label>Shipping address<textarea required rows="3" value={customer.address} onChange={e => setCustomer({...customer,address:e.target.value})}/></label><div className="subtotal"><span>Total</span><b>{money(total)}</b></div><small>Demo checkout — no payment is collected.</small><button className="button primary full" disabled={busy}>{busy ? 'Placing your order…' : <>Place my order <ArrowRight size={17}/></>}</button></form>}</aside></div>}
    {admin && <div className="overlay" onMouseDown={e => e.target === e.currentTarget && setAdmin(false)}><section className="admin-panel"><div className="drawer-head"><div><span className="eyebrow">BOOK HAVEN STAFF</span><h2>Manage the shelf</h2></div><button className="icon-button" onClick={() => setAdmin(false)}><X/></button></div><p className="admin-intro">Add a new book to the catalog. Enter the admin key configured for your API.</p><form className="checkout-form" onSubmit={addBook}><label>Admin API key<input type="password" value={adminKey} onChange={e => setAdminKey(e.target.value)} required/></label><label>Book title<input name="title" required/></label><label>Author<input name="author" required/></label><div className="form-row"><label>Category<input name="category" required/></label><label>Price (USD)<input name="price" type="number" min="0.01" step="0.01" required/></label></div><label>Description<textarea name="description" rows="3"/></label><button className="button primary full">Add to the shelf <Plus size={16}/></button></form></section></div>}
    {notice && <div className="toast"><Check size={17}/>{notice}</div>}
  </>;
}
