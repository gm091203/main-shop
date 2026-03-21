import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ProductDetail from './pages/ProductDetail';
import SignupPayment from './pages/SignupPayment';
import MyPage from './pages/MyPage';
import OrderStatus from './pages/OrderStatus';
import AdminChat from './pages/AdminChat';
import AdminDashboard from './pages/AdminDashboard';
import AdminOrders from './pages/AdminOrders';
import AdminUsers from './pages/AdminUsers';
import Checkout from './pages/Checkout';
import Search from './pages/Search';

function App() {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // 현재 사용자/비회원에 대한 장바구니 키 생성
  const getCartKey = () => {
    const currentUserStr = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
    if (currentUserStr) {
      const currentUser = JSON.parse(currentUserStr);
      const uid = currentUser.uid || currentUser.id;
      return uid ? `cart_${uid}` : 'cart_guest';
    }
    return 'cart_guest';
  };

  // 장바구니 초기(및 갱신) 로드 함수
  const loadCart = () => {
    const cartKey = getCartKey();
    const savedCart = localStorage.getItem(cartKey);
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("장바구니 로드 실패:", e);
        setCartItems([]);
      }
    } else {
      setCartItems([]);
    }
  };

  useEffect(() => {
    // 초기 로드
    loadCart();

    // 탭 간 또는 로그인/로그아웃 등 커스텀 이벤트에 의한 스토리지 변경 감지
    const handleStorageChange = (e) => {
      // e.key가 없으면 현재 창에서 발생한 Event('storage')입니다 (로그인/로그아웃 트리거).
      // e.key가 있으면 다른 탭에서 발생한 실제 스토리지 변경 이벤트입니다.
      if (!e.key || e.key === getCartKey() || e.key === 'isLoggedIn' || e.key === 'currentUser') {
        loadCart();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const addToCart = (product) => {
    setCartItems(prev => {
      const quantityToAdd = product.quantity || 1;
      const existing = prev.find(item => item.id === product.id);
      let newCart;
      if (existing) {
        newCart = prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantityToAdd } : item);
      } else {
        newCart = [...prev, { ...product, quantity: quantityToAdd }];
      }
      localStorage.setItem(getCartKey(), JSON.stringify(newCart));
      return newCart;
    });
    setIsCartOpen(true); // 담으면 장바구니 열기
  };

  const removeFromCart = (id) => {
    setCartItems(prev => {
      const newCart = prev.filter(item => item.id !== id);
      localStorage.setItem(getCartKey(), JSON.stringify(newCart));
      return newCart;
    });
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout cartItems={cartItems} isCartOpen={isCartOpen} setIsCartOpen={setIsCartOpen} removeFromCart={removeFromCart} />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<SignUp />} />
          <Route path="signup/payment" element={<SignupPayment />} />
          <Route path="product/:id" element={<ProductDetail addToCart={addToCart} />} />
          <Route path="mypage" element={<MyPage />} />
          <Route path="orderstatus" element={<OrderStatus />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="search" element={<Search />} />
        </Route>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/chat" element={<AdminChat />} />
      </Routes>
    </Router>
  );
}

export default App;
